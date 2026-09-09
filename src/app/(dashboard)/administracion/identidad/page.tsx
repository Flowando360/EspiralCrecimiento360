import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { guardarIdentidadForm } from './actions';
import { ListaElementosIdentidad } from '@/components/espiral-crecimiento/lista-elementos-identidad';

export default async function IdentidadOrganizacionalPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/inicio');

  const supabase = createClient();

  const [{ data: identidad }, { data: elementos }] = await Promise.all([
    supabase.from('empresa_identidad').select('*').eq('empresa_id', perfil.empresa_id).maybeSingle(),
    supabase.from('empresa_identidad_elementos').select('*').eq('empresa_id', perfil.empresa_id).order('orden'),
  ]);

  const principios = (elementos ?? []).filter((e) => e.tipo === 'principio');
  const valores = (elementos ?? []).filter((e) => e.tipo === 'valor');

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Identidad Organizacional</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Propósito superior, visión, principios y valores — visibles para toda la empresa, y
          usados como referencia en los Encuentros de Crecimiento y en el feed de Nexa.
        </p>
      </div>

      <form action={guardarIdentidadForm} className="card p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-marmol-700 mb-1">
            Propósito Superior (Misión)
          </label>
          <textarea
            name="proposito_superior"
            defaultValue={identidad?.proposito_superior ?? ''}
            rows={3}
            className="w-full rounded-lg border border-marmol-200 px-3 py-2 text-sm"
            placeholder="¿Para qué existe la empresa?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-marmol-700 mb-1">
            Declaración de aquello en lo que creemos
          </label>
          <textarea
            name="declaracion_creencias"
            defaultValue={identidad?.declaracion_creencias ?? ''}
            rows={3}
            className="w-full rounded-lg border border-marmol-200 px-3 py-2 text-sm"
            placeholder="Aquello en lo que la organización cree profundamente…"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-marmol-700 mb-1">Visión</label>
          <textarea
            name="vision"
            defaultValue={identidad?.vision ?? ''}
            rows={3}
            className="w-full rounded-lg border border-marmol-200 px-3 py-2 text-sm"
            placeholder="¿Hacia dónde va la empresa?"
          />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-4 py-2 transition"
        >
          Guardar
        </button>
      </form>

      <div className="grid md:grid-cols-2 gap-4">
        <ListaElementosIdentidad tipo="principio" titulo="Principios" elementosIniciales={principios as any} />
        <ListaElementosIdentidad tipo="valor" titulo="Valores" elementosIniciales={valores as any} />
      </div>
    </div>
  );
}
