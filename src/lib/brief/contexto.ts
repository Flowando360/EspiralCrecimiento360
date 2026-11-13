import { primero } from '@/lib/utils';
import { ASPECTOS_DEL_ESQUEMA } from '@/lib/guia-flow/esquema';

type Cliente = any;

export type BloqueEval = 'competencias_organizacionales' | 'competencias_funcionales' | 'competencias_liderazgo' | 'roles_y_funciones' | 'cultura';

const ETIQUETA_BLOQUE: Record<BloqueEval, string> = {
  competencias_organizacionales: 'Competencias organizacionales',
  competencias_funcionales: 'Competencias funcionales',
  competencias_liderazgo: 'Competencias de liderazgo',
  roles_y_funciones: 'Roles y funciones',
  cultura: 'Cultura',
};

export interface ItemEval {
  titulo: string;
  bloque: BloqueEval;
  dimension: 'hacer' | 'deber';
  auto: number | null;
  lider: number | null;
  terceros: number | null; // promedio de pares y colaboradores a cargo (sin desglosar a nadie)
}

export interface ContextoBrief {
  colaborador: { nombre: string; cargo: string | null; area: string | null; fechaIngreso: string | null };
  ciclo: string | null;
  ser: {
    disponible: boolean;
    fecha: string | null;
    informeLider: string | null;
    /** Aspectos del esquema del Ser con lectura «para aprovechar» (descriptivo, sin nota). */
    fortalezas: { nombre: string; titulo: string | null }[];
    /** Aspectos del esquema del Ser con lectura «para acompañar». */
    aAcompanar: { nombre: string; titulo: string | null }[];
  };
  saber: {
    cumplimiento: number | null;
    cumple: number;
    parcial: number;
    pendiente: number;
    pendientes: string[];
    certificaciones: { titulo: string; vence: string; dias: number }[];
    formacion: string[];
    cursosCompletados: string[];
    cursosEnCurso: { titulo: string; progreso: number }[];
  };
  desempeno: {
    indiceHacer: number | null;
    indiceDeber: number | null;
    semaforoHacer: string | null;
    semaforoDeber: string | null;
    brechaHacer: number | null;
    brechaDeber: number | null;
    items: ItemEval[];
  };
  planesAbiertos: number;
  nombreBloque: Record<string, string>;
}

const prom = (v: number[]) => (v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null);

/**
 * Cruza Ser (Guía del Flow), Saber (hoja de vida, verificaciones y cursos) y
 * Hacer/Deber (valoración del ciclo) de una evaluación. Usa el cliente de quien
 * consulta, así que las políticas de acceso siguen mandando: del Ser solo llegan
 * los 18 aspectos de relevancia laboral y el informe pensado para el líder.
 * De los pares y colaboradores a cargo solo se usa el promedio agrupado.
 */
