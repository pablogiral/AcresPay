import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || 'Error al registrar');
        setLoading(false);
        return;
      }

      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Error de red');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-card rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Crear cuenta</h2>
        {error && <div className="text-destructive mb-3">{error}</div>}
        <form onSubmit={submit}>
          <label className="block text-sm mb-1">Nombre</label>
          <Input value={firstName} onChange={(e: any) => setFirstName(e.target.value)} />
          <label className="block text-sm mb-1 mt-3">Apellido</label>
          <Input value={lastName} onChange={(e: any) => setLastName(e.target.value)} />
          <label className="block text-sm mb-1 mt-3">Email</label>
          <Input value={email} onChange={(e: any) => setEmail(e.target.value)} />
          <label className="block text-sm mb-1 mt-3">Contraseña</label>
          <Input type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} />
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={loading}>{loading ? 'Cargando...' : 'Crear cuenta'}</Button>
            <Button variant="secondary" onClick={() => window.location.href = '/auth/login'}>Volver</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
