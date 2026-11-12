import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { FormularioAccionPdi, type SugerenciaPdi } from '@/components/espiral-crecimiento/formulario-accion-pdi';
import { SemaforoBadge } from '@/components/espiral-crecimiento/semaforo-badge';
import { notFound } from 'next/navigation';
import { ArrowLeft, FileText, HandshakeIcon, Paperclip, Target } from 'lucide-react';
import { firmarEvidencias } from '@/app/(dashboard)/espiral-crecimiento/evaluar/evidencias-actions';
import { formatearFecha, cn, primero } from '@/lib/utils';
import { TarjetaIndiceIntegral } from '@/components/espiral-crecimiento/tarjeta-indice-integral';
import { cargarDesempenoIntegral } from '@/lib/desempeno/cargar-integral';

type Bloque = 'competencias_organizacionales' | 'competencias_funcionales' | 'competencias_liderazgo' | 'roles_y_funciones' | 'cultura';

const ETIQUETA_BLOQUE: Record<Bloque, string> = {
  competencias_organizacionales: 'Competencias Organizacionales',
  competencias_funcionales: 'Competencias Funcionales del Cargo',
  competencias_liderazgo: 'Competencias de Liderazgo',
  roles_y_funciones: 'Roles y Funciones',
  cultura: 'Cultura',
};
const ORDEN_BLOQUES: Bloque[] = ['competencias_organizacionales', 'competencias_funcionales', 'competencias_liderazgo', 'roles_y_funciones', 'cultura'];

const ETIQUETA_ESTADO_PDI: Record<string, string> = {
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  cumplido: 'Cumplido',
  vencido: 'Vencido',
};
const CLASE_ESTADO_PDI: Record<string, string> = {
  pendiente: 'bg-marmol-100 text-marmol-500 border border-marmol-200',
  en_curso: 'badge-medio',
  cumplido: 'badge-alto',
  vencido: 'badge-bajo',
};

function promedio(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 10) / 10;
}

