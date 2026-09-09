import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ListaInvitaciones, type FilaColaborador } from './ListaInvitaciones';

export default async function InvitacionesGuiaFlowPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/inicio');

  const supabase = createClient();

  // Incluye período de prueba además de activo -- alguien recién
  // contratado necesita la Guía del Flow desde el inicio (es parte de la
  // inducción), y el invitar de a uno desde la ficha del colaborador nunca
  // tuvo esta restricción de estado. Quedan afuera inactivo/en proceso de
  // salida: gente que ya no está o está por irse.
  const { data: colaboradores } = await supabase
    .from('colaboradores')
    .select('id, nombre_completo, email')
    .eq('empresa_id', perfil.empresa_id)
    .eq('es_externo', false)
    .in('estado', ['activo', 'periodo_prueba'])
    .order('nombre_completo');

  const colaboradorIds = (colaboradores ?? []).map((c) => c.id);

  const [{ data: guias }, { data: invitaciones }] = await Promise.all([
    colaboradorIds.length > 0
      ? supabase.from('guia_del_flow').select('colaborador_id').in('colaborador_id', colaboradorIds)
      : Promise.resolve({ data: [] as { colaborador_id: string }[] }),
    colaboradorIds.length > 0
      ? supabase
          .from('guia_del_flow_invitaciones')
          .select('colaborador_id, usado_at')
          .in('colaborador_id', colaboradorIds)
      : Promise.resolve({ data: [] as { colaborador_id: string; usado_at: string | null }[] }),
  ]);

  const conGuia = new Set((guias ?? []).map((g) => g.colaborador_id as string));
  const conInvitacionPendiente = new Set(
    ((invitaciones ?? []) as any[]).filter((i) => !i.usado_at).map((i) => i.colaborador_id as string)
  );

  const filas: FilaColaborador[] = (colaboradores ?? []).map((c) => ({
    id: c.id,
    nombre: c.nombre_completo,
    correo: c.email,
    estado: conGuia.has(c.id) ? 'guia_generada' : conInvitacionPendiente.has(c.id) ? 'invitacion_pendiente' : 'sin_invitar',
  }));

  return (
    <div className="space-y-4">
      <p className="text-sm text-marmol-500">
        Elige a quiénes de tu empresa les quieres mandar el cuestionario de la Guía del Flow y genera todos
        sus links de una vez. Cada link queda ligado exactamente a esa persona (aunque no tenga correo
        cargado), así que puedes copiarlos y mandarlos por donde prefieras — WhatsApp, correo personal, etc.
      </p>

      <ListaInvitaciones colaboradores={filas} />
    </div>
  );
}
