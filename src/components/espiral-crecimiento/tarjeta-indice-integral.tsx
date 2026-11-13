import { AlertTriangle, Info } from 'lucide-react';
import { SemaforoBadge } from '@/components/espiral-crecimiento/semaforo-badge';
import { cn } from '@/lib/utils';
import { ETIQUETA_NIVEL } from '@/lib/competencias/nivel-cargo';
import type { DesempenoIntegral } from '@/lib/desempeno/cargar-integral';

const NOMBRE: Record<string, string> = { saber: 'Saber', hacer: 'Hacer', deber: 'Deber' };

/**
 * Índice de desempeño integral: síntesis de Saber, Hacer y Deber con los pesos del nivel del cargo, mostrando
 * los criterios que lo explican. El Ser no entra: se lee en paralelo, sin nota.
 */
export function TarjetaIndiceIntegral({ datos }: { datos: DesempenoIntegral }) {
  const { integral, criteriosCriticos } = datos;
  if (integral.indice == null) return null;

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display font-semibold text-secundario">Índice de desempeño integral</h2>
          <p className="text-xs text-marmol-500 mt-0.5">
            Síntesis de Saber, Hacer y Deber para un cargo de nivel <strong>{ETIQUETA_NIVEL[datos.nivelCargo]}</strong>
            {datos.pesosPersonalizados ? '' : ' (con los pesos de partida: 25 % · 40 % · 35 %)'}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-display text-3xl font-bold text-secundario">{integral.indice}</span>
          {integral.semaforo ? (
            <SemaforoBadge nivel={integral.semaforo} />
          ) : (
            <span className="text-xs text-marmol-500 max-w-[11rem]">Sin semáforo todavía: falta la valoración de Hacer y Deber.</span>
          )}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
            <th className="py-2 font-medium">Dimensión</th>
            <th className="py-2 font-medium text-center">Valor (1-5)</th>
            <th className="py-2 font-medium text-center">Peso</th>
            <th className="py-2 font-medium text-center">Aporte</th>
          </tr>
        </thead>
        <tbody>
          {integral.aportes.map((a) => (
            <tr key={a.dimension} className="border-b border-marmol-100 last:border-0">
              <td className="py-2 text-marmol-800">
                {NOMBRE[a.dimension]}
                {a.dimension === 'saber' && datos.saberPct != null && <span className="text-xs text-marmol-400"> · cumple {datos.saberPct} % del perfil</span>}
              </td>
              <td className="py-2 text-center text-marmol-700">{a.valor ?? '—'}</td>
              <td className="py-2 text-center text-marmol-600">
                {a.pesoEfectivo > 0 ? `${a.pesoEfectivo} %` : '—'}
                {a.pesoEfectivo > 0 && Math.abs(a.pesoEfectivo - a.pesoConfigurado) > 0.01 && <span className="text-xs text-marmol-400"> (de {a.pesoConfigurado} %)</span>}
              </td>
              <td className="py-2 text-center font-medium text-marmol-800">{a.aporte ?? '—'}</td>
            </tr>
          ))}
          <tr>
            <td className="pt-2 font-medium text-marmol-800">Total</td>
            <td />
            <td className="pt-2 text-center text-marmol-600">100 %</td>
            <td className="pt-2 text-center font-display font-semibold text-secundario">{integral.indice}</td>
          </tr>
        </tbody>
      </table>

      {integral.incompleto && (
        <p className="text-xs text-medio bg-medio/10 border border-medio/20 rounded-lg px-3 py-2 flex gap-2">
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>
            Resultado incompleto: aún no hay dato de {integral.dimensionesSinDato.map((d) => NOMBRE[d]).join(' ni de ')}. El índice se calculó con las demás dimensiones, reescalando sus pesos; no se trató la falta de dato como cero.
          </span>
        </p>
      )}

      {criteriosCriticos.length > 0 && (
        <div className="rounded-lg border border-bajo/30 bg-red-50 px-3 py-2.5 space-y-1.5">
          <p className="text-sm font-medium text-bajo flex items-center gap-1.5">
            <AlertTriangle size={14} /> Criterios críticos por debajo del mínimo
          </p>
          <p className="text-xs text-marmol-600">Una nota general aceptable no debe ocultar un incumplimiento en un criterio que la empresa definió como crítico.</p>
          <ul className="text-xs text-marmol-700 space-y-1">
            {criteriosCriticos.map((c) => (
              <li key={c.titulo}>
                <strong>{c.titulo}</strong>: nota consolidada {c.consolidada} (mínimo {c.umbral}).
                {c.justificacion && <span className="text-marmol-500"> {c.justificacion}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className={cn('text-xs text-marmol-400')}>
        Fórmula: Σ (valor × peso efectivo). El Saber se lleva a la escala de 1 a 5 de forma lineal (0 % = 1, 100 % = 5). El Ser no entra en este índice: se lee en paralelo, con sus hallazgos, y nunca se suma a las otras dimensiones.
      </p>
    </div>
  );
}
