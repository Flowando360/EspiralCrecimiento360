'use client';

import { useState } from 'react';

interface FilaPuntos {
  id: string;
  nombre: string;
  puntos: number;
}

interface FilaCumplimiento {
  colaboradorId: string;
  nombre: string;
  asignados: number;
  cumplidos: number;
  tasa: number;
}

export function RankingTabs({
  rankingPuntos,
  miColaboradorId,
  rankingCumplimiento,
}: {
  rankingPuntos: FilaPuntos[];
  miColaboradorId: string | null;
  rankingCumplimiento: FilaCumplimiento[];
}) {
  const [tab, setTab] = useState<'puntos' | 'cumplimiento'>('puntos');

  const top10Puntos = rankingPuntos.slice(0, 10);
  const miPosicionPuntos = miColaboradorId ? rankingPuntos.findIndex((r) => r.id === miColaboradorId) : -1;
  const fueraDelTop10Puntos = miPosicionPuntos >= 10;

  const top10Cumplimiento = rankingCumplimiento.slice(0, 10);
  const miPosicionCumplimiento = miColaboradorId ? rankingCumplimiento.findIndex((r) => r.colaboradorId === miColaboradorId) : -1;
  const fueraDelTop10Cumplimiento = miPosicionCumplimiento >= 10;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-secundario">Ranking</h2>
        <div className="flex text-xs rounded-lg border border-marmol-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setTab('puntos')}
            className={`px-2.5 py-1 ${tab === 'puntos' ? 'bg-flow-500 text-white' : 'text-marmol-500'}`}
          >
            Por puntos
          </button>
          <button
            type="button"
            onClick={() => setTab('cumplimiento')}
            className={`px-2.5 py-1 ${tab === 'cumplimiento' ? 'bg-flow-500 text-white' : 'text-marmol-500'}`}
            title="% de riesgos y ACPM asignados que están al día — no penaliza a quien lidera un proceso de 1-2 personas"
          >
            Por cumplimiento
          </button>
        </div>
      </div>

      {tab === 'puntos' ? (
        <>
          {top10Puntos.length === 0 ? (
            <p className="text-sm text-marmol-400">Sin reconocimientos otorgados aún.</p>
          ) : (
            <ol className="space-y-2">
              {top10Puntos.map((r, i) => (
                <li
                  key={r.id}
                  className={`flex items-center justify-between text-sm rounded-lg ${r.id === miColaboradorId ? 'bg-acento/20 px-2 py-1 -mx-2' : ''}`}
                >
                  <span className="text-marmol-700">
                    <span className="text-marmol-400 mr-2">{i + 1}.</span>
                    {r.nombre}
                  </span>
                  <span className="rounded-full bg-crecimiento text-white text-xs font-medium px-2.5 py-0.5">{r.puntos} pts</span>
                </li>
              ))}
            </ol>
          )}
          {fueraDelTop10Puntos && (
            <p className="text-xs text-marmol-500 mt-3 pt-3 border-t border-marmol-100">
              Tu posición: <span className="font-medium text-marmol-700">#{miPosicionPuntos + 1}</span> con{' '}
              <span className="font-medium text-marmol-700">{rankingPuntos[miPosicionPuntos]?.puntos} pts</span>
            </p>
          )}
        </>
      ) : (
        <>
          <p className="text-xs text-marmol-400 mb-3">
            % de riesgos y ACPM asignados que están al día, no puntos acumulados — así un proceso de 1-2 personas compite en igualdad
            con uno de 8.
          </p>
          {top10Cumplimiento.length === 0 ? (
            <p className="text-sm text-marmol-400">
              Todavía nadie tiene riesgos u ACPM asignados que ya debieran estar resueltos.
            </p>
          ) : (
            <ol className="space-y-2">
              {top10Cumplimiento.map((r, i) => (
                <li
                  key={r.colaboradorId}
                  className={`flex items-center justify-between text-sm rounded-lg ${r.colaboradorId === miColaboradorId ? 'bg-acento/20 px-2 py-1 -mx-2' : ''}`}
                >
                  <span className="text-marmol-700">
                    <span className="text-marmol-400 mr-2">{i + 1}.</span>
                    {r.nombre}
                    <span className="text-marmol-400 text-xs ml-1.5">
                      ({r.cumplidos}/{r.asignados})
                    </span>
                  </span>
                  <span className="rounded-full bg-crecimiento text-white text-xs font-medium px-2.5 py-0.5">{r.tasa}%</span>
                </li>
              ))}
            </ol>
          )}
          {fueraDelTop10Cumplimiento && (
            <p className="text-xs text-marmol-500 mt-3 pt-3 border-t border-marmol-100">
              Tu posición: <span className="font-medium text-marmol-700">#{miPosicionCumplimiento + 1}</span> con{' '}
              <span className="font-medium text-marmol-700">{rankingCumplimiento[miPosicionCumplimiento]?.tasa}%</span>
            </p>
          )}
        </>
      )}
    </div>
  );
}
