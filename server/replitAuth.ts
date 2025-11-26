import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // By default secure cookies are enabled in non-development modes.
      // Provide `SESSION_COOKIE_SECURE=true|false` to explicitly override for local testing.
      secure: (() => {
        if (typeof process.env.SESSION_COOKIE_SECURE !== 'undefined') {
          return process.env.SESSION_COOKIE_SECURE === 'true';
        }
        return process.env.NODE_ENV !== 'development';
      })(),
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // OIDC setup (optional) and other strategies
  let config: any = undefined;
  if (process.env.ISSUER_URL && process.env.REPL_ID) {
    config = await getOidcConfig();
  } else {
    console.warn("⚠️  OIDC not configured. Replit OIDC routes will be disabled in development.");
  }

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Google OAuth strategy (optional)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const base = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || '5000'}`;
    const googleCallback = process.env.GOOGLE_CALLBACK_URL || `${base}/api/auth/google/callback`;

    interface GoogleProfile {
      id: string;
      displayName?: string;
      name?: {
        givenName?: string;
        familyName?: string;
      };
      emails?: Array<{
        value: string;
        verified?: boolean;
      }>;
      photos?: Array<{
        value: string;
      }>;
    }

    interface GoogleClaims {
      sub: string;
      email?: string;
      first_name: string;
      last_name: string;
      profile_image_url?: string;
    }

    interface GoogleUser {
      claims: GoogleClaims;
      access_token: string;
      refresh_token: string;
    }

    passport.use(new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: googleCallback,
      },
      // verify
      async (
        accessToken: string,
        refreshToken: string,
        profile: GoogleProfile,
        done: (err: Error | null, user?: GoogleUser) => void
      ): Promise<void> => {
        try {
          const email = profile.emails?.[0]?.value;
          const claims: GoogleClaims = {
            sub: `google:${profile.id}`,
            email,
            first_name: profile.name?.givenName || "",
            last_name: profile.name?.familyName || "",
            profile_image_url: profile.photos?.[0]?.value,
          };

          await upsertUser(claims);

          const user: GoogleUser = { claims, access_token: accessToken, refresh_token: refreshToken };
          done(null, user);
        } catch (err) {
          done(err as Error);
        }
      }
    ));
  }

  app.get("/api/login", (req, res, next) => {
    // If OIDC is configured use that as default
    if (config) {
      ensureStrategy(req.hostname);
      passport.authenticate(`replitauth:${req.hostname}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
      return;
    }

    // Otherwise redirect to local login page (frontend should POST /api/auth/login)
    res.status(400).json({ message: "OIDC not configured. Use local auth or Google if configured." });
  });

  app.get("/api/callback", (req, res, next) => {
    if (!config) {
      res.status(400).json({ message: "OIDC not configured" });
      return;
    }
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      if (config) {
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href
        );
        return;
      }
      res.redirect("/");
    });
  });

  // Google OAuth routes (if strategy registered)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
    app.get('/api/auth/google/callback', passport.authenticate('google', { successReturnToOrRedirect: '/', failureRedirect: '/api/login' }));
  }

  // Local username/password registration
  app.post('/api/auth/register', async (req: any, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      if (!email || !password) {
        res.status(400).json({ message: 'Email and password required' });
        return;
      }

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        res.status(400).json({ message: 'User already exists' });
        return;
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const user = await storage.upsertUser({
        email,
        passwordHash,
        firstName: firstName || '',
        lastName: lastName || '',
      } as any);

      // Auto-login after registration
      req.logIn({ claims: { sub: user.id, email: user.email, first_name: user.firstName, last_name: user.lastName } }, (err: any) => {
        if (err) {
          res.status(500).json({ message: 'Registration succeeded but login failed' });
          return;
        }
        res.json({ id: user.id, email: user.email });
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Local username/password login
  app.post('/api/auth/login', async (req: any, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ message: 'Email and password required' });
        return;
      }

      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      // Normalize session user to include claims for downstream code
      const claims = { sub: user.id, email: user.email, first_name: user.firstName, last_name: user.lastName };
      req.logIn({ claims } as any, (err: any) => {
        if (err) return next(err);
        res.json({ id: user.id, email: user.email });
      });
    } catch (err: any) {
      next(err);
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Development-mode mock user when OIDC completely disabled
  if (!process.env.ISSUER_URL || !process.env.REPL_ID) {
    const devId = process.env.DEV_USER_ID || "dev-user";
    const devClaims = {
      sub: devId,
      email: process.env.DEV_USER_EMAIL || "dev@example.com",
      first_name: process.env.DEV_USER_FIRST_NAME || "Dev",
      last_name: process.env.DEV_USER_LAST_NAME || "User",
      profile_image_url: process.env.DEV_USER_AVATAR || "",
    };

    try {
      await storage.upsertUser({
        id: devClaims.sub,
        email: devClaims.email,
        firstName: devClaims.first_name,
        lastName: devClaims.last_name,
        profileImageUrl: devClaims.profile_image_url,
      });
    } catch (err) {
      console.warn("Failed to upsert dev user:", err);
    }

    req.user = (req.user || { claims: devClaims }) as any;
    return next();
  }

  // For normal operation require passport session
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;

  // If the session contains OIDC-style tokens, keep the existing refresh logic
  if (user && user.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    if (now <= user.expires_at) {
      return next();
    }

    const refreshToken = user.refresh_token;
    if (!refreshToken) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      const config = await getOidcConfig();
      const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
      updateUserSession(user, tokenResponse);
      return next();
    } catch (error) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
  }

  // Otherwise assume a local or Google session: ensure claims exist and upsert user record
  if (user && user.claims && user.claims.sub) {
    try {
      await storage.upsertUser({
        id: user.claims.sub,
        email: user.claims.email,
        firstName: user.claims.first_name || "",
        lastName: user.claims.last_name || "",
        profileImageUrl: user.claims.profile_image_url || "",
      } as any);
    } catch (err) {
      console.warn("Failed to upsert session user:", err);
    }
    return next();
  }

  return res.status(401).json({ message: "Unauthorized" });
};
