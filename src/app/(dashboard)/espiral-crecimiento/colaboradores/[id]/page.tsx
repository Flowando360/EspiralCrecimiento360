import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { SemaforoBadge } from '@/components/espiral-crecimiento/semaforo-badge';
import { formatearFecha } from '@/lib/utils';
import { notFound } from 'next/navigation';
import { GraduationCap, Briefcase, Sparkles, ShieldCheck, Target, Clock, History, FolderLock, CalendarHeart, HeartPulse, Shirt, Pencil } from 'lucide-react';

export default async function FichaColaboradorPage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();

  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select(
      `id, empresa_id, nombre_completo, email, telefono, fecha_ingreso, estado, tipo_contrato, lider_id,
       cargo:cargos(id, nombre, proceso_area, objetivo_cargo, tiene_personal_a_cargo),
       lider:lider_id(id, nombre_completo)`
    )
    .eq('id', params.id)
    .maybeSingle();

  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) notFound();

  // Misma regla que ya autoriza RLS en colaboradores: admin_th y gerencia
  // leen toda la empresa, líder solo su equipo directo, colaborador solo
  // a sí mismo.
  const puedeVer =
    perfil.rol === 'admin_th' ||
    perfil.rol === 'gerencia' ||
    (perfil.rol === 'lider' && (colaborador.lider_id === perfil.colaborador_id || colaborador.id === perfil.colaborador_id)) ||
    (perfil.rol === 'colaborador' && perfil.colaborador_id === colaborador.id);
  if (!puedeVer) notFound();

  // El historial (movimientos + entrevista de salida) es de manejo exclusivo
  // de Talento Humano y del líder directo — sin policy de RLS para gerencia
  // ni para el propio colaborador, así que tampoco se enlaza para ellos aquí.
  const puedeVerHistorial =
    perfil.rol === 'admin_th' || (perfil.rol === 'lider' && colaborador.lider_id === perfil.colaborador_id);

  // Documentos (hoja de vida, contrato, certificado laboral): solo Talento
  // Humano y el propio colaborador, ni siquiera el líder — el contrato trae
  // el salario.
  const puedeVerDocumentos = perfil.rol === 'admin_th' || (perfil.rol === 'colaborador' && perfil.colaborador_id === colaborador.id);

  // Incapacidades (dato de salud): mismo nivel que Documentos — admin_th y
  // el propio colaborador, sin el líder.
  const puedeVerIncapacidades = puedeVerDocumentos;

  // Fechas especiales (cumpleaños, día de la profesión, etc.): Talento
  // Humano y el líder directo las administran desde la ficha; el propio
  // colaborador las administra desde Mi Perfil, no desde aquí.
  const puedeVerFechasEspeciales =
    perfil.rol === 'admin_th' || (perfil.rol === 'lider' && colaborador.lider_id === perfil.colaborador_id);

  // Dotación: mismo criterio que hoja_vida_formacion (admin_th todo, líder de
  // su equipo, colaborador lo propio) — ver 0067_dotacion.sql.
  const puedeVerDotacion =
    perfil.rol === 'admin_th' ||
    (perfil.rol === 'lider' && colaborador.lider_id === perfil.colaborador_id) ||
    (perfil.rol === 'colaborador' && perfil.colaborador_id === colaborador.id);

  const [{ data: ultimoResultado }, { data: saber }, { data: ser }, { data: serPromedio }, { data: pdi }, { data: hojaVida }, { data: induccionItems }] =
    await Promise.all([
      supabase
        .from('resultados_evaluacion')
        .select('indice_hacer, indice_deber, semaforo_hacer, semaforo_deber, brecha_hacer, brecha_deber, actualizado_en, evaluacion:evaluaciones!inner(colaborador_evaluado_id)')
        .eq('evaluacion.colaborador_evaluado_id', params.id)
        .order('actualizado_en', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('v_saber_cumplimiento').select('*').eq('colaborador_id', params.id).maybeSingle(),
      supabase
        .from('guia_del_flow')
        .select('id')
        .eq('colaborador_id', params.id)
        .order('fecha_aplicacion', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('v_ser_promedio').select('promedio_ser, total_aspectos_calificados').eq('colaborador_id', params.id).maybeSingle(),
      supabase
        .from('planes_desarrollo')
        .select('*')
        .eq('colaborador_id', params.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('hoja_vida_formacion')
        .select('*')
        .eq('colaborador_id', params.id)
        .order('fecha_inicio', { ascending: false }),
      supabase.from('colaborador_induccion_items').select('completado').eq('colaborador_id', params.id),
    ]);

  const cargo = colaborador.cargo as any;
  const lider = colaborador.lider as any;
  const totalInduccion = induccionItems?.length ?? 0;
  const completadosInduccion = induccionItems?.filter((i) => i.completado).length ?? 0;
  const pctInduccion = totalInduccion > 0 ? Math.round((completadosInduccion / totalInduccion) * 100) : null;

  return (
    <div className="space-y-6">
      {/* Encabezado de la ficha */}
      <div className="card p-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-flow-100 text-flow-700 flex items-center justify-center font-display text-lg font-semibold">
            {colaborador.nombre_completo
              .split(' ')
              .slice(0, 2)
              .map((n: string) => n[0])
              .join('')}
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-secundario">
              {colaborador.nombre_completo}
            </h1>
            <p className="text-sm text-marmol-500">
              {cargo?.nombre} · {cargo?.proceso_area}
            </p>
            <p className="text-xs text-marmol-400 mt-1">
              Ingreso: {formatearFecha(colaborador.fecha_ingreso)} · Líder: {lider?.nombre_completo ?? '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center rounded-full bg-marmol-100 px-3 py-1 text-xs font-medium text-marmol-600 capitalize">
            {colaborador.estado.replace(/_/g, ' ')}
          </span>
          {perfil.rol === 'admin_th' && (
            <Link
              href={`/espiral-crecimiento/colaboradores/${params.id}/editar`}
              className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 hover:text-flow-600 text-xs font-medium px-2.5 py-1.5 transition"
            >
              <Pencil size={12} /> Editar
            </Link>
          )}
        </div>
      </div>

      {/* Las cuatro dimensiones, de un vistazo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href={`/espiral-crecimiento/colaboradores/${params.id}/guia-flow`} className="card p-4 hover:border-flow-300 transition">
          <p className="text-xs font-medium text-marmol-500 mb-2 flex items-center gap-1.5">
            <Sparkles size={14} className="text-ser" /> SER
          </p>
          {serPromedio?.promedio_ser != null ? (
            <>
              <p className="text-2xl font-display font-semibold text-secundario">{serPromedio.promedio_ser} / 5</p>
              <p className="text-xs text-marmol-400">
                promedio de {serPromedio.total_aspectos_calificados} aspecto{serPromedio.total_aspectos_calificados === 1 ? '' : 's'}
              </p>
            </>
          ) : (
            <p className="text-sm text-marmol-700">{ser ? 'Guía del Flow completada, cargando puntajes…' : 'Pendiente por completar'}</p>
          )}
        </Link>
        <Link href={`/espiral-crecimiento/colaboradores/${params.id}/saber`} className="card p-4 hover:border-flow-300 transition">
          <p className="text-xs font-medium text-marmol-500 mb-2 flex items-center gap-1.5">
            <GraduationCap size={14} className="text-saber" /> SABER
          </p>
          <p className="text-2xl font-display font-semibold text-secundario">
            {saber?.porcentaje_cumplimiento != null ? `${saber.porcentaje_cumplimiento}%` : '—'}
          </p>
          <p className="text-xs text-marmol-400">cumplimiento del perfil</p>
        </Link>
        <div className="card p-4">
          <p className="text-xs font-medium text-marmol-500 mb-2 flex items-center gap-1.5">
            <Briefcase size={14} className="text-hacer" /> HACER
          </p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-display font-semibold text-secundario">
              {ultimoResultado?.indice_hacer ?? '—'}
            </p>
            <SemaforoBadge nivel={ultimoResultado?.semaforo_hacer as any} />
          </div>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-marmol-500 mb-2 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-deber" /> DEBER
          </p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-display font-semibold text-secundario">
              {ultimoResultado?.indice_deber ?? '—'}
            </p>
            <SemaforoBadge nivel={ultimoResultado?.semaforo_deber as any} />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Perfil de cargo (Saber) */}
        <div className="card p-5">
          <h2 className="font-display font-semibold text-secundario mb-3">Perfil de cargo</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-marmol-500">Objetivo del cargo</dt>
            </div>
            <p className="text-marmol-700">{cargo?.objetivo_cargo ?? 'No definido aún.'}</p>
            <div className="flex justify-between pt-2 border-t border-marmol-100">
              <dt className="text-marmol-500">¿Tiene personal a cargo?</dt>
              <dd className="text-marmol-800 font-medium">{cargo?.tiene_personal_a_cargo ? 'Sí' : 'No'}</dd>
            </div>
          </dl>
        </div>

        {/* Inducción */}
        <Link href={`/espiral-crecimiento/colaboradores/${params.id}/induccion`} className="card p-5 block hover:border-flow-300 transition">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-secundario flex items-center gap-1.5">
              <GraduationCap size={16} /> Inducción
            </h2>
            {pctInduccion !== null && (
              <span className="text-sm font-semibold text-secundario">{pctInduccion}%</span>
            )}
          </div>
          {totalInduccion === 0 ? (
            <p className="text-sm text-marmol-400">Sin plan de inducción asignado todavía.</p>
          ) : (
            <>
              <div className="h-2 rounded-full bg-marmol-100 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-flow-500 to-acento rounded-full" style={{ width: `${pctInduccion}%` }} />
              </div>
              <p className="text-xs text-marmol-400 mt-1.5">
                {completadosInduccion} de {totalInduccion} puntos cumplidos
              </p>
            </>
          )}
        </Link>

        {/* Hoja de vida / formación */}
        <Link href={`/espiral-crecimiento/colaboradores/${params.id}/hoja-vida`} className="card p-5 block hover:border-flow-300 transition">
          <h2 className="font-display font-semibold text-secundario mb-3 flex items-center gap-1.5">
            <Clock size={16} /> Hoja de vida y certificaciones
          </h2>
          {!hojaVida || hojaVida.length === 0 ? (
            <p className="text-sm text-marmol-400">Sin registros de formación cargados.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {hojaVida.map((h) => (
                <li key={h.id} className="flex justify-between border-b border-marmol-100 pb-2 last:border-0">
                  <div>
                    <p className="font-medium text-marmol-800">{h.titulo}</p>
                    <p className="text-xs text-marmol-400 capitalize">{h.tipo?.replace(/_/g, ' ')}</p>
                  </div>
                  {h.fecha_vencimiento && (
                    <span className="text-xs text-medio">Vence: {formatearFecha(h.fecha_vencimiento)}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Link>
      </div>

      {/* Plan de Desarrollo Individual */}
      <div className="card p-5">
        <h2 className="font-display font-semibold text-secundario mb-3 flex items-center gap-1.5">
          <Target size={16} /> Plan de Desarrollo Individual
        </h2>
        {!pdi || pdi.length === 0 ? (
          <p className="text-sm text-marmol-400">Sin acciones de desarrollo registradas todavía.</p>
        ) : (
          <div className="space-y-2">
            {pdi.map((p) => (
              <div key={p.id} className="flex items-center justify-between border-b border-marmol-100 pb-2 last:border-0">
                <div>
                  <p className="text-sm font-medium text-marmol-800">{p.accion}</p>
                  <p className="text-xs text-marmol-400">
                    Origen: {p.origen} · Brecha: {p.brecha_detectada}
                  </p>
                </div>
                <span className="text-xs rounded-full bg-marmol-100 px-2 py-0.5 capitalize text-marmol-600">
                  {p.estado.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {puedeVerDocumentos && (
          <Link
            href={`/espiral-crecimiento/colaboradores/${params.id}/documentos`}
            className="card p-5 flex items-center gap-2 hover:border-flow-300 transition"
          >
            <FolderLock size={16} className="text-flow-600" />
            <span className="text-sm font-medium text-marmol-800">Documentos y certificado laboral</span>
          </Link>
        )}

        {puedeVerIncapacidades && (
          <Link
            href={`/espiral-crecimiento/colaboradores/${params.id}/incapacidades`}
            className="card p-5 flex items-center gap-2 hover:border-flow-300 transition"
          >
            <HeartPulse size={16} className="text-flow-600" />
            <span className="text-sm font-medium text-marmol-800">Incapacidades</span>
          </Link>
        )}

        {puedeVerHistorial && (
          <Link
            href={`/espiral-crecimiento/colaboradores/${params.id}/historial`}
            className="card p-5 flex items-center gap-2 hover:border-flow-300 transition"
          >
            <History size={16} className="text-flow-600" />
            <span className="text-sm font-medium text-marmol-800">Ver historial y línea de tiempo</span>
          </Link>
        )}

        {puedeVerFechasEspeciales && (
          <Link
            href={`/espiral-crecimiento/colaboradores/${params.id}/fechas-especiales`}
            className="card p-5 flex items-center gap-2 hover:border-flow-300 transition"
          >
            <CalendarHeart size={16} className="text-flow-600" />
            <span className="text-sm font-medium text-marmol-800">Fechas especiales</span>
          </Link>
        )}

        {puedeVerDotacion && (
          <Link
            href={`/dotacion?colaborador_id=${params.id}`}
            className="card p-5 flex items-center gap-2 hover:border-flow-300 transition"
          >
            <Shirt size={16} className="text-flow-600" />
            <span className="text-sm font-medium text-marmol-800">Dotación</span>
          </Link>
        )}
      </div>

      {colaborador.estado === 'en_proceso_salida' && puedeVerDotacion && (
        <p className="text-xs text-medio bg-medio/10 border border-medio/20 rounded-lg px-3 py-2">
          Esta persona está en proceso de salida — revisa en Dotación que no queden equipos ni elementos
          pendientes de devolución.
        </p>
      )}
    </div>
  );
}
