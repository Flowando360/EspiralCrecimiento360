import Link from 'next/link';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { FiltroTabla } from '@/components/ui/filtro-tabla';
import { redirect } from 'next/navigation';
import { ESTADOS_VIGENTES } from '@/lib/colaboradores/estados';
import { SelectorLiderDirecto } from '@/components/espiral-crecimiento/selector-lider-directo';
import {
  EditorEquipoLider,
  SelectorLiderEquipo,
  type PersonaEquipo,
} from '@/components/espiral-crecimiento/editor-equipo-lider';
import { primero } from '@/lib/utils';
import { AlertTriangle, Network } from 'lucide-react';

export default async function AdminOrganigramaPage({ searchParams }: { searchParams?: { lider?: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/inicio');

  const supabase = createClient();
  const { data: filas } = await supabase
    .from('colaboradores')
    .select('id, nombre_completo, lider_id, estado, es_externo, cargo:cargos(nombre, tiene_personal_a_cargo)')
    .eq('empresa_id', perfil.empresa_id)
    .in('estado', ESTADOS_VIGENTES)
    .order('nombre_completo');

  const colaboradores = (filas ?? []).map((c: any) => {
    const cargo = primero(c.cargo) as { nombre: string; tiene_personal_a_cargo: boolean } | null;
    return {
      id: c.id as string,
      nombre_completo: c.nombre_completo as string,
      lider_id: (c.lider_id ?? null) as string | null,
      estado: c.estado as string,
      es_externo: Boolean(c.es_externo),
      cargo: cargo?.nombre ?? null,
      cargoLidera: Boolean(cargo?.tiene_personal_a_cargo),
    };
  });

  const nombrePor = new Map(colaboradores.map((c) => [c.id, c.nombre_completo]));
  const conEquipo = new Set(colaboradores.filter((c) => c.lider_id).map((c) => c.lider_id as string));

  // Vacíos para revisar con Talento Humano
  const lideresSinEquipo = colaboradores.filter((c) => c.cargoLidera && !conEquipo.has(c.id));
  const sinLider = colaboradores.filter((c) => !c.es_externo && !c.lider_id && !conEquipo.has(c.id));

  // Líder elegido para editar su equipo
  const liderElegido = colaboradores.find((c) => c.id === searchParams?.lider) ?? null;
  const jefes: string[] = [];
  if (liderElegido) {
    const liderDe = new Map(colaboradores.map((c) => [c.id, c.lider_id]));
    let actual = liderElegido.lider_id;
    while (actual && !jefes.includes(actual)) {
      jefes.push(actual);
      actual = liderDe.get(actual) ?? null;
    }
  }
  const personasParaEquipo: PersonaEquipo[] = colaboradores
    .filter((c) => !c.es_externo && c.id !== liderElegido?.id)
    .map((c) => ({
      id: c.id,
      nombre: c.nombre_completo,
      cargo: c.cargo,
      liderActualId: c.lider_id,
      liderActualNombre: c.lider_id ? nombrePor.get(c.lider_id) ?? null : null,
      enPrueba: c.estado === 'periodo_prueba',
    }));

  const opcionesLider = colaboradores
    .filter((c) => !c.es_externo)
    .map((c) => ({
      id: c.id,
      nombre: `${c.nombre_completo}${c.cargoLidera || conEquipo.has(c.id) ? ' · líder' : ''}`,
    }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Editar organigrama</h1>
        <p className="text-sm text-marmol-500 mt-1">
          El líder de cada persona es la única fuente de verdad: pares y colaboradores a cargo se deducen
          automáticamente. Puedes armarlo de dos maneras: <strong>por líder</strong> (eliges un líder y marcas su equipo) o{' '}
          <strong>por persona</strong> (eliges el líder de cada una). Los dos caminos escriben lo mismo. Cambiar el líder
          actualiza la arquitectura de acompañantes del próximo ciclo (o al volver a generar un ciclo abierto).
        </p>
        <p className="text-xs text-marmol-400 mt-1">
          Aparecen las personas activas y en período de prueba. Las personas nuevas entran al organigrama con el líder que
          elijas al crearlas en Colaboradores → Nuevo colaborador.
        </p>
      </div>

      {(lideresSinEquipo.length > 0 || sinLider.length > 0) && (
        <section className="card p-5 space-y-3 border-medio/30">
          <h2 className="font-display font-semibold text-secundario flex items-center gap-2">
            <AlertTriangle size={16} className="text-medio" /> Para revisar
          </h2>
          {lideresSinEquipo.length > 0 && (
            <div>
              <p className="text-sm text-marmol-700">
                Líderes (su cargo tiene personal a cargo) que todavía <strong>no tienen equipo asignado</strong>:
              </p>
              <ul className="flex flex-wrap gap-2 mt-2">
                {lideresSinEquipo.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/administracion/organigrama?lider=${c.id}#equipo`}
                      className="inline-block rounded-full border border-medio/40 bg-medio/10 text-xs text-marmol-800 px-3 py-1 hover:bg-medio/20"
                    >
                      {c.nombre_completo} → asignar equipo
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {sinLider.length > 0 && (
            <div>
              <p className="text-sm text-marmol-700">
                Personas <strong>sin líder</strong> y sin equipo (no salen en ningún equipo ni se les genera líder en las
                evaluaciones):
              </p>
              <ul className="flex flex-wrap gap-2 mt-2">
                {sinLider.map((c) => (
                  <li key={c.id} className="rounded-full border border-marmol-200 bg-white text-xs text-marmol-700 px-3 py-1">
                    {c.nombre_completo}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-marmol-400 mt-1">Asígnales líder en la tabla «Por persona» de más abajo.</p>
            </div>
          )}
        </section>
      )}

      <section id="equipo" className="space-y-3 scroll-mt-20">
        <h2 className="font-display text-lg font-semibold text-secundario flex items-center gap-2">
          <Network size={18} className="text-flow-600" /> Por líder: asignar su equipo
        </h2>
        <SelectorLiderEquipo lideres={opcionesLider} liderId={liderElegido?.id ?? ''} />
        {liderElegido ? (
          <EditorEquipoLider
            key={liderElegido.id}
            liderId={liderElegido.id}
            liderNombre={liderElegido.nombre_completo}
            personas={personasParaEquipo}
            bloqueados={jefes}
            equipoInicial={colaboradores.filter((c) => c.lider_id === liderElegido.id).map((c) => c.id)}
          />
        ) : (
          <p className="text-sm text-marmol-400">Elige un líder para ver y editar las personas que tiene a cargo.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-secundario">Por persona: elegir su líder directo</h2>
        <FiltroTabla columnas={['Cargo', 'Líder directo']} plural="personas" placeholder="Buscar persona…">
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                  <th className="px-4 py-3 font-medium">Colaborador</th>
                  <th className="px-4 py-3 font-medium">Cargo</th>
                  <th className="px-4 py-3 font-medium">Líder directo</th>
                </tr>
              </thead>
              <tbody>
                {colaboradores.map((c) => (
                  <tr key={c.id} className="border-b border-marmol-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-marmol-900">
                      {c.nombre_completo}
                      {c.estado === 'periodo_prueba' && (
                        <span className="ml-2 text-[11px] font-normal text-medio">período de prueba</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-marmol-600">{c.cargo}</td>
                    <td className="px-4 py-3">
                      <SelectorLiderDirecto
                        colaboradorId={c.id}
                        liderIdInicial={c.lider_id}
                        opciones={colaboradores
                          .filter((l) => l.id !== c.id)
                          .map((l) => ({ id: l.id, nombre_completo: l.nombre_completo }))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FiltroTabla>
      </section>
    </div>
  );
}
