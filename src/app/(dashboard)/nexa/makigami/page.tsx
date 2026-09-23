import Link from 'next/link';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { FormularioReto } from '@/components/makigami/formulario-reto';
import {
  DESPERDICIOS,
  ETAPAS_RETO,
  INSIGNIAS,
  TIPOS_DESPERDICIO,
  calcularEstadisticas,
  calcularMetricas,
  formatearDuracion,
  type Clasificacion,
  type EstadoReto,
} from '@/lib/nexa/makigami';
import { formatearFecha, cn } from '@/lib/utils';

const TONO_ESTADO: Record<EstadoReto, string> = {
  mapeo: 'bg-marmol-100 text-marmol-600',
  caceria: 'bg-orange-100 text-orange-700',
  rediseno: 'bg-blue-100 text-deber',
  cerrado: 'bg-flow-100 text-flow-700',
};

const ETIQUETA_ESTADO: Record<EstadoReto, string> = {
  mapeo: '✏️ En mapeo',
  caceria: '🎯 Cacería abierta',
  rediseno: '💡 En rediseño',
  cerrado: '🎉 Cerrado',
};

export default async function MakigamiPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();
  const { data: retos } = await supabase
    .from('nexa_makigami_retos')
    .select('id, titulo, descripcion, estado, fecha_limite, created_at, proceso:proceso_id(nombre, codigo)')
    .eq('empresa_id', perfil.empresa_id)
    .order('created_at', { ascending: false });

  const ids: string[] = (retos ?? []).map((r: any) => r.id);
  const [{ data: pasos }, { data: cazas }, { data: propuestas }] = ids.length
    ? await Promise.all([
        supabase.from('nexa_makigami_pasos').select('id, reto_id, tiempo_trabajo_min, tiempo_espera_min, clasificacion').in('reto_id', ids),
        supabase.from('nexa_makigami_cazas').select('reto_id, paso_id, colaborador_id, tipo_desperdicio, created_at, colaborador:colaborador_id(nombre_completo)').in('reto_id', ids),
        supabase.from('nexa_makigami_propuestas').select('reto_id, colaborador_id, estado, ahorro_estimado_min').in('reto_id', ids),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const esFacilitadorPosible = perfil.rol === 'admin_th' || perfil.rol === 'lider';
  let procesos: { id: string; nombre: string; codigo: string | null }[] = [];
  if (esFacilitadorPosible) {
    const { data } = await supabase.from('procesos_gestion').select('id, nombre, codigo').eq('empresa_id', perfil.empresa_id).order('codigo');
    procesos = data ?? [];
  }

  // Insignias y ranking global de la cacería (todas las cacerías de la empresa)
  const stats = calcularEstadisticas(cazas ?? [], (propuestas ?? []).map((p: any) => ({ ...p, ahorro_estimado_min: Number(p.ahorro_estimado_min) || 0 })));
  const misStats = perfil.colaborador_id ? stats.get(perfil.colaborador_id) : undefined;
  const nombres = new Map<string, string>((cazas ?? []).map((c: any) => [c.colaborador_id, c.colaborador?.nombre_completo ?? '—']));
  const topCazadores = Array.from(stats.entries())
    .map(([id, s]) => ({ id, nombre: nombres.get(id) ?? '—', s, insignias: INSIGNIAS.filter((i) => i.logrado(s)) }))
    .filter((f) => f.s.cazas > 0)
    .sort((a, b) => b.s.pionerosValidados - a.s.pionerosValidados || b.s.cazas - a.s.cazas)
    .slice(0, 5);

  const ahorroTotal = (propuestas ?? [])
    .filter((p: any) => p.estado === 'aprobada')
    .reduce((s: number, p: any) => s + (Number(p.ahorro_estimado_min) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-crecimiento px-6 py-7 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-6 -top-8 select-none text-[9rem] leading-none opacity-15" aria-hidden>
          🎯
        </div>
        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-acento">Nexa · Formación Lean</p>
          <h1 className="mt-1 font-display text-3xl font-bold">Cacería Makigami</h1>
          <p className="mt-2 text-sm text-white/85">
            Dibujamos un proceso real de la empresa en un gran rollo de papel digital —quién hace qué, cuánto tarda, cuánto espera— y todo el equipo sale
            a cazar los desperdicios escondidos. Las mejores ideas se votan, se aprueban y se convierten en mejoras reales.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {esFacilitadorPosible && <FormularioReto procesos={procesos} />}
            {ahorroTotal > 0 && (
              <span className="rounded-full bg-white/15 px-3 py-1 text-sm">
                ⚡ <strong>{formatearDuracion(ahorroTotal)}</strong> ahorrados entre todos hasta hoy
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        {/* Retos */}
        <div className="space-y-3">
          <h2 className="font-display font-semibold text-secundario">Retos</h2>
          {!retos || retos.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-3xl">🗺️</p>
              <p className="mt-2 text-sm font-medium text-marmol-700">Todavía no hay retos Makigami</p>
              <p className="mt-1 text-xs text-marmol-400">
                {esFacilitadorPosible ? 'Crea el primero con “Nuevo reto” y dibuja un proceso que todos conozcan.' : 'Cuando Talento Humano o un líder abra uno, aparecerá aquí.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {retos.map((r: any) => {
                const pasosReto = (pasos ?? []).filter((p: any) => p.reto_id === r.id);
                const cazasReto = (cazas ?? []).filter((c: any) => c.reto_id === r.id);
                const m = calcularMetricas(
                  pasosReto.map((p: any) => ({ ...p, clasificacion: p.clasificacion as Clasificacion | null }))
                );
                const cazadores = new Set(cazasReto.map((c: any) => c.colaborador_id)).size;
                const idxEtapa = ETAPAS_RETO.findIndex((e) => e.estado === r.estado);
                return (
                  <Link key={r.id} href={`/nexa/makigami/${r.id}`} className="card group p-4 transition hover:-translate-y-0.5 hover:border-flow-300 hover:shadow-md">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', TONO_ESTADO[r.estado as EstadoReto])}>
                        {ETIQUETA_ESTADO[r.estado as EstadoReto]}
                      </span>
                      {r.fecha_limite && r.estado === 'caceria' && <span className="text-[11px] text-marmol-400">Hasta {formatearFecha(r.fecha_limite)}</span>}
                    </div>
                    <h3 className="mt-2 font-medium text-marmol-900 group-hover:text-secundario">{r.titulo}</h3>
                    {r.proceso && (
                      <p className="text-xs text-marmol-400">
                        {r.proceso.codigo ? `${r.proceso.codigo} · ` : ''}
                        {r.proceso.nombre}
                      </p>
                    )}
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="font-display font-semibold text-secundario">{pasosReto.length}</p>
                        <p className="text-[10px] text-marmol-400">pasos</p>
                      </div>
                      <div>
                        <p className="font-display font-semibold text-bajo">{cazasReto.length}</p>
                        <p className="text-[10px] text-marmol-400">cazas</p>
                      </div>
                      <div>
                        <p className="font-display font-semibold text-flow-700">{cazadores}</p>
                        <p className="text-[10px] text-marmol-400">cazadores</p>
                      </div>
                    </div>
                    {m.tiempoTotal > 0 && (
                      <p className="mt-2 text-xs text-marmol-500">
                        ⏱ {formatearDuracion(m.tiempoTotal)} de proceso · solo <strong className="text-flow-700">{m.eficiencia < 1 ? '<1' : Math.round(m.eficiencia)}%</strong> agrega valor
                      </p>
                    )}
                    <div className="mt-3 flex gap-1">
                      {ETAPAS_RETO.map((e, i) => (
                        <div key={e.estado} className={cn('h-1 flex-1 rounded-full', i <= idxEtapa ? 'bg-flow-500' : 'bg-marmol-200')} />
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Lateral: mis insignias + mejores cazadores */}
        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="font-display font-semibold text-secundario">Mis insignias</h2>
            {misStats && (
              <p className="mt-0.5 text-xs text-marmol-500">
                🎯 {misStats.cazas} cazas · 🦅 {misStats.pionerosValidados} como pionero · 🧠 {misStats.propuestasAprobadas} mejoras aprobadas
              </p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {INSIGNIAS.map((ins) => {
                const logrado = misStats ? ins.logrado(misStats) : false;
                return (
                  <div
                    key={ins.id}
                    title={ins.descripcion}
                    className={cn(
                      'rounded-xl border p-2.5 text-center transition',
                      logrado ? 'border-acento bg-gradient-to-b from-lime-50 to-white shadow-sm' : 'border-marmol-200 opacity-45 grayscale'
                    )}
                  >
                    <p className="text-2xl">{ins.emoji}</p>
                    <p className="text-xs font-semibold text-marmol-800">{ins.nombre}</p>
                    <p className="text-[10px] leading-tight text-marmol-400">{ins.descripcion}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {topCazadores.length > 0 && (
            <div className="card p-4">
              <h2 className="font-display font-semibold text-secundario">🦅 Mejores cazadores</h2>
              <ol className="mt-2 space-y-1.5">
                {topCazadores.map((f, i) => (
                  <li key={f.id} className="flex items-center gap-2 text-sm">
                    <span className="w-5 text-center">{['🥇', '🥈', '🥉'][i] ?? i + 1}</span>
                    <span className="flex-1 truncate text-marmol-800">
                      {f.nombre}
                      {f.insignias.map((ins) => (
                        <span key={ins.id} className="ml-1" title={ins.nombre}>
                          {ins.emoji}
                        </span>
                      ))}
                    </span>
                    <span className="text-xs text-marmol-400">
                      {f.s.cazas} cazas{f.s.pionerosValidados > 0 && ` · ${f.s.pionerosValidados} 🦅`}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-[11px] text-marmol-400">Los puntos de cada cacería se suman al ranking general de Reconocimientos.</p>
            </div>
          )}
        </div>
      </div>

      {/* Aprende a cazar */}
      <div className="card p-5">
        <h2 className="font-display font-semibold text-secundario">📚 Aprende a cazar: los 8 desperdicios en la oficina</h2>
        <p className="mt-1 text-sm text-marmol-500">
          Lean nació en la fábrica, pero los mismos desperdicios viven en los procesos administrativos. Un desperdicio es todo lo que consume tiempo o
          esfuerzo sin agregarle valor a quien recibe el resultado.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TIPOS_DESPERDICIO.map((t) => (
            <div key={t} className="rounded-xl border border-marmol-200 bg-marmol-50/60 p-3">
              <p className="text-2xl">{DESPERDICIOS[t].emoji}</p>
              <p className="mt-1 text-sm font-semibold text-marmol-800">{DESPERDICIOS[t].nombre}</p>
              <p className="mt-0.5 text-xs text-marmol-500">{DESPERDICIOS[t].ejemplo}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4 text-xs text-marmol-600">
          {ETAPAS_RETO.map((e, i) => (
            <div key={e.estado} className="flex gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secundario text-[11px] font-bold text-white">{i + 1}</span>
              <span>
                <strong className="text-marmol-800">{e.titulo}.</strong> {e.descripcion}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
