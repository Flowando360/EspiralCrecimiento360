import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, KanbanSquare, FileStack } from 'lucide-react';
import { FichaProceso } from '@/components/procesos-gestion/ficha-proceso';
import { formatearFecha } from '@/lib/utils';

const ETIQUETA_TIPO: Record<string, string> = {
  estrategico: 'Estratégico',
  misional: 'Misional',
  apoyo: 'Apoyo',
  evaluacion: 'Evaluación',
};

const ETIQUETA_MARCO: Record<string, string> = {
  iso_9001: 'ISO 9001',
  sst: 'SST',
  sarlaft_sagrilaft: 'SARLAFT/SAGRILAFT',
  ptee: 'PTEE',
  interno: 'Interno',
};

export default async function FichaProcesoPage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!['admin_th', 'lider', 'gerencia'].includes(perfil.rol)) redirect('/inicio');

  const supabase = createClient();
  const puedeEditar = perfil.rol === 'admin_th';

  const { data: proceso } = await supabase
    .from('procesos_gestion')
    .select('id, area_proceso, nombre, descripcion, tipo, codigo, objetivo, estado, responsable_id, version, fecha_actualizacion')
    .eq('id', params.id)
    .eq('empresa_id', perfil.empresa_id)
    .maybeSingle();

  if (!proceso) notFound();

  const [{ data: marcos }, { data: elementos }, { data: procesos }, { data: documentos }, { data: responsable }] = await Promise.all([
    supabase.from('proceso_marcos_normativos').select('marco_normativo').eq('proceso_id', params.id),
    supabase.from('elementos_proceso').select('id, tipo, descripcion, proceso_relacionado_id, orden').eq('proceso_id', params.id),
    supabase.from('procesos_gestion').select('id, nombre, codigo').eq('empresa_id', perfil.empresa_id).neq('id', params.id).order('codigo'),
    supabase.from('documentos_proceso').select('id, codigo, nombre, tipo_documento, version_vigente, estado').eq('proceso_id', params.id).order('codigo'),
    proceso.responsable_id
      ? supabase.from('colaboradores').select('nombre_completo').eq('id', proceso.responsable_id).maybeSingle()
      : Promise.resolve({ data: null } as any),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <Link href="/procesos-gestion" className="inline-flex items-center gap-1 text-sm text-marmol-500 hover:text-flow-600 mb-2">
          <ChevronLeft size={14} /> Procesos y Sistemas de Gestión
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {proceso.codigo && <span className="text-sm font-semibold text-marmol-400">{proceso.codigo}</span>}
              <h1 className="font-display text-2xl font-semibold text-secundario">{proceso.nombre}</h1>
            </div>
            <p className="text-sm text-marmol-500 mt-1">
              {proceso.area_proceso}
              {proceso.tipo && ` · ${ETIQUETA_TIPO[proceso.tipo]}`}
              {responsable?.nombre_completo && ` · Responsable: ${responsable.nombre_completo}`}
              {` · Actualizado ${formatearFecha(proceso.fecha_actualizacion)}`}
            </p>
            {proceso.objetivo && <p className="text-sm text-marmol-600 mt-2 max-w-2xl">{proceso.objetivo}</p>}
            {(marcos ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(marcos ?? []).map((m: any) => (
                  <span key={m.marco_normativo} className="text-[10px] rounded-full bg-flow-50 text-flow-700 px-1.5 py-0.5 font-medium">
                    {ETIQUETA_MARCO[m.marco_normativo]}
                  </span>
                ))}
              </div>
            )}
          </div>
          <Link
            href={`/procesos-gestion/${proceso.id}/tablero`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:bg-marmol-50 text-marmol-600 text-sm font-medium px-3.5 py-2 shrink-0"
          >
            <KanbanSquare size={15} /> Ver tablero
          </Link>
        </div>
      </div>

      <FichaProceso procesoId={proceso.id} elementosIniciales={(elementos ?? []) as any} procesosDisponibles={(procesos ?? []) as any} puedeEditar={puedeEditar} />

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-secundario">Documentos vinculados</h2>
          <Link href="/procesos-gestion/documentos" className="text-xs text-flow-600 hover:text-flow-700 inline-flex items-center gap-1">
            <FileStack size={13} /> Ir a Gestión documental
          </Link>
        </div>
        <div className="space-y-1.5">
          {(documentos ?? []).map((d: any) => (
            <Link
              key={d.id}
              href={`/procesos-gestion/documentos/${d.id}`}
              className="flex items-center justify-between text-sm border-b border-marmol-50 pb-1.5 hover:text-flow-600"
            >
              <span>
                <span className="text-marmol-400">{d.codigo}</span> {d.nombre}
              </span>
              <span className="text-xs text-marmol-400">
                {d.version_vigente} · {d.estado}
              </span>
            </Link>
          ))}
          {(documentos ?? []).length === 0 && <p className="text-sm text-marmol-400">Sin documentos vinculados todavía.</p>}
        </div>
      </div>
    </div>
  );
}
