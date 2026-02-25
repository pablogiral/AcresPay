import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

let appPromise: Promise<express.Express> | null = null;

async function getApp(): Promise<express.Express> {
  if (appPromise) {
    return appPromise;
  }

  appPromise = (async () => {
    const app = express();

    app.use(
      express.json({
        verify: (req, _res, buf) => {
          req.rawBody = buf;
        },
      }),
    );
    app.use(express.urlencoded({ extended: false }));

    await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    return app;
  })();

  return appPromise;
}

export default async function handler(req: any, res: any) {
  const app = await getApp();
  return app(req, res);
}
