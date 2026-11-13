import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/empty-state';
import { AdminCultura, FormularioCultura } from '@/components/nexa/cultura-cliente';
import { claveArea, crearNormalizadorAreas } from '@/lib/areas';
import { obtenerUmbralAnonimato } from '@/lib/informes/anonimato';
import { calcularBrecha, type ComportamientoCultura, type RespuestaCultura } from '@/lib/cultura/brecha';
import { formatearFecha } from '@/lib/utils';
import { Scale } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CulturaPage({
  searchParams,
}: {
  searchParams?: { ronda?: string; area?: string; lider?: string; sede?: string };
}) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  const supabase = createClient() as any;
  const esAdminTh = perfil.rol === 'admin_th';
  const verResultados = esAdminTh || perfil.rol === 'gerencia';
  const db = (t: string) => supabase.from(t) as any;

  const [{ data: rondasRaw }, { data: compsRaw }] = await Promise.all([
    db('cultura_rondas').select('id, nombre, estado, fecha_apertura').eq('empresa_id', perfil.empresa_id).order('fecha_apertura', { ascending: false }),
    db('cultura_comportamientos').select('id, dimension, enunciado, activo').eq('empresa_id', perfil.empresa_id).order('dimension').order('created_at'),
  ]);
  const rondas = (rondasRaw ?? []) as { id: string; nombre: string; estado: string; fecha_apertura: string }[];
  const comps = (compsRaw ?? []) as { id: string; dimension: string; enunciado: string; activo: boolean }[];
  const abierta = rondas.find((r) => r.estado === 'abierta') ?? null;

  let yaRespondio = false;
  if (abierta && perfil.colaborador_id) {
    const { data } = await db('cultura_participaciones').select('id').eq('ronda_id', abierta.id).eq('colaborador_id', perfil.colaborador_id).maybeSingle();
    yaRespondio = !!data;
  }

  // Resultados con filtros por área, líder y sede (siempre con el mínimo de anonimato).
  const rondaId = searchParams?.ronda ?? rondas[0]?.id;
  let resultado: ReturnType<typeof calcularBrecha> | null = null;
  let opciones = { areas: [] as string[], sedes: [] as { id: string; nombre: string }[], lideres: [] as { id: string; nombre: string }[] };
  if (verResultados && rondaId) {
    const { data } = await db('cultura_respuestas').select('*').eq('ronda_id', rondaId);
    const todas = (data ?? []) as RespuestaCultura[];
    const normalizar = crearNormalizadorAreas(todas.map((r) => r.area));
    const sedeIds = Array.from(new Set(todas.map((r) => r.sede_id).filter(Boolean))) as string[];
    const liderIds = Array.from(new Set(todas.map((r) => r.equipo_lider_id).filter(Boolean))) as string[];
    const [{ data: sedes }, { data: lideres }] = await Promise.all([
      sedeIds.length ? supabase.from('sedes').select('id, nombre').in('id', sedeIds) : Promise.resolve({ data: [] as any[] }),
      liderIds.length ? supabase.from('colaboradores').select('id, nombre_completo').in('id', liderIds) : Promise.resolve({ data: [] as any[] }),
    ]);
    opciones = {
      areas: Array.from(new Set(todas.map((r) => normalizar(r.area)).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'es')),
      sedes: ((sedes ?? []) as any[]).map((s) => ({ id: s.id, nombre: s.nombre })),
      lideres: ((lideres ?? []) as any[]).map((l) => ({ id: l.id, nombre: l.nombre_completo })),
    };
    const f = searchParams ?? {};
    const filtradas = todas.filter(
      (r) =>
        (!f.area || claveArea(normalizar(r.area)) === claveArea(f.area)) &&
        (!f.sede || r.sede_id === f.sede) &&
        (!f.lider || r.equipo_lider_id === f.lider)
    );
    const umbral = await obtenerUmbralAnonimato(perfil.empresa_id);
    resultado = calcularBrecha(filtradas, comps as ComportamientoCultura[], umbral);
  }

  const activos = comps.filter((c) => c.activo);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Brecha cultural</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Mide qué tan alineados están los comportamientos de todos los días con la cultura que la empresa quiere construir:
          cada persona dice con qué frecuencia ocurre hoy cada comportamiento y con qué frecuencia debería ocurrir. La
          diferencia es la brecha. Las respuestas son anónimas.
        </p>
      </div>

      {esAdminTh && <AdminCultura comportamientos={comps} rondaAbierta={abierta ? { id: abierta.id, nombre: abierta.nombre } : null} />}

      {perfil.colaborador_id && (
        <div>
          <h2 className="font-display text-lg font-semibold text-secundario mb-3">Tu opinión</h2>
          {!abierta || activos.length === 0 ? (
            <EmptyState icon={Scale} titulo="No hay una encuesta de cultura abierta" descripcion="Cuando Talento Humano la abra, podrás responderla aquí." />
          ) : yaRespondio ? (
            <div className="card p-5">
              <p className="text-sm font-medium text-marmol-800">Ya respondiste esta encuesta. ¡Gracias! 🙌</p>
            </div>
          ) : (
            <FormularioCultura rondaId={abierta.id} comportamientos={activos} />
          )}
        </div>
      )}

      {verResultados && (
        <div>
          <h2 className="font-display text-lg font-semibold text-secundario mb-3">Resultados</h2>
          {rondas.length === 0 ? (
            <EmptyState icon={Scale} titulo="Aún no hay encuestas de cultura" />
          ) : (
            <div className="space-y-4">
              <form method="get" className="flex flex-wrap items-end gap-3 text-sm">
                <label className="flex flex-col gap-1 text-marmol-500">
                  Encuesta
                  <select name="ronda" defaultValue={rondaId} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-marmol-800">
                    {rondas.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre} ({formatearFecha(r.fecha_apertura)})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-marmol-500">
                  Área
                  <select name="area" defaultValue={searchParams?.area ?? ''} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-marmol-800">
                    <option value="">Todas</option>
                    {opciones.areas.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-marmol-500">
                  Líder
                  <select name="lider" defaultValue={searchParams?.lider ?? ''} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-marmol-800">
                    <option value="">Todos</option>
                    {opciones.lideres.map((l) => (
                      <option key={l.id} value={l.id}>{l.nombre}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-marmol-500">
                  Sede
                  <select name="sede" defaultValue={searchParams?.sede ?? ''} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-marmol-800">
                    <option value="">Todas</option>
                    {opciones.sedes.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </label>
                <button type="submit" className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white font-medium px-4 py-2">
                  Filtrar
                </button>
              </form>

              {resultado && resultado.oculto ? (
                <EmptyState
                  icon={Scale}
                  titulo={resultado.personas === 0 ? 'Sin respuestas con estos filtros' : 'Pocas respuestas para mostrar este grupo'}
                  descripcion="Para proteger el anonimato, un grupo solo muestra resultados cuando tiene al menos el mínimo de personas definido en Administración → Configuración."
                />
              ) : (
                resultado && (
                  <>
                    <p className="text-xs text-marmol-500">
                      {resultado.personas} personas respondieron. Brecha = «debería ocurrir» menos «ocurre hoy»: entre más alta, más
                      urge trabajarla (formación, liderazgo, reconocimiento).
                    </p>
                    <TablaBrecha titulo="Por dimensión cultural" filas={resultado.porDimension} />
                    <TablaBrecha titulo="Por comportamiento" filas={resultado.porComportamiento} />
                  </>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TablaBrecha({ titulo, filas }: { titulo: string; filas: { id: string; titulo: string; actual: number; deseada: number; brecha: number }[] }) {
  return (
    <div className="card overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
            <th className="px-4 py-3 font-medium">{titulo}</th>
            <th className="px-4 py-3 font-medium">Ocurre hoy</th>
            <th className="px-4 py-3 font-medium">Debería ocurrir</th>
            <th className="px-4 py-3 font-medium">Brecha</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.id} className="border-b border-marmol-100 last:border-0">
              <td className="px-4 py-3 text-marmol-800">{f.titulo}</td>
              <td className="px-4 py-3 text-marmol-600">{f.actual}</td>
              <td className="px-4 py-3 text-marmol-600">{f.deseada}</td>
              <td className={`px-4 py-3 font-medium ${f.brecha >= 1 ? 'text-bajo' : f.brecha >= 0.5 ? 'text-medio' : 'text-marmol-600'}`}>
                {f.brecha > 0 ? '+' : ''}
                {f.brecha}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
