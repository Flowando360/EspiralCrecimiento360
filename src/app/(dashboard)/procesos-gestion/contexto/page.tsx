import Link from 'next/link';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChevronLeft, Compass } from 'lucide-react';
import { ListaAnalisisContexto } from '@/components/procesos-gestion/lista-analisis-contexto';

export default async function ContextoPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!['admin_th', 'lider', 'gerencia'].includes(perfil.rol)) redirect('/inicio');

  const supabase = createClient();

  const { data: analisisRaw } = await supabase
    .from('analisis_contexto')
    .select('id, fecha, notas, responsable_id, created_at')
    .eq('empresa_id', perfil.empresa_id)
    .order('fecha', { ascending: false });

  const analisisIds = (analisisRaw ?? []).map((a) => a.id);
  const { data: itemsRaw } = analisisIds.length
    ? await supabase.from('contexto_items').select('analisis_id, tipo').in('analisis_id', analisisIds)
    : { data: [] as { analisis_id: string; tipo: string }[] };

  const { data: colaboradores } = await supabase
    .from('colaboradores')
    .select('id, nombre_completo')
    .eq('empresa_id', perfil.empresa_id)
    .eq('estado', 'activo')
    .order('nombre_completo');

  const conteoPorAnalisis = new Map<string, { debilidad: number; oportunidad: number; fortaleza: number; amenaza: number }>();
  for (const a of analisisRaw ?? []) conteoPorAnalisis.set(a.id, { debilidad: 0, oportunidad: 0, fortaleza: 0, amenaza: 0 });
  for (const item of itemsRaw ?? []) {
    const conteo = conteoPorAnalisis.get(item.analisis_id);
    if (conteo) conteo[item.tipo as 'debilidad' | 'oportunidad' | 'fortaleza' | 'amenaza']++;
  }

  const analisis = (analisisRaw ?? []).map((a) => ({ ...a, conteo: conteoPorAnalisis.get(a.id)! }));

  return (
    <div className="space-y-4">
      <div>
        <Link href="/procesos-gestion" className="inline-flex items-center gap-1 text-sm text-marmol-500 hover:text-flow-600 mb-2">
          <ChevronLeft size={14} /> Procesos y Sistemas de Gestión
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <Compass size={22} className="text-flow-600" /> Contexto (análisis FODA)
        </h1>
        <p className="text-sm text-marmol-500 mt-1 max-w-2xl">
          Debilidades, oportunidades, fortalezas y amenazas, de forma estructurada — no un archivo suelto. Cada
          debilidad u oportunidad puede convertirse directamente en una acción trazable en ACPM. Se recomienda
          repetir el análisis al menos una vez al año.
        </p>
      </div>

      <ListaAnalisisContexto analisisIniciales={analisis} colaboradores={(colaboradores ?? []) as { id: string; nombre_completo: string }[]} puedeEditar={perfil.rol === 'admin_th'} />
    </div>
  );
}
