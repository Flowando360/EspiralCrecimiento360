import Link from 'next/link';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChevronLeft, ShieldAlert } from 'lucide-react';
import { ListaRiesgos } from '@/components/procesos-gestion/lista-riesgos';
import { ESCALA_RIESGOS_DEFECTO, type EscalaRiesgosConfig } from '@/lib/calculos/matriz-riesgos';

export default async function RiesgosPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!['admin_th', 'lider', 'gerencia'].includes(perfil.rol)) redirect('/inicio');

  const supabase = createClient();

  const [{ data: riesgos }, { data: procesos }, { data: empresa }] = await Promise.all([
    supabase
      .from('matriz_riesgos_controles')
      .select('id, marco_normativo, tipo, riesgo, consecuencia, categoria, grado_impacto, grado_probabilidad, control, grado_efectividad_control, acciones_a_realizar, proceso_id, frecuencia_revision, fecha_ultima_revision')
      .eq('empresa_id', perfil.empresa_id)
      .order('created_at', { ascending: false }),
    supabase.from('procesos_gestion').select('id, nombre, codigo').eq('empresa_id', perfil.empresa_id).order('codigo'),
    supabase.from('empresas').select('riesgos_escala').eq('id', perfil.empresa_id).maybeSingle(),
  ]);

  const escala = (empresa?.riesgos_escala as EscalaRiesgosConfig | null) ?? ESCALA_RIESGOS_DEFECTO;

  const riesgoIds = (riesgos ?? []).map((r) => r.id);
  const { data: acpmRaw } = riesgoIds.length
    ? await supabase.from('acpm').select('id, origen_riesgo_id').in('origen_riesgo_id', riesgoIds)
    : { data: [] as { id: string; origen_riesgo_id: string | null }[] };

  const conteoAcpmPorRiesgo: Record<string, number> = {};
  for (const a of acpmRaw ?? []) {
    if (!a.origen_riesgo_id) continue;
    conteoAcpmPorRiesgo[a.origen_riesgo_id] = (conteoAcpmPorRiesgo[a.origen_riesgo_id] ?? 0) + 1;
  }

  return (
    <div className="space-y-4">
      <div>
        <Link href="/procesos-gestion" className="inline-flex items-center gap-1 text-sm text-marmol-500 hover:text-flow-600 mb-2">
          <ChevronLeft size={14} /> Procesos y Sistemas de Gestión
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <ShieldAlert size={22} className="text-flow-600" /> Riesgos y oportunidades
        </h1>
        <p className="text-sm text-marmol-500 mt-1 max-w-2xl">
          Metodología cuantitativa: causa → riesgo → consecuencia, calificado por impacto × probabilidad, con el
          nivel residual recalculado según la efectividad del control. Cada riesgo puede generar directamente una
          acción trazable en ACPM.
        </p>
      </div>

      <ListaRiesgos
        riesgosIniciales={(riesgos ?? []) as any}
        procesos={(procesos ?? []) as any}
        conteoAcpmPorRiesgo={conteoAcpmPorRiesgo}
        puedeEditar={perfil.rol === 'admin_th'}
        escala={escala}
      />
    </div>
  );
}