export async function recopilarContextoBrief(supabase: Cliente, evaluacionId: string): Promise<ContextoBrief | null> {
  const { data: ev } = await supabase
    .from('evaluaciones')
    .select(
      `id, ciclo_id,
       colaborador:colaborador_evaluado_id(id, nombre_completo, fecha_ingreso, cargo:cargos(nombre, proceso_area)),
       resultado:resultados_evaluacion(indice_hacer, indice_deber, semaforo_hacer, semaforo_deber, brecha_hacer, brecha_deber)`
    )
    .eq('id', evaluacionId)
    .maybeSingle();
  if (!ev) return null;
  const col = ev.colaborador as any;
  if (!col) return null;
  const res = primero(ev.resultado as any) as any;
  const cargo = primero(col.cargo as any) as any;
  const colaboradorId = col.id as string;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const [{ data: ciclo }, { data: tareas }, { data: guia }, { data: cumpl }, { data: verifs }, { data: hv }, { data: rutas }, { data: planes }] =
    await Promise.all([
      supabase.from('ciclos_evaluacion').select('nombre').eq('id', ev.ciclo_id).maybeSingle(),
      supabase
        .from('evaluacion_tareas')
        .select('tipo_evaluador, respuestas:respuestas_evaluacion(nota, item:evaluacion_item_id(id, bloque, titulo, activo))')
        .eq('evaluacion_id', evaluacionId)
        .eq('completada', true),
      supabase
        .from('guia_del_flow')
        .select('id, fecha_aplicacion, informe_lider')
        .eq('colaborador_id', colaboradorId)
        .order('fecha_aplicacion', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('v_saber_cumplimiento').select('*').eq('colaborador_id', colaboradorId).maybeSingle(),
      supabase.from('verificaciones_saber').select('item_evaluado, estado, fecha_verificacion').eq('colaborador_id', colaboradorId).order('fecha_verificacion', { ascending: false }),
      supabase.from('hoja_vida_formacion').select('tipo, titulo, fecha_vencimiento').eq('colaborador_id', colaboradorId),
      supabase.from('nexa_rutas_formacion').select('estado, progreso_pct, curso:curso_id(titulo)').eq('colaborador_id', colaboradorId),
      supabase.from('planes_desarrollo').select('id').eq('colaborador_id', colaboradorId).in('estado', ['pendiente', 'en_curso']),
    ]);

  // ── Hacer / Deber: nota por ítem según quién la dio ──
  type Acum = { titulo: string; bloque: BloqueEval; auto: number | null; lider: number | null; t: number[] };
  const porItem = new Map<string, Acum>();
  for (const t of (tareas ?? []) as any[]) {
    for (const r of t.respuestas ?? []) {
      const it = primero(r.item as any) as any;
      if (!it || it.activo === false) continue;
      const x: Acum = porItem.get(it.id) ?? { titulo: it.titulo, bloque: it.bloque, auto: null, lider: null, t: [] as number[] };
      if (t.tipo_evaluador === 'autoevaluacion') x.auto = r.nota;
      else if (t.tipo_evaluador === 'lider') x.lider = r.nota;
      else if (r.nota != null) x.t.push(r.nota);
      porItem.set(it.id, x);
    }
  }
  const items: ItemEval[] = Array.from(porItem.values()).map((x) => ({
    titulo: x.titulo,
    bloque: x.bloque,
    dimension: x.bloque === 'cultura' ? 'deber' : 'hacer',
    auto: x.auto,
    lider: x.lider,
    terceros: prom(x.t),
  }));

  // ── Ser: solo el esquema (aspectos con relevancia laboral), nunca la Guía completa ──
  let fortalezas: { nombre: string; titulo: string | null }[] = [];
  let aAcompanar: { nombre: string; titulo: string | null }[] = [];
  if (guia) {
    const [{ data: aspectos }, { data: puntajes }] = await Promise.all([
      supabase.from('ser_aspectos').select('id, nombre').eq('sensible', false).in('nombre', ASPECTOS_DEL_ESQUEMA),
      supabase.from('ser_puntajes').select('aspecto_id, nota, descripcion, enfoque').eq('guia_del_flow_id', guia.id),
    ]);
    const nombre = new Map(((aspectos ?? []) as any[]).map((a) => [a.id, a.nombre as string]));
    // Orden del esquema (talento, motivación, liderazgo…) para que el resumen sea estable.
    const lista = ((puntajes ?? []) as any[])
      // Sin título ni descripción no es un aspecto descrito (restos de cuando el Ser tenía puntaje).
      .filter((p) => nombre.has(p.aspecto_id) && (p.nota || p.descripcion))
      .map((p) => ({ nombre: nombre.get(p.aspecto_id)!, titulo: (p.nota as string | null) ?? null, enfoque: p.enfoque as string | null }))
      .sort((x, y) => ASPECTOS_DEL_ESQUEMA.indexOf(x.nombre) - ASPECTOS_DEL_ESQUEMA.indexOf(y.nombre));
    // Las inteligencias son muchas y no hablan de desempeño: no se listan como fortaleza del resumen.
    fortalezas = lista.filter((p) => p.enfoque === 'aprovechar' && !p.nombre.startsWith('Inteligencia')).slice(0, 4).map(({ nombre, titulo }) => ({ nombre, titulo }));
    aAcompanar = lista.filter((p) => p.enfoque === 'acompanar').slice(0, 3).map(({ nombre, titulo }) => ({ nombre, titulo }));
  }

  // ── Saber ──
  const verificaciones = (verifs ?? []) as any[];
  const hojas = (hv ?? []) as any[];
  const certificaciones = hojas
    .filter((h) => h.tipo === 'certificacion' && h.fecha_vencimiento)
    .map((h) => ({
      titulo: h.titulo as string,
      vence: h.fecha_vencimiento as string,
      dias: Math.round((new Date(h.fecha_vencimiento + 'T00:00:00').getTime() - hoy.getTime()) / 86400000),
    }))
    .filter((c) => c.dias <= 60)
    .sort((a, b) => a.dias - b.dias);
  const rutasL = (rutas ?? []) as any[];

  return {
    colaborador: {
      nombre: col.nombre_completo,
      cargo: cargo?.nombre ?? null,
      area: cargo?.proceso_area ?? null,
      fechaIngreso: col.fecha_ingreso ?? null,
    },
    ciclo: ciclo?.nombre ?? null,
    ser: {
      disponible: Boolean(guia),
      fecha: guia?.fecha_aplicacion ?? null,
      informeLider: guia?.informe_lider ?? null,
      fortalezas,
      aAcompanar,
    },
    saber: {
      cumplimiento: cumpl?.porcentaje_cumplimiento != null ? Number(cumpl.porcentaje_cumplimiento) : null,
      cumple: verificaciones.filter((v) => v.estado === 'cumple').length,
      parcial: verificaciones.filter((v) => v.estado === 'cumple_parcial').length,
      pendiente: verificaciones.filter((v) => v.estado === 'no_cumple_pendiente').length,
      pendientes: verificaciones.filter((v) => v.estado !== 'cumple').slice(0, 5).map((v) => v.item_evaluado as string),
      certificaciones,
      formacion: hojas.filter((h) => h.tipo === 'academica').slice(0, 4).map((h) => h.titulo as string),
      cursosCompletados: rutasL.filter((r) => r.estado === 'completado').map((r) => (primero(r.curso) as any)?.titulo).filter(Boolean),
      cursosEnCurso: rutasL
        .filter((r) => r.estado === 'en_curso' || r.estado === 'asignado')
        .map((r) => ({ titulo: (primero(r.curso) as any)?.titulo as string, progreso: Number(r.progreso_pct ?? 0) }))
        .filter((r) => r.titulo),
    },
    desempeno: {
      indiceHacer: res?.indice_hacer != null ? Number(res.indice_hacer) : null,
      indiceDeber: res?.indice_deber != null ? Number(res.indice_deber) : null,
      semaforoHacer: res?.semaforo_hacer ?? null,
      semaforoDeber: res?.semaforo_deber ?? null,
      brechaHacer: res?.brecha_hacer != null ? Number(res.brecha_hacer) : null,
      brechaDeber: res?.brecha_deber != null ? Number(res.brecha_deber) : null,
      items,
    },
    planesAbiertos: (planes ?? []).length,
    nombreBloque: ETIQUETA_BLOQUE,
  };
}
