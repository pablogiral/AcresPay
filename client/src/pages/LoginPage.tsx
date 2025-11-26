import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || 'Error de autenticación');
        setLoading(false);
        return;
      }

      // on success, reload to fetch user
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Error de red');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-card rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Iniciar sesión</h2>
        {error && <div className="text-destructive mb-3">{error}</div>}
        <form onSubmit={submit}>
          <label className="block text-sm mb-1">Email</label>
          <Input value={email} onChange={(e: any) => setEmail(e.target.value)} />
          <label className="block text-sm mb-1 mt-3">Contraseña</label>
          <Input type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} />
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={loading}>{loading ? 'Cargando...' : 'Iniciar sesión'}</Button>
            <Button variant="secondary" onClick={() => window.location.href = '/'}>Volver</Button>
          </div>
        </form>

        <div className="mt-6">
          <div className="text-sm text-muted-foreground mb-2">O inicia con:</div>
          <div className="flex gap-2">
            <Button onClick={() => (window.location.href = '/api/auth/google')}>Google</Button>
            <Button variant="ghost" onClick={() => (window.location.href = '/api/login')}>Replit OIDC</Button>
          </div>
          <div className="mt-4 text-sm">
            ¿No tienes cuenta? <a className="text-primary underline" href="/auth/register">Regístrate</a>
          </div>
        </div>
      </div>
    </div>
  );
}
