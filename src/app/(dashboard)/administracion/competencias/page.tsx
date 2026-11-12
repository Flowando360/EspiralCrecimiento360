import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { SelectorNivelCompetencia } from '@/components/administracion/selector-nivel-competencia';
import { UmbralCriticoCompetencia } from '@/components/administracion/umbral-critico-competencia';
import { NIVELES_CARGO, type NivelCargo } from '@/lib/competencias/nivel-cargo';

const ETIQUETA_BLOQUE: Record<string, string> = {
  competencias_organizacionales: 'Competencias organizacionales (corporativas)',
  competencias_funcionales: 'Competencias funcionales del cargo',
  competencias_liderazgo: 'Competencias de liderazgo',
  cultura: 'Cultura',
};

export default async function CompetenciasPorNivelPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/inicio');

  const supabase = createClient();
  const { data } = await supabase
    .from('competencias')
    .select('id, nombre, bloque, descripcion_que_evalua, nivel_minimo, solo_con_personal_a_cargo, umbral_critico, umbral_justificacion')
    .eq('empresa_id', perfil.empresa_id)
    .eq('activo', true)
    .not('bloque', 'is', null)
    .order('orden');
  const competencias = (data ?? []) as any[];

  const bloques = Object.keys(ETIQUETA_BLOQUE)
    .map((b) => ({ bloque: b, titulo: ETIQUETA_BLOQUE[b]!, items: competencias.filter((c) => c.bloque === b) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Competencias por nivel de cargo</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Define desde qué nivel de cargo se evalúa cada competencia, para no pedirle «Liderazgo» a un cargo operativo. También puedes marcar un criterio como crítico con un mínimo: si la nota consolidada queda por debajo, el resultado lo advierte aunque el índice general sea alto.
          El nivel de cada cargo se elige al editarlo (Cargos y perfiles → Editar).
        </p>
      </div>

      <div className="card p-4 text-xs text-marmol-600 space-y-1">
        <p className="font-medium text-marmol-700">Los cuatro niveles</p>
        <ul className="space-y-0.5">
          {NIVELES_CARGO.map((n) => (
            <li key={n.value}>
              <strong>{n.label}:</strong> {n.ayuda}
            </li>
          ))}
        </ul>
        <p className="pt-1">
          «Todos los cargos» = competencia corporativa. «Desde supervisión» = solo cargos de supervisión o directivos. El cambio aplica a los
          Encuentros de Crecimiento que se generen de ahora en adelante; los ya generados no se modifican. Tampoco cambia lo que ya tenías excluido por cargo
          en «Ítems a evaluar».
        </p>
      </div>

      {bloques.map((g) => (
        <div key={g.bloque} className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-marmol-200">
            <h2 className="font-display font-semibold text-secundario text-sm">{g.titulo}</h2>
          </div>
          <ul className="divide-y divide-marmol-100">
            {g.items.map((c) => (
              <li key={c.id} className="px-4 py-3 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[14rem]">
                  <p className="text-sm font-medium text-marmol-800">{c.nombre}</p>
                  {c.descripcion_que_evalua && <p className="text-xs text-marmol-400">{c.descripcion_que_evalua}</p>}
                  {c.solo_con_personal_a_cargo && <p className="text-xs text-medio">Además exige que el cargo tenga personal a cargo.</p>}
                </div>
                <SelectorNivelCompetencia competenciaId={c.id} nivelInicial={(c.nivel_minimo ?? 'operativo') as NivelCargo} />
                <UmbralCriticoCompetencia competenciaId={c.id} umbralInicial={c.umbral_critico ?? null} justificacionInicial={c.umbral_justificacion ?? null} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
