import { INSIGNIAS, MAX_CAZAS_CON_PUNTOS, PUNTOS_MAKIGAMI, calcularEstadisticas } from '@/lib/nexa/makigami';
import { cn } from '@/lib/utils';
import type { CazaVista, PropuestaVista } from './tipos';

const MEDALLAS = ['🥇', '🥈', '🥉'];

/**
 * Ranking del reto. Los puntos son los que este reto entrega (en juego
 * mientras la fase siga abierta; ya sumados al ranking de Nexa al cerrarla).
 */
export function RankingReto({
  cazas,
  propuestas,
  miColaboradorId,
  puntosEntregados,
}: {
  cazas: CazaVista[];
  propuestas: PropuestaVista[];
  miColaboradorId: string | null;
  puntosEntregados: boolean;
}) {
  const stats = calcularEstadisticas(cazas, propuestas);
  const nombres = new Map<string, string>();
  for (const c of cazas) nombres.set(c.colaborador_id, c.colaborador_nombre);
  for (const p of propuestas) nombres.set(p.colaborador_id, p.colaborador_nombre);
  const propuestasValidas = new Map<string, number>();
  for (const p of propuestas) if (p.estado !== 'descartada') propuestasValidas.set(p.colaborador_id, (propuestasValidas.get(p.colaborador_id) ?? 0) + 1);

  const filas = Array.from(stats.entries())
    .map(([id, s]) => ({
      id,
      nombre: nombres.get(id) ?? '—',
      stats: s,
      puntos:
        Math.min(s.cazas, MAX_CAZAS_CON_PUNTOS) * PUNTOS_MAKIGAMI.cazarDesperdicio +
        s.pionerosValidados * PUNTOS_MAKIGAMI.hallazgoValidado +
        (propuestasValidas.get(id) ?? 0) * PUNTOS_MAKIGAMI.proponerMejora +
        s.propuestasAprobadas * PUNTOS_MAKIGAMI.propuestaAprobada,
      insignias: INSIGNIAS.filter((i) => i.logrado(s)),
    }))
    .sort((a, b) => b.puntos - a.puntos || b.stats.cazas - a.stats.cazas);

  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-display font-semibold text-secundario">🏆 Cazadores de este reto</h2>
        <span className="text-[11px] text-marmol-400">{puntosEntregados ? 'Puntos ya sumados en Reconocimientos' : 'Puntos en juego'}</span>
      </div>
      {filas.length === 0 ? (
        <p className="text-sm text-marmol-400">Nadie ha cazado todavía. ¡El primero se lleva el título de pionero!</p>
      ) : (
        <ol className="space-y-1.5">
          {filas.slice(0, 10).map((f, i) => (
            <li
              key={f.id}
              className={cn('flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm', f.id === miColaboradorId ? 'bg-flow-50 ring-1 ring-flow-200' : i < 3 && 'bg-marmol-50')}
            >
              <span className="w-6 text-center">{MEDALLAS[i] ?? <span className="text-xs text-marmol-400">{i + 1}</span>}</span>
              <span className="min-w-0 flex-1 truncate font-medium text-marmol-800">
                {f.nombre}
                {f.insignias.map((ins) => (
                  <span key={ins.id} className="ml-1" title={`${ins.nombre}: ${ins.descripcion}`}>
                    {ins.emoji}
                  </span>
                ))}
              </span>
              <span className="text-xs text-marmol-400" title="Cazas · pionero validado">
                🎯{f.stats.cazas}
                {f.stats.pionerosValidados > 0 && ` · 🦅${f.stats.pionerosValidados}`}
              </span>
              <span className="w-14 text-right font-display font-semibold text-flow-700">{f.puntos} pts</span>
            </li>
          ))}
        </ol>
      )}
      <div className="mt-4 grid grid-cols-2 gap-1.5 border-t border-marmol-100 pt-3">
        {INSIGNIAS.map((ins) => (
          <div key={ins.id} className="flex items-start gap-1.5 text-[11px] text-marmol-500">
            <span className="text-base leading-none">{ins.emoji}</span>
            <span>
              <strong className="text-marmol-700">{ins.nombre}</strong> · {ins.descripcion}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
