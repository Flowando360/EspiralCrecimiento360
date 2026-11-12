import { crearNormalizadorAreas } from '@/lib/areas';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { coincideEquipo, type FiltrosEquipo } from '@/lib/informes/filtros-equipo';
import { obtenerUmbralAnonimato } from '@/lib/informes/anonimato';

export type Agrupacion = 'equipo' | 'area';
export type SemaforoDimension = 'alto' | 'medio' | 'bajo' | null;

export interface FilaBrecha {
  grupo: string;
  tamano: number;
  ser: { conDato: number };
  /** protegido = hay datos, pero el grupo tiene menos personas que el umbral de anonimato y no se muestra el promedio. */
  saber: { promedio: number | null; conDato: number; semaforo: SemaforoDimension; protegido?: boolean };
  hacer: { promedio: number | null; conDato: number; semaforo: SemaforoDimension; protegido?: boolean };
  deber: { promedio: number | null; conDato: number; semaforo: SemaforoDimension; protegido?: boolean };
}

function promedio(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 100) / 100;
}

// Mismos umbrales que ya usa el semáforo de Hacer/Deber (alto >=4.0, medio 3.5-4.0),
// aplicados también a Ser ahora que está en la misma escala 1-5. Saber usa un
// umbral propio porque es un porcentaje de cumplimiento, no una nota 1-5.
function semaforo1a5(valor: number | null): SemaforoDimension {
  if (valor === null) return null;
  if (valor >= 4.0) return 'alto';
  if (valor >= 3.5) return 'medio';
  return 'bajo';
}

function semaforoPorcentaje(valor: number | null): SemaforoDimension {
  if (valor === null) return null;
  if (valor >= 90) return 'alto';
  if (valor >= 70) return 'medio';
  return 'bajo';
}

/**
 * Informe de brechas por dimensión (Ser, Saber, Hacer, Deber), comparativo
 * por equipo o por área. Visible para admin_th y gerencia (toda la
 * empresa) y líder (solo su equipo) — igual alcance que el resto de
 * informes, sin colaborador porque el comparativo no tiene sentido a
 * nivel individual.
 */
export async function obtenerInformeBrechas(agrupacion: Agrupacion, filtros: FiltrosEquipo = {}) {
  const perfil = await getPerfilActual();
  if (!perfil || !['admin_th', 'lider', 'gerencia'].includes(perfil.rol)) {
    return { perfil: null, filas: [] as FilaBrecha[], umbral: 5 };
  }

  const supabase = createClient();

  let colaboradoresQuery = supabase
    .from('colaboradores')
    .select(
      `id, lider_id, cargo:cargo_id(proceso_area),
       lider:lider_id(nombre_completo)`
    )
    .eq('empresa_id', perfil.empresa_id)
    .eq('estado', 'activo')
    .eq('es_externo', false);

  if (perfil.rol === 'lider' && perfil.colaborador_id) {
    colaboradoresQuery = colaboradoresQuery.eq('lider_id', perfil.colaborador_id);
  }

  const { data: colaboradoresRaw } = await colaboradoresQuery;
  const colaboradores = ((colaboradoresRaw ?? []) as any[]).filter((c) => coincideEquipo(c, filtros));
  const colaboradorIds = colaboradores.map((c) => c.id);

  const umbral = await obtenerUmbralAnonimato(perfil.empresa_id);
  if (colaboradorIds.length === 0) return { perfil, filas: [], umbral };

  const [{ data: resultadosRaw }, { data: saberRaw }, { data: serRaw }] = await Promise.all([
    supabase
      .from('resultados_evaluacion')
      .select('indice_hacer, indice_deber, actualizado_en, evaluacion:evaluaciones!inner(colaborador_evaluado_id)')
      .in('evaluacion.colaborador_evaluado_id', colaboradorIds)
      .order('actualizado_en', { ascending: false }),
    supabase.from('v_saber_cumplimiento').select('colaborador_id, porcentaje_cumplimiento').in('colaborador_id', colaboradorIds),
    supabase.from('v_ser_promedio').select('colaborador_id, promedio_ser').in('colaborador_id', colaboradorIds),
  ]);

  // Solo el resultado más reciente por colaborador (puede haber varios ciclos).
  const resultadoPorColaborador = new Map<string, { indice_hacer: number | null; indice_deber: number | null }>();
  for (const r of (resultadosRaw ?? []) as any[]) {
    const colaboradorId = r.evaluacion?.colaborador_evaluado_id;
    if (!colaboradorId) continue;
    if (!resultadoPorColaborador.has(colaboradorId)) {
      resultadoPorColaborador.set(colaboradorId, { indice_hacer: r.indice_hacer, indice_deber: r.indice_deber });
    }
  }

  const saberPorColaborador = new Map(
    ((saberRaw ?? []) as any[]).map((s) => [s.colaborador_id, s.porcentaje_cumplimiento as number | null])
  );

  // v_ser_promedio ya trae un solo promedio por colaborador (su aplicación más reciente).
  const serPorColaborador = new Map(
    ((serRaw ?? []) as any[]).map((s) => [s.colaborador_id, s.promedio_ser as number | null])
  );

  const normalizarArea = crearNormalizadorAreas(colaboradores.map((c: any) => c.cargo?.proceso_area));
  const grupos = new Map<string, string[]>(); // nombre del grupo -> ids de colaboradores
  for (const co of colaboradores) {
    const nombreGrupo =
      agrupacion === 'equipo' ? co.lider?.nombre_completo ?? 'Sin líder asignado' : normalizarArea(co.cargo?.proceso_area) ?? 'Sin área asignada';
    if (!grupos.has(nombreGrupo)) grupos.set(nombreGrupo, []);
    grupos.get(nombreGrupo)!.push(co.id);
  }

  const filas: FilaBrecha[] = [...grupos.entries()]
    .map(([grupo, ids]) => {
      const serValores = ids.map((id) => serPorColaborador.get(id)).filter((v): v is number => v != null);
      const saberValores = ids.map((id) => saberPorColaborador.get(id)).filter((v): v is number => v != null);
      const hacerValores = ids
        .map((id) => resultadoPorColaborador.get(id)?.indice_hacer)
        .filter((v): v is number => v != null);
      const deberValores = ids
        .map((id) => resultadoPorColaborador.get(id)?.indice_deber)
        .filter((v): v is number => v != null);

      const promSaber = promedio(saberValores);
      const promHacer = promedio(hacerValores);
      const promDeber = promedio(deberValores);

      return {
        grupo,
        tamano: ids.length,
        // El Ser se describe, no se califica: solo se informa cuántas personas ya tienen Guía del Flow.
        ser: { conDato: serValores.length },
        saber: protegerDim({ promedio: promSaber, conDato: saberValores.length, semaforo: semaforoPorcentaje(promSaber) }, umbral),
        hacer: protegerDim({ promedio: promHacer, conDato: hacerValores.length, semaforo: semaforo1a5(promHacer) }, umbral),
        deber: protegerDim({ promedio: promDeber, conDato: deberValores.length, semaforo: semaforo1a5(promDeber) }, umbral),
      };
    })
    .sort((a, b) => a.grupo.localeCompare(b.grupo));

  return { perfil, filas, umbral };
}

/** Si el grupo tiene menos personas con dato que el umbral, no se muestra el promedio (anonimato). */
function protegerDim(d: { promedio: number | null; conDato: number; semaforo: SemaforoDimension }, umbral: number) {
  if (d.conDato > 0 && d.conDato < umbral) return { promedio: null, conDato: d.conDato, semaforo: null as SemaforoDimension, protegido: true };
  return d;
}
