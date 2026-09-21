import Link from 'next/link';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft, ClipboardList } from 'lucide-react';
import { formatearFecha } from '@/lib/utils';
import { DiagnosticoIso9001Form } from '@/components/procesos-gestion/diagnostico-iso9001-form';

export default async function DetalleDiagnosticoIso9001Page({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!['admin_th', 'lider', 'gerencia'].includes(perfil.rol)) redirect('/inicio');

  const supabase = createClient();

  const { data: diagnostico } = await supabase
    .from('diagnosticos_iso9001')
    .select('id, empresa_id, fecha, estado, realizado_por:colaboradores(nombre_completo)')
    .eq('id', params.id)
    .maybeSingle();

  if (!diagnostico || diagnostico.empresa_id !== perfil.empresa_id) notFound();

  const [{ data: items }, { data: respuestas }] = await Promise.all([
    supabase.from('diagnostico_iso9001_items').select('id, clausula, numeral, titulo, guia').order('orden'),
    supabase.from('diagnostico_iso9001_respuestas').select('item_id, nivel, observacion').eq('diagnostico_id', params.id),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <Link href="/procesos-gestion/diagnostico-iso9001" className="inline-flex items-center gap-1 text-sm text-marmol-500 hover:text-flow-600 mb-2">
          <ChevronLeft size={14} /> Diagnóstico ISO 9001:2015
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <ClipboardList size={22} className="text-flow-600" /> Diagnóstico del {formatearFecha(diagnostico.fecha)}
        </h1>
        {(diagnostico.realizado_por as any)?.nombre_completo && (
          <p className="text-sm text-marmol-500 mt-1">Realizado por {(diagnostico.realizado_por as any).nombre_completo}</p>
        )}
      </div>

      <DiagnosticoIso9001Form
        diagnosticoId={diagnostico.id}
        items={(items ?? []) as any}
        respuestasIniciales={(respuestas ?? []) as any}
        estado={diagnostico.estado as 'en_progreso' | 'completado'}
        puedeEditar={perfil.rol === 'admin_th'}
      />
    </div>
  );
}
