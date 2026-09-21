import Link from 'next/link';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChevronLeft, ClipboardList, Plus } from 'lucide-react';
import { calcularDiagnosticoIso9001 } from '@/lib/calculos/diagnostico-iso9001';
import { formatearFecha } from '@/lib/utils';
import { BotonNuevoDiagnostico } from '@/components/procesos-gestion/boton-nuevo-diagnostico';

function colorPuntaje(puntaje: number | null): string {
  if (puntaje === null) return 'text-marmol-400';
  if (puntaje >= 80) return 'text-alto';
  if (puntaje >= 50) return 'text-medio';
  return 'text-bajo';
}

export default async function DiagnosticoIso9001Page() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!['admin_th', 'lider', 'gerencia'].includes(perfil.rol)) redirect('/inicio');

  const supabase = createClient();

  const [{ data: items }, { data: diagnosticos }] = await Promise.all([
    supabase.from('diagnostico_iso9001_items').select('id, clausula, numeral, titulo').order('orden'),
    supabase
      .from('diagnosticos_iso9001')
      .select('id, fecha, estado, realizado_por:colaboradores(nombre_completo)')
      .eq('empresa_id', perfil.empresa_id)
      .order('fecha', { ascending: false }),
  ]);

  const itemsCatalogo = (items ?? []) as { id: string; clausula: number; numeral: string; titulo: string }[];
  const diagnosticoIds = (diagnosticos ?? []).map((d) => d.id);

  const { data: respuestasRaw } = diagnosticoIds.length
    ? await supabase.from('diagnostico_iso9001_respuestas').select('diagnostico_id, item_id, nivel').in('diagnostico_id', diagnosticoIds)
    : { data: [] };

  const respuestasPorDiagnostico = new Map<string, { item_id: string; nivel: any }[]>();
  for (const r of (respuestasRaw ?? []) as any[]) {
    const lista = respuestasPorDiagnostico.get(r.diagnostico_id) ?? [];
    lista.push(r);
    respuestasPorDiagnostico.set(r.diagnostico_id, lista);
  }

  return (
    <div className="space-y-4">
      <div>
        <Link href="/procesos-gestion" className="inline-flex items-center gap-1 text-sm text-marmol-500 hover:text-flow-600 mb-2">
          <ChevronLeft size={14} /> Procesos y Sistemas de Gestión
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
              <ClipboardList size={22} className="text-flow-600" /> Diagnóstico ISO 9001:2015
            </h1>
            <p className="text-sm text-marmol-500 mt-1 max-w-2xl">
              Autoevaluación frente a los 28 numerales auditables de la norma (cláusulas 4 a 10), con la misma escala del
              checklist de cumplimiento. Puedes repetirla en el tiempo para comparar el avance.
            </p>
          </div>
          {perfil.rol === 'admin_th' && <BotonNuevoDiagnostico />}
        </div>
      </div>

      {!diagnosticos || diagnosticos.length === 0 ? (
        <div className="card p-6 text-sm text-marmol-500">
          Todavía no se ha corrido ningún diagnóstico.
          {perfil.rol === 'admin_th' && ' Crea el primero con el botón "Nuevo diagnóstico".'}
        </div>
      ) : (
        <div className="grid gap-3">
          {diagnosticos.map((d: any) => {
            const resultado = calcularDiagnosticoIso9001(itemsCatalogo, respuestasPorDiagnostico.get(d.id) ?? []);
            return (
              <Link key={d.id} href={`/procesos-gestion/diagnostico-iso9001/${d.id}`} className="card p-4 flex items-center justify-between hover:border-flow-300 transition">
                <div>
                  <p className="font-medium text-marmol-800">
                    Diagnóstico del {formatearFecha(d.fecha)}
                    {d.estado === 'completado' && <span className="ml-2 text-xs font-medium badge-alto rounded-full px-2 py-0.5">Completado</span>}
                    {d.estado === 'en_progreso' && <span className="ml-2 text-xs font-medium badge-medio rounded-full px-2 py-0.5">En progreso</span>}
                  </p>
                  <p className="text-xs text-marmol-400 mt-0.5">
                    {d.realizado_por?.nombre_completo ? `Realizado por ${d.realizado_por.nombre_completo} · ` : ''}
                    {resultado.itemsRespondidos} de {resultado.itemsTotal} numerales respondidos
                  </p>
                </div>
                <p className={`font-display text-2xl font-semibold ${colorPuntaje(resultado.puntajeGeneral)}`}>
                  {resultado.puntajeGeneral !== null ? `${resultado.puntajeGeneral}%` : '—'}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
