import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Stethoscope } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { ExamenesMedicos, type ExamenItem } from '@/components/espiral-crecimiento/examenes-medicos';

export default async function ExamenesMedicosPage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  const supabase = createClient() as any;

  const { data: colaborador } = await supabase.from('colaboradores').select('id, nombre_completo, empresa_id').eq('id', params.id).maybeSingle();
  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) notFound();

  // Dato sensible de salud: solo Talento Humano y la propia persona (ni siquiera el líder directo).
  const puedeVer = perfil.rol === 'admin_th' || (perfil.rol === 'colaborador' && perfil.colaborador_id === colaborador.id);
  if (!puedeVer) notFound();

  const { data } = await supabase
    .from('examenes_medicos_colaborador')
    .select('id, tipo, fecha_realizado, proxima_fecha, concepto, entidad')
    .eq('colaborador_id', params.id)
    .order('fecha_realizado', { ascending: false });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href={`/espiral-crecimiento/colaboradores/${params.id}`} className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2">
          <ArrowLeft size={12} /> Volver a la ficha
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <Stethoscope size={22} className="text-flow-600" /> Exámenes médicos
        </h1>
        <p className="text-sm text-marmol-500 mt-1">{colaborador.nombre_completo}</p>
        <p className="text-xs text-marmol-400 mt-1">
          Preingreso, periódicos y de egreso. Solo se guarda el concepto general, nunca el diagnóstico. Sección de manejo exclusivo de Talento Humano y de la propia persona.
        </p>
      </div>
      <div className="card p-5">
        <ExamenesMedicos colaboradorId={params.id} items={(data ?? []) as ExamenItem[]} puedeEditar={perfil.rol === 'admin_th'} />
      </div>
    </div>
  );
}
