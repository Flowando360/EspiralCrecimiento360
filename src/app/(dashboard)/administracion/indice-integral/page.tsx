import { redirect } from 'next/navigation';
import { BarChart3 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { puedeAdministrar } from '@/lib/permisos/administracion';
import { EditorPesosDimensiones, type FilaPesos } from '@/components/administracion/editor-pesos-dimensiones';
import { NIVELES_CARGO } from '@/lib/competencias/nivel-cargo';
import { PESOS_POR_DEFECTO } from '@/lib/desempeno/indice-integral';

export default async function IndiceIntegralPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!puedeAdministrar(perfil)) redirect('/inicio');

  const supabase = createClient();
  const { data } = await supabase.from('ponderacion_dimensiones_nivel').select('nivel_cargo, peso_saber, peso_hacer, peso_deber').eq('empresa_id', perfil.empresa_id);
  const propios = new Map(((data ?? []) as any[]).map((r) => [r.nivel_cargo as string, r]));

  const filas: FilaPesos[] = NIVELES_CARGO.map((n) => {
    const p = propios.get(n.value);
    return {
      nivel: n.value,
      etiqueta: n.label,
      ayuda: n.ayuda,
      saber: p ? Number(p.peso_saber) : PESOS_POR_DEFECTO.saber,
      hacer: p ? Number(p.peso_hacer) : PESOS_POR_DEFECTO.hacer,
      deber: p ? Number(p.peso_deber) : PESOS_POR_DEFECTO.deber,
      personalizado: Boolean(p),
    };
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <BarChart3 size={22} className="text-flow-600" /> Índice integral: pesos por nivel de cargo
        </h1>
        <p className="text-sm text-marmol-500 mt-1">
          El índice de desempeño integral sintetiza Saber, Hacer y Deber en una sola lectura, sin esconder el resultado de cada dimensión. No todos los cargos pesan igual en cada
          dimensión: define aquí los pesos por nivel de cargo. El Ser no entra en el índice: se lee en paralelo.
        </p>
      </div>

      <div className="card p-4 text-xs text-marmol-600 space-y-1">
        <p>
          <strong>Cómo se calcula:</strong> índice = Saber × peso + Hacer × peso + Deber × peso. Los tres pesos deben sumar 100 %. Si a una persona le falta una dimensión (por ejemplo aún no tiene Saber verificado),
          el índice se calcula con las otras reescalando sus pesos y se marca como incompleto; nunca se trata la falta de dato como cero.
        </p>
        <p>
          Hacer y Deber ya vienen en escala de 1 a 5. El Saber se mide como porcentaje de cumplimiento del perfil del cargo y se lleva a esa escala de forma lineal (0 % = 1, 100 % = 5).
          Los pesos de partida (25 / 40 / 35) son el ejemplo del modelo: ajústalos antes de usar el índice para decisiones, idealmente tras un ciclo piloto.
        </p>
        <p>
          El nivel de cada cargo se define al editarlo (Cargos y perfiles). Los mínimos críticos por competencia se definen en Competencias por nivel.
        </p>
      </div>

      <EditorPesosDimensiones filas={filas} />
    </div>
  );
}
