import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { HallazgosKanban } from '@/components/procesos-gestion/hallazgos-kanban';
import { formatearFecha } from '@/lib/utils';

const ROLES_VISTA = ['admin_th', 'lider', 'gerencia', 'auditor_externo'];

const ETIQUETA_MARCO: Record<string, string> = {
  iso_9001: 'ISO 9001',
  sst: 'SST',
  sarlaft_sagrilaft: 'SARLAFT/SAGRILAFT',
  ptee: 'PTEE',
  interno: 'Interno',
};

const ETIQUETA_ESTADO: Record<string, string> = { planeada: 'Planeada', en_curso: 'En curso', cerrada: 'Cerrada' };

export default async function DetalleAuditoriaPage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!ROLES_VISTA.includes(perfil.rol)) redirect('/inicio');

  const supabase = createClient();

  const { data: auditoria } = await supabase
    .from('auditorias_internas')
    .select('id, codigo, objetivo, alcance, marco_normativo, auditor_id, auditor_externo_nombre, fecha_planeada, fecha_ejecutada, estado, empresa_id')
    .eq('id', params.id)
    .maybeSingle();

  if (!auditoria || auditoria.empresa_id !== perfil.empresa_id) notFound();

  const [{ data: auditoriaProcesosRaw }, { data: hallazgos }, { data: colaboradores }, { data: auditor }] = await Promise.all([
    supabase.from('auditoria_procesos').select('proceso:proceso_id(id, nombre, codigo)').eq('auditoria_id', params.id),
    supabase
      .from('hallazgos_auditoria')
      .select('id, codigo, proceso_id, tipo, descripcion, requisito_incumplido, responsable_id, estado, fecha_deteccion')
      .eq('auditoria_id', params.id),
    supabase.from('colaboradores').select('id, nombre_completo').eq('empresa_id', perfil.empresa_id).eq('estado', 'activo').order('nombre_completo'),
    auditoria.auditor_id ? supabase.from('colaboradores').select('nombre_completo').eq('id', auditoria.auditor_id).maybeSingle() : Promise.resolve({ data: null } as any),
  ]);

  const procesos = (auditoriaProcesosRaw ?? []).map((ap: any) => ap.proceso).filter(Boolean);

  return (
    <div className="space-y-4">
      <div>
        <Link href="/procesos-gestion/auditorias" className="inline-flex items-center gap-1 text-sm text-marmol-500 hover:text-flow-600 mb-2">
          <ChevronLeft size={14} /> Auditorías internas
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          {auditoria.codigo && <span className="text-sm font-semibold text-marmol-400">{auditoria.codigo}</span>}
          <span className="text-[11px] rounded-full px-2 py-0.5 font-medium badge-marmol">{ETIQUETA_ESTADO[auditoria.estado]}</span>
          {auditoria.marco_normativo && <span className="text-[11px] rounded-full bg-flow-50 text-flow-700 px-2 py-0.5 font-medium">{ETIQUETA_MARCO[auditoria.marco_normativo]}</span>}
        </div>
        <h1 className="font-display text-2xl font-semibold text-secundario mt-1">{auditoria.objetivo || 'Auditoría interna'}</h1>
        <p className="text-sm text-marmol-500 mt-1">
          {procesos.map((p: any) => p.codigo ?? p.nombre).join(', ') || 'Sin procesos asociados'}
          {(auditor?.nombre_completo || auditoria.auditor_externo_nombre) && ` · Auditor: ${auditor?.nombre_completo ?? auditoria.auditor_externo_nombre}`}
          {auditoria.fecha_planeada && ` · Planeada ${formatearFecha(auditoria.fecha_planeada)}`}
        </p>
        {auditoria.alcance && <p className="text-sm text-marmol-600 mt-2 max-w-2xl">{auditoria.alcance}</p>}
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold text-secundario mb-1">Hallazgos</h2>
        <p className="text-xs text-marmol-400 mb-3">Abierto → Análisis de causa → Plan de acción → Seguimiento → Cerrado. Arrastra una tarjeta para cambiar su estado.</p>
        <HallazgosKanban
          auditoriaId={auditoria.id}
          hallazgosIniciales={(hallazgos ?? []) as any}
          procesosDeLaAuditoria={procesos as any}
          colaboradores={(colaboradores ?? []) as any}
          puedeEditar={perfil.rol === 'admin_th'}
        />
      </div>
    </div>
  );
}
