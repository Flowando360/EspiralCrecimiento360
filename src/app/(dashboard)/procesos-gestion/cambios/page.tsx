import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ListaCambios, type SolicitudCambio } from '@/components/procesos-gestion/lista-cambios';

export default async function GestionCambioPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!['admin_th', 'lider', 'gerencia'].includes(perfil.rol)) redirect('/inicio');

  const supabase = createClient();

  const [{ data: solicitudesRaw }, { data: procesos }] = await Promise.all([
    supabase
      .from('solicitudes_cambio')
      .select('id, codigo, titulo, descripcion, tipo_cambio, motivo, impacto, evaluacion, estado, fecha_solicitud, proceso:proceso_id(nombre, codigo, empresa_id)')
      .order('fecha_solicitud', { ascending: false }),
    supabase.from('procesos_gestion').select('id, nombre, codigo').eq('empresa_id', perfil.empresa_id).order('codigo'),
  ]);

  const solicitudes: SolicitudCambio[] = (solicitudesRaw ?? [])
    .filter((s: any) => s.proceso?.empresa_id === perfil.empresa_id)
    .map((s: any) => ({
      id: s.id,
      codigo: s.codigo,
      titulo: s.titulo,
      descripcion: s.descripcion,
      tipo_cambio: s.tipo_cambio,
      motivo: s.motivo,
      impacto: s.impacto,
      evaluacion: s.evaluacion,
      estado: s.estado,
      fecha_solicitud: s.fecha_solicitud,
      proceso_nombre: s.proceso?.nombre ?? '—',
      proceso_codigo: s.proceso?.codigo ?? null,
    }));

  return (
    <div className="space-y-4">
      <div>
        <Link href="/procesos-gestion" className="inline-flex items-center gap-1 text-sm text-marmol-500 hover:text-flow-600 mb-2">
          <ChevronLeft size={14} /> Procesos y Sistemas de Gestión
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario">Gestión de cambio</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Distinto de Gestión documental: aquí se evalúa el impacto de un cambio a un proceso, sistema o
          estructura antes de aprobarlo — no la versión de un documento puntual.
        </p>
      </div>

      <ListaCambios
        solicitudesIniciales={solicitudes}
        procesos={(procesos ?? []) as any}
        puedeAprobar={perfil.rol === 'admin_th'}
        puedeSolicitar={['admin_th', 'lider'].includes(perfil.rol)}
      />
    </div>
  );
}