export default async function ResultadoEvaluacionPage({ params }: { params: { evaluacionId: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();

  const { data: evaluacion } = await supabase
    .from('evaluaciones')
    .select(
      `id, ciclo_id, publicado,
       colaborador:colaborador_evaluado_id(id, nombre_completo, empresa_id, lider_id, cargo:cargos(nombre, proceso_area, nivel_cargo, tiene_personal_a_cargo)),
       resultado:resultados_evaluacion(indice_hacer, indice_deber, semaforo_hacer, semaforo_deber, brecha_hacer, brecha_deber, items_evaluados, items_no_aplica)`
    )
    .eq('id', params.evaluacionId)
    .maybeSingle();

  if (!evaluacion) notFound();

  const colaborador = evaluacion.colaborador as any;
  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) notFound();

  const puedeVer =
    perfil.rol === 'admin_th' ||
    (perfil.rol === 'lider' && colaborador.lider_id === perfil.colaborador_id) ||
    (perfil.rol === 'colaborador' && perfil.colaborador_id === colaborador.id);
  if (!puedeVer) notFound();

  const resultado = primero(evaluacion.resultado as any) as any;

  const integral = await cargarDesempenoIntegral({
    evaluacionId: params.evaluacionId,
    empresaId: perfil.empresa_id,
    colaboradorId: colaborador.id,
    cargo: colaborador.cargo ?? null,
    indiceHacer: resultado?.indice_hacer != null ? Number(resultado.indice_hacer) : null,
    indiceDeber: resultado?.indice_deber != null ? Number(resultado.indice_deber) : null,
  });

  const [{ data: ciclo }, { data: lider }, { data: tareas }, { data: brief }, { data: planes }] = await Promise.all([
    supabase.from('ciclos_evaluacion').select('nombre, fecha_apertura, fecha_cierre_respuestas').eq('id', evaluacion.ciclo_id).maybeSingle(),
    colaborador.lider_id
      ? supabase.from('colaboradores').select('nombre_completo').eq('id', colaborador.lider_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('evaluacion_tareas')
      .select(
        `tipo_evaluador,
         respuestas:respuestas_evaluacion(nota, no_aplica, adjuntos, evaluacion_item_id, item:evaluacion_item_id(id, bloque, titulo, descripcion, orden, activo))`
      )
      .eq('evaluacion_id', params.evaluacionId)
      .eq('completada', true),
    supabase.from('briefs_retroalimentacion').select('*').eq('evaluacion_id', params.evaluacionId).maybeSingle(),
    supabase
      .from('planes_desarrollo')
      .select('id, accion, origen, estado, fecha_compromiso, fecha_cumplimiento, responsable:responsable_id(nombre_completo)')
      .eq('colaborador_id', colaborador.id)
      .eq('ciclo_origen_id', evaluacion.ciclo_id)
      .order('fecha_compromiso'),
  ]);

  // ── Aplanar respuestas: por ítem, cuánto puso Auto y cuánto puso Líder.
  // Pares y colaboradores a cargo alimentan el índice oficial (arriba, ya
  // calculado por el trigger) pero no se muestran desglosados acá — se
  // protege el anonimato de quien califica, buena práctica en 360°.
  type FilaItem = { bloque: Bloque; titulo: string; descripcion: string | null; orden: number; auto: number | null; lider: number | null; autoNA: boolean; liderNA: boolean; evidencias: { fuente: string; nombre: string; ruta: string; tipo: string; tamano: number }[] };
  const porItem = new Map<string, FilaItem>();

  for (const tarea of (tareas ?? []) as any[]) {
    if (tarea.tipo_evaluador !== 'autoevaluacion' && tarea.tipo_evaluador !== 'lider') continue;
    for (const r of tarea.respuestas ?? []) {
      const item = r.item;
      if (!item || !item.activo) continue;
      const actual: FilaItem = porItem.get(item.id) ?? {
        bloque: item.bloque,
        titulo: item.titulo,
        descripcion: item.descripcion,
        orden: item.orden ?? 0,
        auto: null,
        lider: null,
        autoNA: false,
        liderNA: false,
        evidencias: [],
      };
      // Las evidencias de la autoevaluación y del líder se muestran con el resultado; las de pares y colaboradores a cargo no (se protege su anonimato).
      for (const a of Array.isArray(r.adjuntos) ? r.adjuntos : []) actual.evidencias.push({ ...a, fuente: tarea.tipo_evaluador === 'lider' ? 'Líder' : 'Autoevaluación' });
      if (tarea.tipo_evaluador === 'autoevaluacion') {
        actual.auto = r.nota;
        actual.autoNA = Boolean(r.no_aplica);
      }
      if (tarea.tipo_evaluador === 'lider') {
        actual.lider = r.nota;
        actual.liderNA = Boolean(r.no_aplica);
      }
      porItem.set(item.id, actual);
    }
  }

  const urlsEvidencias = new Map<string, string | null>();
  {
    const todas = Array.from(porItem.values()).flatMap((i) => i.evidencias);
    const firmadas = await firmarEvidencias(todas.map(({ nombre, ruta, tipo, tamano }) => ({ nombre, ruta, tipo, tamano })));
    for (const f of firmadas) urlsEvidencias.set(f.ruta, f.url);
  }

  const itemsPorBloque = ORDEN_BLOQUES.map((bloque) => ({
    bloque,
    items: Array.from(porItem.values())
      .filter((i) => i.bloque === bloque)
      .sort((a, b) => a.orden - b.orden),
  })).filter((g) => g.items.length > 0);

  // Brechas sugeridas para el PDI: ítems que el líder calificó en 2 o menos.
  const sugerenciasPdi: SugerenciaPdi[] = Array.from(porItem.values())
    .filter((i) => i.lider != null && i.lider <= 2)
    .map((i) => ({
      origen: i.bloque === 'cultura' ? 'deber' : 'hacer',
      brecha: `${i.titulo}: el líder calificó ${i.lider}${i.auto != null ? ` (autoevaluación ${i.auto})` : ''}`,
    }));
  const puedeGestionarPdi =
    perfil.rol === 'admin_th' || (perfil.rol === 'lider' && colaborador.lider_id === perfil.colaborador_id);

  const puedeEditarRetro =
    perfil.rol === 'admin_th' || (perfil.rol === 'lider' && colaborador.lider_id === perfil.colaborador_id);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link
          href={`/espiral-crecimiento/ciclos/${evaluacion.ciclo_id}`}
          className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2"
        >
          <ArrowLeft size={12} /> Volver al ciclo
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-secundario">{colaborador.nombre_completo}</h1>
            <p className="text-sm text-marmol-500 mt-1">
              {colaborador.cargo?.nombre}
              {colaborador.cargo?.proceso_area && ` · ${colaborador.cargo.proceso_area}`}
              {ciclo?.nombre && ` · ${ciclo.nombre}`}
              {lider?.nombre_completo && ` · Líder: ${lider.nombre_completo}`}
            </p>
          </div>
          {puedeEditarRetro && (
            <div className="flex items-center gap-2">
              <Link
                href={`/espiral-crecimiento/evaluaciones/${params.evaluacionId}/brief`}
                className="inline-flex items-center gap-1 text-xs text-flow-600 hover:text-flow-700"
              >
                <FileText size={12} /> Brief
              </Link>
              <Link
                href={`/espiral-crecimiento/evaluaciones/${params.evaluacionId}/acuerdo`}
                className="inline-flex items-center gap-1 text-xs text-flow-600 hover:text-flow-700"
              >
                <HandshakeIcon size={12} /> Acuerdo
              </Link>
            </div>
          )}
        </div>
      </div>

      {(resultado?.items_no_aplica ?? 0) > 0 && (() => {
        const na = resultado.items_no_aplica as number;
        const total = na + ((resultado.items_evaluados as number | null) ?? 0);
        const pct = total > 0 ? Math.round((100 * na) / total) : 0;
        return (
          <p className={cn('text-xs rounded-lg px-3 py-2 border', pct > 30 ? 'text-medio bg-medio/10 border-medio/20' : 'text-marmol-500 bg-marmol-50 border-marmol-100')}>
            {na} de {total} respuestas se marcaron «No aplica» ({pct} %). No cuentan como cero: los índices se calculan solo con lo que sí se valoró.
            {pct > 30 && ' Son muchas: lee el resultado con cautela y revisa si el perfil del cargo necesita ajustes.'}
          </p>
        );
      })()}

      {/* ── Tarjetas comparativas: Hacer y Deber, cada una Auto/Final/Brecha ── */}
      <div className="grid sm:grid-cols-2 gap-4">
        {(['hacer', 'deber'] as const).map((dim) => {
          const indice = dim === 'hacer' ? resultado?.indice_hacer : resultado?.indice_deber;
          const semaforo = dim === 'hacer' ? resultado?.semaforo_hacer : resultado?.semaforo_deber;
          const brecha = dim === 'hacer' ? resultado?.brecha_hacer : resultado?.brecha_deber;
          const autoevalDim = promedio(
            Array.from(porItem.values())
              .filter((i) => (dim === 'hacer' ? i.bloque !== 'cultura' : i.bloque === 'cultura'))
              .map((i) => i.auto)
              .filter((n): n is number => typeof n === 'number')
          );
          return (
            <div key={dim} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-semibold text-secundario capitalize">{dim}</h2>
                <SemaforoBadge nivel={semaforo} />
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-marmol-400 mb-1">Autoevaluación</p>
                  <p className="font-display text-xl font-semibold text-marmol-700">{autoevalDim ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-marmol-400 mb-1">Índice final</p>
                  <p className="font-display text-2xl font-bold text-secundario">{indice ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-marmol-400 mb-1">Brecha</p>
                  <p
                    className={cn(
                      'font-display text-xl font-semibold',
                      brecha == null ? 'text-marmol-400' : brecha > 0 ? 'text-alto' : brecha < 0 ? 'text-bajo' : 'text-marmol-700'
                    )}
                  >
                    {brecha != null ? (brecha > 0 ? `+${brecha}` : brecha) : '—'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <TarjetaIndiceIntegral datos={integral} />

      {/* ── Bloques con subtotal y tabla Ítem/Auto/Líder ── */}
      {itemsPorBloque.map(({ bloque, items }) => {
        const subtotalAuto = promedio(items.map((i) => i.auto).filter((n): n is number => typeof n === 'number'));
        const subtotalLider = promedio(items.map((i) => i.lider).filter((n): n is number => typeof n === 'number'));
        return (
          <div key={bloque} className="card overflow-hidden">
            <div className="p-5 pb-3 flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-display font-semibold text-secundario">{ETIQUETA_BLOQUE[bloque]}</h2>
              <div className="flex gap-4 text-xs text-marmol-500">
                <span>
                  Subtotal Auto: <span className="font-semibold text-marmol-800">{subtotalAuto ?? '—'}</span>
                </span>
                <span>
                  Subtotal Líder: <span className="font-semibold text-marmol-800">{subtotalLider ?? '—'}</span>
                </span>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-marmol-100 text-left text-xs uppercase tracking-wide text-marmol-400">
                  <th className="px-5 py-2 font-medium">Ítem</th>
                  <th className="px-5 py-2 font-medium w-20 text-center">Auto</th>
                  <th className="px-5 py-2 font-medium w-20 text-center">Líder</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.titulo} className="border-b border-marmol-50 last:border-0">
                    <td className="px-5 py-3">
                      <p className="text-marmol-800">{item.titulo}</p>
                      {item.descripcion && bloque === 'roles_y_funciones' && (
                        <p className="text-xs text-marmol-400 mt-0.5">Resultado esperado: {item.descripcion}</p>
                      )}
                      {item.evidencias.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {item.evidencias.map((e) => (
                            <li key={e.ruta} className="text-xs text-marmol-500 flex items-center gap-1">
                              <Paperclip size={11} /> {e.fuente}:{' '}
                              {urlsEvidencias.get(e.ruta) ? (
                                <a href={urlsEvidencias.get(e.ruta)!} target="_blank" rel="noreferrer" className="text-flow-700 hover:underline">
                                  {e.nombre}
                                </a>
                              ) : (
                                e.nombre
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center font-medium text-marmol-700">{item.autoNA ? <span className="text-xs font-normal text-marmol-400" title="No aplica: no cuenta como cero">N/A</span> : (item.auto ?? '—')}</td>
                    <td className="px-5 py-3 text-center font-medium text-marmol-700">{item.liderNA ? <span className="text-xs font-normal text-marmol-400" title="No aplica: no cuenta como cero">N/A</span> : (item.lider ?? '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* ── Retroalimentación cualitativa ── */}
      {brief && (brief.talento_central || brief.resumen_ser || brief.resumen_saber || brief.resumen_hacer || brief.resumen_deber || brief.sugerencias_enfoque) && (
        <div className="card p-5">
          <h2 className="font-display font-semibold text-secundario mb-3">Retroalimentación Cualitativa</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium text-marmol-500 uppercase tracking-wide mb-1">Talento central</p>
              <p className="text-marmol-700">{brief.talento_central || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-marmol-500 uppercase tracking-wide mb-1">Sugerencias de enfoque</p>
              <p className="text-marmol-700">{brief.sugerencias_enfoque || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-marmol-500 uppercase tracking-wide mb-1">Resumen de Ser</p>
              <p className="text-marmol-700">{brief.resumen_ser || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-marmol-500 uppercase tracking-wide mb-1">Resumen de Saber</p>
              <p className="text-marmol-700">{brief.resumen_saber || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-marmol-500 uppercase tracking-wide mb-1">Resumen de Hacer</p>
              <p className="text-marmol-700">{brief.resumen_hacer || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-marmol-500 uppercase tracking-wide mb-1">Resumen de Deber</p>
              <p className="text-marmol-700">{brief.resumen_deber || '—'}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Plan de Desarrollo ── */}
      <div className="card overflow-hidden">
        <div className="p-5 pb-3 flex items-center justify-between">
          <h2 className="font-display font-semibold text-secundario flex items-center gap-2">
            <Target size={16} /> Plan de Desarrollo
          </h2>
          <Link href="/espiral-crecimiento/pdi" className="text-xs text-flow-600 hover:underline">
            Ver todos los planes
          </Link>
        </div>
        {!planes || planes.length === 0 ? (
          <p className="text-sm text-marmol-400 px-5 pb-5">Sin acciones registradas para este ciclo todavía.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-marmol-100 text-left text-xs uppercase tracking-wide text-marmol-400">
                <th className="px-5 py-2 font-medium">Acción</th>
                <th className="px-5 py-2 font-medium">Origen</th>
                <th className="px-5 py-2 font-medium">Responsable</th>
                <th className="px-5 py-2 font-medium">Fecha</th>
                <th className="px-5 py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {planes.map((p: any) => (
                <tr key={p.id} className="border-b border-marmol-50 last:border-0">
                  <td className="px-5 py-3 text-marmol-800">{p.accion}</td>
                  <td className="px-5 py-3 text-marmol-500 capitalize">{p.origen}</td>
                  <td className="px-5 py-3 text-marmol-500">{p.responsable?.nombre_completo ?? '—'}</td>
                  <td className="px-5 py-3 text-marmol-500">{p.fecha_compromiso ? formatearFecha(p.fecha_compromiso) : '—'}</td>
                  <td className="px-5 py-3">
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', CLASE_ESTADO_PDI[p.estado])}>
                      {ETIQUETA_ESTADO_PDI[p.estado] ?? p.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {puedeGestionarPdi && (
          <FormularioAccionPdi colaboradorId={colaborador.id} cicloId={evaluacion.ciclo_id} sugerencias={sugerenciasPdi} />
        )}
      </div>
    </div>
  );
}
