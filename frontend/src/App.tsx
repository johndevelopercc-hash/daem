import { useState, FormEvent } from 'react';
import type { Empresa, ResumenFinanciero } from './types';
import { login, fetchResumen } from './services/api';
import { EmpresaSelector } from './components/EmpresaSelector';
import { formatImporte, nombreMes } from './lib/formatters';

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      onLogin();
    } catch {
      setError('Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border bg-white p-8 shadow-sm"
      >
        <h1 className="mb-6 text-xl font-bold text-gray-900">Portal DAEM</h1>
        {error && (
          <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

function ResumenView({
  empresa,
  onBack,
}: {
  empresa: Empresa;
  onBack: () => void;
}) {
  const now = new Date();
  const [ejercicio, setEjercicio] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [resumen, setResumen] = useState<ResumenFinanciero | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchResumen(empresa.id, ejercicio, mes);
      setResumen(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar resumen');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <button
        onClick={onBack}
        className="mb-4 text-sm text-blue-600 hover:underline"
      >
        ← Volver
      </button>
      <h2 className="mb-1 text-lg font-bold text-gray-900">{empresa.nombre}</h2>
      <p className="mb-6 text-sm text-gray-500">{empresa.nif} · {empresa.programa}</p>

      <div className="mb-4 flex gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Ejercicio</label>
          <input
            type="number"
            value={ejercicio}
            onChange={e => setEjercicio(Number(e.target.value))}
            className="w-24 rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Mes</label>
          <select
            value={mes}
            onChange={e => setMes(Number(e.target.value))}
            className="rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{nombreMes(m)}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={cargar}
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Consultar'}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {resumen && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-gray-500">Ingresos</p>
            <p className="mt-1 text-lg font-semibold text-green-700">
              {formatImporte(resumen.total_ingresos)}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-gray-500">Gastos</p>
            <p className="mt-1 text-lg font-semibold text-red-700">
              {formatImporte(resumen.total_gastos)}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-gray-500">Resultado</p>
            <p className={`mt-1 text-lg font-semibold ${resumen.resultado >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              {formatImporte(resumen.resultado)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token'),
  );
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa | null>(null);

  if (!token) {
    return <LoginForm onLogin={() => setToken(localStorage.getItem('token'))} />;
  }

  if (empresaSeleccionada) {
    return (
      <ResumenView
        empresa={empresaSeleccionada}
        onBack={() => setEmpresaSeleccionada(null)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Empresas</h1>
        <button
          onClick={() => {
            localStorage.removeItem('token');
            setToken(null);
          }}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          Cerrar sesión
        </button>
      </div>
      <EmpresaSelector onSelect={setEmpresaSeleccionada} />
    </div>
  );
}
