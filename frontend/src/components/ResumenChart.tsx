// ============================================================
// ResumenChart.tsx
// Grafico de barras para el resumen financiero
// ESTADO: a medias — NO conectado a ninguna pantalla todavia
// Ver ticket DAEM-201: "Anadir grafico al modulo de resumen"
// ============================================================
import { useState } from 'react';

// TODO: reemplazar este tipo por el de types/index.ts cuando se conecte
interface DatoGrafico {
  mes: number;
  ingresos: number;
  gastos: number;
}

interface ResumenChartProps {
  datos: DatoGrafico[];
  // TODO: anadir prop de ejercicio cuando se conecte al estado global
}

// NOTA: este componente usa datos hardcodeados de ejemplo
// porque todavia no esta conectado al endpoint real
const DATOS_EJEMPLO: DatoGrafico[] = [
  { mes: 1, ingresos: 12500, gastos: 3200 },
  { mes: 2, ingresos: 4800, gastos: 5100 },
  { mes: 3, ingresos: 18000, gastos: 1800 },
];

export function ResumenChart({ datos = DATOS_EJEMPLO }: ResumenChartProps) {
  const [mesSeleccionado, setMesSeleccionado] = useState<number | null>(null);

  const maxValor = Math.max(
    ...datos.flatMap(d => [d.ingresos, d.gastos]),
  );

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        Evolucion mensual
      </h3>
      <div className="flex items-end gap-2" style={{ height: 120 }}>
        {datos.map(d => (
          <div
            key={d.mes}
            className="flex flex-1 flex-col items-center gap-1 cursor-pointer"
            onClick={() => setMesSeleccionado(d.mes === mesSeleccionado ? null : d.mes)}
          >
            <div className="flex w-full gap-0.5" style={{ height: 100 }}>
              <div
                className="flex-1 rounded-t bg-blue-400"
                style={{ height: `${(d.ingresos / maxValor) * 100}%`, alignSelf: 'flex-end' }}
              />
              <div
                className="flex-1 rounded-t bg-red-300"
                style={{ height: `${(d.gastos / maxValor) * 100}%`, alignSelf: 'flex-end' }}
              />
            </div>
            <span className="text-xs text-gray-500">{d.mes}</span>
          </div>
        ))}
      </div>
      {/* TODO: anadir leyenda y tooltip cuando se conecte al estado real */}
      {/* TODO: anadir animacion de entrada */}
    </div>
  );
}

// Este componente no esta importado en ninguna pantalla todavia
// Para usarlo: import { ResumenChart } from './ResumenChart'
