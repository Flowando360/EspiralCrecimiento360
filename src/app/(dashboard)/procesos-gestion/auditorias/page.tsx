import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ListaAuditorias, type Auditoria } from '@/components/procesos-gestion/lista-auditorias';

const ROLES_VISTA = ['admin_th', 'lider', 'gerencia', 'auditor_externo'];

export default async function AuditoriasInternasPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!ROLES_VISTA.includes(perfil.rol)) redirect('/inicio');

  const supabase = createClient();

  const [{ data: auditoriasRaw }, { data: procesos }, { data: colaboradores }] = await Promise.all([
    supabase.from('auditorias_internas').select('id, codigo, objetivo, alcance, marco_normativo, auditor_id, auditor_externo_nombre, fecha_planeada, fecha_ejecutada, estado').eq('empresa_id', perfil.empresa_id).order('created_at', { ascending: false }),
    supabase.from('procesos_gestion').select('id, nombre, codigo').eq('empresa_id', perfil.empresa_id).order('codigo'),
    supabase.from('colaboradores').select('id, nombre_completo').eq('empresa_id', perfil.empresa_id).eq('estado', 'activo').order('nombre_completo'),
  ]);

  const auditoriaIds = (auditoriasRaw ?? []).map((a: any) => a.id);
  const [{ data: auditoriaProcesosRaw }, { data: hallazgosRaw }] = await Promise.all([
    auditoriaIds.length
      ? supabase.from('auditoria_procesos').select('auditoria_id, proceso:proceso_id(id, nombre, codigo)').in('auditoria_id', auditoriaIds)
      : Promise.resolve({ data: [] } as any),
    auditoriaIds.length
      ? supabase.from('hallazgos_auditoria').select('auditoria_id, estado').in('auditoria_id', auditoriaIds)
      : Promise.resolve({ data: [] } as any),
  ]);

  const procesosPorAuditoria = new Map<string, { id: string; nombre: string; codigo: string | null }[]>();
  for (const ap of auditoriaProcesosRaw ?? []) {
    const lista = procesosPorAuditoria.get((ap as any).auditoria_id) ?? [];
    if ((ap as any).proceso) lista.push((ap as any).proceso);
    procesosPorAuditoria.set((ap as any).auditoria_id, lista);
  }

  const abiertosPorAuditoria = new Map<string, number>();
  for (const h of hallazgosRaw ?? []) {
    if ((h as any).estado !== 'cerrado') {
      abiertosPorAuditoria.set((h as any).auditoria_id, (abiertosPorAuditoria.get((h as any).auditoria_id) ?? 0) + 1);
    }
  }

  const auditorias: Auditoria[] = (auditoriasRaw ?? []).map((a: any) => ({
    ...a,
    procesos: procesosPorAuditoria.get(a.id) ?? [],
    hallazgos_abiertos: abiertosPorAuditoria.get(a.id) ?? 0,
  }));

  return (
    <div className="space-y-4">
      <div>
        <Link href="/procesos-gestion" className="inline-flex items-center gap-1 text-sm text-marmol-500 hover:text-flow-600 mb-2">
          <ChevronLeft size={14} /> Procesos y Sistemas de Gestión
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario">Auditorías internas</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Planeación, ejecución y hallazgos de tus auditorías internas — distinto del paquete de Evidencia de
          auditoría, que empaqueta todo para el auditor externo.
        </p>
      </div>

      <ListaAuditorias
        auditoriasIniciales={auditorias}
        procesos={(procesos ?? []) as any}
        colaboradores={(colaboradores ?? []) as any}
        puedeEditar={perfil.rol === 'admin_th'}
      />
    </div>
  );
}
