import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Scale } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { crearNormalizadorAreas } from '@/lib/areas';
import { obtenerUmbralAnonimato } from '@/lib/informes/anonimato';
import { brechaAutoLiderPorGrupo, requiereRevision, severidadPorLider, type NotaTarea } from '@/lib/informes/equidad';
import { cn, primero } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const fmt = (n: number | null) => (n == null ? '—' : String(n).replace('.', ','));
const signo = (n: number) => `${n > 0 ? '+' : ''}${fmt(n)}`;

export default async function EquidadPage({ searchParams }: { searchParams: { ciclo?: string; agrupacion?: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/informes');
  const supabase = createClient();
  const umbral = await obtenerUmbralAnonimato(perfil.empresa_id);

  const { data: ciclos } = await supabase.from('ciclos_evaluacion').select('id, nombre, fecha_apertura').eq('empresa_id', perfil.empresa_id).order('fecha_apertura', { ascending: false });
  const listaCiclos = (ciclos ?? []) as any[];
  const cicloId = searchParams.ciclo === 'todos' ? null : listaCiclos.find((c) => c.id === searchParams.ciclo)?.id ?? listaCiclos[0]?.id ?? null;
  const porEquipo = searchParams.agrupacion === 'equipo';

  let consulta = supabase
    .from('evaluacion_tareas')
    .select(
      `tipo_evaluador, evaluador_colaborador_id,
       evaluacion:evaluaciones!inner(ciclo_id, colaborador:colaborador_evaluado_id(id, lider_id, nombre_completo, cargo:cargos(proceso_area))),
       respuestas:respuestas_evaluacion(nota, no_aplica)`
    )
    .in('tipo_evaluador', ['lider', 'autoevaluacion'])
    .eq('completada', true);
  if (cicloId) consulta = consulta.eq('evaluacion.ciclo_id', cicloId);
  const { data: tareasRaw } = await consulta;

  const tareas: NotaTarea[] = [];
  const colabs = new Map<string, any>();
  for (const t of (tareasRaw ?? []) as any[]) {
    const ev = primero(t.evaluacion as any) as any;
    const col = primero(ev?.colaborador as any) as any;
    if (!col) continue;
    const notas = ((t.respuestas ?? []) as any[]).filter((r) => !r.no_aplica && r.nota != null).map((r) => r.nota as number);
    if (notas.length === 0) continue;
    colabs.set(col.id, col);
    tareas.push({ tipo: t.tipo_evaluador, evaluadorId: t.evaluador_colaborador_id, evaluadoId: col.id, nota: notas.reduce((a, b) => a + b, 0) / notas.length });
  }

  const { data: personas } = await supabase.from('colaboradores').select('id, nombre_completo').eq('empresa_id', perfil.empresa_id);
  const nombre = new Map(((personas ?? []) as any[]).map((p) => [p.id as string, p.nombre_completo as string]));

  const normalizarArea = crearNormalizadorAreas(Array.from(colabs.values()).map((c) => primero(c.cargo)?.proceso_area));
  const grupoDe = new Map<string, string>();
  for (const c of Array.from(colabs.values())) {
    grupoDe.set(c.id, porEquipo ? (c.lider_id ? `Equipo de ${nombre.get(c.lider_id) ?? 'líder'}` : 'Sin líder asignado') : normalizarArea(primero(c.cargo)?.proceso_area) ?? 'Sin área asignada');
  }

  const severidad = severidadPorLider(tareas, umbral);
  const brecha = brechaAutoLiderPorGrupo(tareas, grupoDe, umbral);
  const href = (p: Record<string, string>) => {
    const q = new URLSearchParams({ ...(cicloId ? { ciclo: cicloId } : { ciclo: 'todos' }), ...(porEquipo ? { agrupacion: 'equipo' } : {}), ...p });
    return `/informes/equidad?${q.toString()}`;
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <Scale size={22} className="text-flow-500" /> Equidad de la valoración
        </h1>
        <p className="text-sm text-marmol-500 mt-1 max-w-2xl">
          Señales para calibrar: ¿algún líder califica sistemáticamente más alto o más bajo que el resto?, ¿en qué grupos la autoevaluación se aleja de lo que ve el líder?
        </p>
        <p className="text-xs text-marmol-400 mt-2 max-w-2xl">
          Una diferencia no prueba un sesgo: también puede reflejar desempeños realmente distintos. Úsala para abrir una conversación entre líderes, con ejemplos concretos. Por privacidad, solo se muestran líderes y grupos con al menos {umbral} personas valoradas (se cambia en Administración → Configuración).
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-center gap-2">
        <select name="ciclo" defaultValue={cicloId ?? 'todos'} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
          {listaCiclos.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
          <option value="todos">Todos los ciclos</option>
        </select>
        {porEquipo && <input type="hidden" name="agrupacion" value="equipo" />}
        <button type="submit" className="btn-primary text-xs">Ver</button>
      </form>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-semibold text-secundario">Severidad por líder</h2>
        <p className="text-xs text-marmol-400">
          Promedio de las valoraciones que da cada líder frente al promedio de todos los líderes ({fmt(severidad.promedioGlobal)}). Positivo = más benevolente; negativo = más exigente. Poca dispersión significa que califica a casi todos igual.
        </p>
        {severidad.filas.length === 0 ? (
          <p className="text-sm text-marmol-500">Aún no hay líderes con {umbral} o más personas valoradas en este alcance.</p>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                  <th className="px-4 py-3 font-medium">Líder</th>
                  <th className="px-4 py-3 font-medium">Personas</th>
                  <th className="px-4 py-3 font-medium">Promedio</th>
                  <th className="px-4 py-3 font-medium">Diferencia</th>
                  <th className="px-4 py-3 font-medium">Dispersión</th>
                </tr>
              </thead>
              <tbody>
                {severidad.filas.map((f) => (
                  <tr key={f.liderId} className="border-b border-marmol-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-marmol-900">{nombre.get(f.liderId) ?? 'Líder'}</td>
                    <td className="px-4 py-3 text-marmol-600">{f.personas}</td>
                    <td className="px-4 py-3 text-marmol-600">{fmt(f.promedio)}</td>
                    <td className={cn('px-4 py-3 font-medium', requiereRevision(f.diferencia) ? 'text-medio' : 'text-marmol-600')}>
                      {signo(f.diferencia)}
                      {requiereRevision(f.diferencia) && <span className="ml-1 text-xs font-normal">· conversar</span>}
                    </td>
                    <td className="px-4 py-3 text-marmol-600">{fmt(f.dispersion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {severidad.ocultos > 0 && <p className="text-xs text-marmol-400">{severidad.ocultos} líder(es) con menos de {umbral} personas valoradas no se muestran.</p>}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-display text-lg font-semibold text-secundario">Autoevaluación frente al líder</h2>
          <div className="flex gap-1 rounded-lg border border-marmol-200 p-0.5">
            <Link href={href({ agrupacion: 'area' }).replace('&agrupacion=equipo', '')} className={cn('rounded-md px-3 py-1 text-xs font-medium', !porEquipo ? 'bg-flow-500 text-white' : 'text-marmol-600')}>Por área</Link>
            <Link href={href({ agrupacion: 'equipo' })} className={cn('rounded-md px-3 py-1 text-xs font-medium', porEquipo ? 'bg-flow-500 text-white' : 'text-marmol-600')}>Por equipo</Link>
          </div>
        </div>
        <p className="text-xs text-marmol-400">
          Promedio de la autoevaluación menos el de la valoración del líder, solo de personas con ambas. Positivo = la gente se ve mejor de como la ve su líder.
          {brecha.global ? ` En toda la muestra (${brecha.global.personas} personas): ${signo(brecha.global.diferencia)}.` : ''}
        </p>
        {brecha.filas.length === 0 ? (
          <p className="text-sm text-marmol-500">Aún no hay grupos con {umbral} o más personas que tengan autoevaluación y valoración del líder.</p>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                  <th className="px-4 py-3 font-medium">{porEquipo ? 'Equipo' : 'Área'}</th>
                  <th className="px-4 py-3 font-medium">Personas</th>
                  <th className="px-4 py-3 font-medium">Autoevaluación</th>
                  <th className="px-4 py-3 font-medium">Líder</th>
                  <th className="px-4 py-3 font-medium">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {brecha.filas.map((f) => (
                  <tr key={f.grupo} className="border-b border-marmol-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-marmol-900">{f.grupo}</td>
                    <td className="px-4 py-3 text-marmol-600">{f.personas}</td>
                    <td className="px-4 py-3 text-marmol-600">{fmt(f.promedioAuto)}</td>
                    <td className="px-4 py-3 text-marmol-600">{fmt(f.promedioLider)}</td>
                    <td className={cn('px-4 py-3 font-medium', requiereRevision(f.diferencia) ? 'text-medio' : 'text-marmol-600')}>{signo(f.diferencia)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {brecha.ocultos > 0 && <p className="text-xs text-marmol-400">{brecha.ocultos} grupo(s) con menos de {umbral} personas no se muestran.</p>}
      </section>
    </div>
  );
}
