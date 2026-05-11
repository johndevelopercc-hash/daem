import { useEffect, useState } from 'react';
import type { Empresa, FreshnessStatus } from '../types';
import { fetchEmpresas } from '../services/api';

// Calcula el estado de frescura basado en ultima_sync
// BUG-10: El calculo es incorrecto — usa minutos pero la comparacion esta invertida.
// ok deberia ser < 5 min, warning entre 5 y 30, stale > 30.
// Actualmente ok es > 30 min (invertido).
function getFreshness(ultima_sync: string): FreshnessStatus {
  const diff = (Date.now() - new Date(ultima_sync).getTime()) / 1000 / 60;
  if (diff > 30) return 'stale';
  if (diff > 5) return 'warning';
  return 'ok';
}

const freshnessColor: Record<FreshnessStatus, string> = {
  ok: 'bg-green-100 text-green-800 border-green-300',
  warning: 'bg-amber-100 text-amber-800 border-amber-300',
  stale: 'bg-red-100 text-red-800 border-red-300',
};

const freshnessLabel: Record<FreshnessStatus, string> = {
  ok: 'Actualizado',
  warning: 'Con retraso',
  stale: 'Desactualizado',
};

interface EmpresaSelectorProps {
  onSelect: (empresa: Empresa) => void;
}

export function EmpresaSelector({ onSelect }: EmpresaSelectorProps) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmpresas()
      .then(setEmpresas)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded bg-red-50 px-4 py-3 text-sm text-red-700">
        Error al cargar las empresas: {error}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {empresas.map(empresa => {
        const freshness = getFreshness(empresa.ultima_sync);
        return (
          <button
            key={empresa.id}
            onClick={() => onSelect(empresa)}
            className="rounded-lg border p-4 text-left shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{empresa.nombre}</p>
                <p className="text-sm text-gray-500">{empresa.nif}</p>
                <span className="mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-100">
                  {empresa.programa}
                </span>
              </div>
              <span className={`rounded border px-2 py-0.5 text-xs font-medium ${freshnessColor[freshness]}`}>
                {freshnessLabel[freshness]}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
