import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { ReabrirValoracion } from '@/components/espiral-crecimiento/reabrir-valoracion';
import { InvitarClienteInterno } from '@/components/espiral-crecimiento/invitar-cliente-interno';
import { QuitarClienteInterno } from '@/components/espiral-crecimiento/quitar-cliente-interno';
import { ESTADOS_VIGENTES } from '@/lib/colaboradores/estados';
import { formatearFecha, primero } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const TIPOS: Record<string, string> = {
  autoevaluacion: 'Autoevaluación',
  lider: 'Líder',
  par: 'Par',
  colaborador_a_cargo: 'Colaborador a cargo',
  cliente_interno: 'Cliente interno',
};

export default async function ValoracionesDeUnaEvaluacionPage({ params }: { params: { evaluacionId: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') notFound();
  const supabase = createClient();

  const { data: evaluacion } = await supabase
    .from('evaluaciones')
    .select('id, ciclo_id, colaborador:colaborador_evaluado_id(nombre_completo, empresa_id)')
    .eq('id', params.evaluacionId)
    .maybeSingle();
  const evaluado = primero(evaluacion?.colaborador as any) as any;
  if (!evaluacion || evaluado?.empresa_id !== perfil.empresa_id) notFound();

  const { data: tareas } = await supabase
    .from('evaluacion_tareas')
    .select('id, tipo_evaluador, completada, fecha_completada, evaluador:evaluador_colaborador_id(nombre_completo)')
    .eq('evaluacion_id', evaluacion.id)
    .order('tipo_evaluador');

  const { data: posibles } = await supabase
    .from('colaboradores')
    .select('id, nombre_completo')
    .eq('empresa_id', perfil.empresa_id)
    .in('estado', ESTADOS_VIGENTES)
    .eq('es_externo', false)
    .order('nombre_completo');
  const { data: tareasIds } = await supabase.from('evaluacion_tareas').select('evaluador_colaborador_id').eq('evaluacion_id', evaluacion.id);
  const ocupados = new Set(((tareasIds ?? []) as any[]).map((t) => t.evaluador_colaborador_id as string));
  const opcionesCliente = ((posibles ?? []) as any[]).filter((c) => !ocupados.has(c.id) && c.id !== evaluado.id).map((c) => ({ id: c.id as string, nombre: c.nombre_completo as string }));

  const { data: historial } = await supabase
    .from('auditoria_cambios')
    .select('id, creado_en, usuario_nombre, accion, resumen, detalle')
    .eq('empresa_id', perfil.empresa_id)
    .eq('modulo', 'valoraciones')
    .filter('detalle->>evaluacion_id', 'eq', evaluacion.id)
    .order('creado_en', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <Link href={`/espiral-crecimiento/ciclos/${evaluacion.ciclo_id}`} className="inline-flex items-center gap-1 text-sm text-flow-600 hover:text-flow-700">
        <ArrowLeft size={14} /> Volver al ciclo
      </Link>
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Valoraciones de {evaluado.nombre_completo}</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Una valoración enviada no se puede modificar. Si hubo un error, puedes reabrirla con un motivo: queda registrado y el evaluador podrá corregirla y enviarla de nuevo.
        </p>
      </div>

      <div className="card divide-y divide-marmol-100">
        {(tareas ?? []).length === 0 && <p className="p-4 text-sm text-marmol-500">Esta evaluación no tiene valoraciones asignadas.</p>}
        {(tareas ?? []).map((t: any) => {
          const nombre = primero(t.evaluador)?.nombre_completo ?? 'Evaluador';
          return (
            <div key={t.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-marmol-900">{nombre}</p>
                <p className="text-xs text-marmol-500">
                  {TIPOS[t.tipo_evaluador] ?? t.tipo_evaluador} ·{' '}
                  {t.completada ? `Enviada el ${formatearFecha(t.fecha_completada)}` : 'Pendiente o en borrador (no cuenta en resultados)'}
                </p>
              </div>
              {t.completada ? (
                <ReabrirValoracion tareaId={t.id} evaluador={nombre} />
              ) : t.tipo_evaluador === 'cliente_interno' ? (
                <QuitarClienteInterno evaluacionId={evaluacion.id} tareaId={t.id} />
              ) : (
                <span className="text-xs text-marmol-400">Abierta</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="card p-4 space-y-2">
        <h2 className="font-display text-lg font-semibold text-secundario">Invitar a un cliente interno</h2>
        <p className="text-xs text-marmol-400 max-w-xl">
          Un cliente interno es alguien (de otra área, por ejemplo) que recibe el servicio de {evaluado.nombre_completo}. Responde solo las competencias funcionales y las funciones del cargo, puede usar «No aplica» y su opinión cuenta como una fuente más si el ciclo le asignó peso (Administración → Configuración). Nunca se muestra quién respondió.
        </p>
        <InvitarClienteInterno evaluacionId={evaluacion.id} opciones={opcionesCliente} />
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-secundario mb-2">Registro de envíos y reaperturas</h2>
        {(historial ?? []).length === 0 ? (
          <p className="text-sm text-marmol-500">Aún no hay movimientos registrados.</p>
        ) : (
          <ul className="card divide-y divide-marmol-100 text-sm">
            {(historial ?? []).map((h: any) => (
              <li key={h.id} className="p-3">
                <p className="text-marmol-900">{h.resumen}</p>
                <p className="text-xs text-marmol-500">
                  {formatearFecha(h.creado_en)} · {h.usuario_nombre}
                  {h.detalle?.motivo ? ` · Motivo: ${h.detalle.motivo}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
