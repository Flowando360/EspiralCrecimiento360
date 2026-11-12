import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Compass } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { ESTADOS_VIGENTES } from '@/lib/colaboradores/estados';
import { calcularMatch, nivelDesdeEsperado, rangoNivel, type EvidenciaPersona, type RequisitoCargo } from '@/lib/movilidad/match';
import { SemaforoBadge } from '@/components/espiral-crecimiento/semaforo-badge';
import { primero } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const ETIQUETA_FORMACION: Record<string, string> = {
  bachillerato: 'Bachillerato',
  tecnico: 'Técnico',
  tecnologo: 'Tecnólogo',
  universitario: 'Universitario',
};
const UMBRAL_AFINIDAD = 75;

export default async function MovilidadInternaPage({ searchParams }: { searchParams: { cargo?: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/inicio');
  const supabase = createClient();

  const [{ data: colaboradoresRaw }, { data: cargosRaw }, { data: habilidadesRaw }, { data: verifRaw }, { data: hojaRaw }, { data: resultadosRaw }, { data: vacantesRaw }] = await Promise.all([
    supabase
      .from('colaboradores')
      .select('id, nombre_completo, cargo_id, cargo:cargos(nombre, nivel_cargo)')
      .eq('empresa_id', perfil.empresa_id)
      .in('estado', ESTADOS_VIGENTES)
      .eq('es_externo', false),
    supabase.from('cargos').select('id, nombre, nivel_cargo, formacion_nivel, formacion_titulo_especifico, experiencia_minima_meses').eq('empresa_id', perfil.empresa_id).eq('activo', true).order('nombre'),
    supabase.from('cargo_habilidades').select('cargo_id, nombre, nivel_esperado'),
    supabase.from('verificaciones_saber').select('colaborador_id, item_evaluado, estado, nivel_dominio'),
    supabase.from('hoja_vida_formacion').select('colaborador_id, tipo, titulo, institucion, verificado, fecha_inicio, fecha_fin, fecha_vencimiento'),
    supabase
      .from('resultados_evaluacion')
      .select('semaforo_hacer, semaforo_deber, actualizado_en, evaluacion:evaluaciones!inner(colaborador_evaluado_id)')
      .order('actualizado_en', { ascending: false }),
    supabase.from('vacantes').select('cargo_id').eq('empresa_id', perfil.empresa_id).eq('estado', 'abierta'),
  ]);

  const colaboradores = (colaboradoresRaw ?? []) as any[];
  const cargos = (cargosRaw ?? []) as any[];
  const conVacante = new Set(((vacantesRaw ?? []) as any[]).map((v) => v.cargo_id));

  // Requisitos de cada cargo
  const habsPorCargo = new Map<string, any[]>();
  for (const h of (habilidadesRaw ?? []) as any[]) {
    if (!habsPorCargo.has(h.cargo_id)) habsPorCargo.set(h.cargo_id, []);
    habsPorCargo.get(h.cargo_id)!.push(h);
  }
  const requisitosDe = (c: any): RequisitoCargo[] => {
    const r: RequisitoCargo[] = (habsPorCargo.get(c.id) ?? []).map((h) => ({ tipo: 'habilidad', nombre: h.nombre, nivelRequerido: nivelDesdeEsperado(h.nivel_esperado) }));
    if (c.formacion_nivel && ETIQUETA_FORMACION[c.formacion_nivel]) {
      r.push({ tipo: 'formacion', nombre: c.formacion_titulo_especifico || ETIQUETA_FORMACION[c.formacion_nivel] });
    }
    if (c.experiencia_minima_meses) r.push({ tipo: 'experiencia', nombre: `Experiencia mínima: ${c.experiencia_minima_meses} meses`, meses: c.experiencia_minima_meses });
    return r;
  };
  const requisitosPorCargo = new Map(cargos.map((c) => [c.id, requisitosDe(c)]));

  // Evidencia y desempeño por persona
  const evidencia = new Map<string, EvidenciaPersona>();
  const ev = (id: string) => {
    if (!evidencia.has(id)) evidencia.set(id, { verificaciones: [], hoja: [] });
    return evidencia.get(id)!;
  };
  for (const v of (verifRaw ?? []) as any[]) ev(v.colaborador_id).verificaciones.push(v);
  for (const h of (hojaRaw ?? []) as any[]) ev(h.colaborador_id).hoja.push(h);

  const desempeno = new Map<string, { hacer: string | null; deber: string | null }>();
  for (const r of (resultadosRaw ?? []) as any[]) {
    const id = primero(r.evaluacion as any)?.colaborador_evaluado_id;
    if (id && !desempeno.has(id)) desempeno.set(id, { hacer: r.semaforo_hacer, deber: r.semaforo_deber });
  }

  const sinEvidencia: EvidenciaPersona = { verificaciones: [], hoja: [] };
  const matchPersonaCargo = (colabId: string, cargoId: string) => calcularMatch(requisitosPorCargo.get(cargoId) ?? [], evidencia.get(colabId) ?? sinEvidencia);

  // A. Potencial subutilizado: buen desempeño + afinidad alta con otro cargo de igual o mayor nivel
  const potencial = colaboradores
    .map((c) => {
      const d = desempeno.get(c.id);
      const cargoActual = primero(c.cargo as any) as any;
      if (!d || d.hacer !== 'alto' || !(d.deber === 'alto' || d.deber === 'medio')) return null;
      const opciones = cargos
        .filter((x) => x.id !== c.cargo_id && rangoNivel(x.nivel_cargo) >= rangoNivel(cargoActual?.nivel_cargo) && (requisitosPorCargo.get(x.id)?.length ?? 0) > 0)
        .map((x) => ({ cargo: x, match: matchPersonaCargo(c.id, x.id) }))
        .filter((o) => (o.match.porcentaje ?? 0) >= UMBRAL_AFINIDAD)
        .sort((a, b) => (b.match.porcentaje ?? 0) - (a.match.porcentaje ?? 0))
        .slice(0, 2);
      return opciones.length ? { colaborador: c, cargoActual, d, opciones } : null;
    })
    .filter(Boolean) as { colaborador: any; cargoActual: any; d: { hacer: string | null; deber: string | null }; opciones: { cargo: any; match: ReturnType<typeof calcularMatch> }[] }[];

  // B. Candidatos internos para un cargo elegido
  const cargoElegido = cargos.find((c) => c.id === searchParams.cargo) ?? null;
  const candidatos = cargoElegido
    ? colaboradores
        .filter((c) => c.cargo_id !== cargoElegido.id)
        .map((c) => ({ colaborador: c, cargoActual: primero(c.cargo as any) as any, match: matchPersonaCargo(c.id, cargoElegido.id), d: desempeno.get(c.id) ?? null }))
        .filter((x) => x.match.porcentaje != null)
        .sort((a, b) => (b.match.porcentaje ?? 0) - (a.match.porcentaje ?? 0))
        .slice(0, 10)
    : [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <Compass size={22} className="text-flow-500" /> Movilidad interna y potencial
        </h1>
        <p className="text-sm text-marmol-500 mt-1 max-w-2xl">
          Cruza lo que cada persona ya acredita (verificaciones de Saber y hoja de vida) con lo que exigen los cargos, para descubrir talento que podría aportar más y tener candidatos internos antes de abrir una vacante.
        </p>
        <p className="text-xs text-marmol-400 mt-2 max-w-2xl">
          Es una ayuda para conversar, no una decisión: compara textos de la hoja de vida y de los requisitos del cargo, así que puede equivocarse; mira siempre el detalle. No usa el Ser. Mientras más completas estén las hojas de vida, las verificaciones de Saber y los requisitos de los cargos, mejor funciona.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-secundario">Candidatos internos para un cargo</h2>
        <form method="get" className="flex flex-wrap items-center gap-2">
          <select name="cargo" defaultValue={cargoElegido?.id ?? ''} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm min-w-[16rem]">
            <option value="">Elige un cargo…</option>
            {cargos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
                {conVacante.has(c.id) ? ' · vacante abierta' : ''}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary text-xs">Ver candidatos</button>
        </form>

        {cargoElegido && (requisitosPorCargo.get(cargoElegido.id)?.length ?? 0) === 0 && (
          <p className="text-sm text-marmol-500">Este cargo no tiene habilidades, formación ni experiencia definidas, así que no hay con qué comparar. Complétalo en Administración → Cargos.</p>
        )}
        {cargoElegido && candidatos.length > 0 && (
          <div className="space-y-2">
            {candidatos.map((x) => (
              <details key={x.colaborador.id} className="card p-4">
                <summary className="cursor-pointer flex items-center justify-between gap-3 flex-wrap">
                  <span>
                    <Link href={`/espiral-crecimiento/colaboradores/${x.colaborador.id}`} className="font-medium text-marmol-900 hover:text-flow-600">{x.colaborador.nombre_completo}</Link>
                    <span className="text-xs text-marmol-500"> · {x.cargoActual?.nombre ?? 'Sin cargo'}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {x.d && <SemaforoBadge nivel={x.d.hacer as any} />}
                    <span className="font-display text-lg font-semibold text-secundario">{x.match.porcentaje} %</span>
                  </span>
                </summary>
                <ul className="mt-3 space-y-1 text-xs text-marmol-600">
                  {x.match.detalle.map((d, i) => (
                    <li key={i}>
                      <span className={d.cobertura === 1 ? 'text-alto' : d.cobertura === 0.5 ? 'text-medio' : 'text-bajo'}>{d.cobertura === 1 ? '✓' : d.cobertura === 0.5 ? '≈' : '✗'}</span> {d.requisito.nombre} — {d.motivo}
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        )}
        {cargoElegido && (requisitosPorCargo.get(cargoElegido.id)?.length ?? 0) > 0 && candidatos.length === 0 && (
          <p className="text-sm text-marmol-500">No hay otras personas con las que comparar.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-secundario">Potencial subutilizado</h2>
        <p className="text-xs text-marmol-400 max-w-2xl">
          Personas con desempeño destacado (Hacer alto y Deber alto o medio en su última evaluación) que además cubren al menos el {UMBRAL_AFINIDAD} % de los requisitos de otro cargo de su mismo nivel o superior.
        </p>
        {potencial.length === 0 ? (
          <p className="text-sm text-marmol-500">Por ahora no hay personas que cumplan estos criterios. Se llena a medida que haya evaluaciones, verificaciones de Saber y hojas de vida completas.</p>
        ) : (
          <div className="space-y-2">
            {potencial.map((p) => (
              <div key={p.colaborador.id} className="card p-4 space-y-2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p>
                    <Link href={`/espiral-crecimiento/colaboradores/${p.colaborador.id}`} className="font-medium text-marmol-900 hover:text-flow-600">{p.colaborador.nombre_completo}</Link>
                    <span className="text-xs text-marmol-500"> · {p.cargoActual?.nombre ?? 'Sin cargo'}</span>
                  </p>
                  <span className="flex items-center gap-1.5 text-xs text-marmol-500">Hacer <SemaforoBadge nivel={p.d.hacer as any} /> Deber <SemaforoBadge nivel={p.d.deber as any} /></span>
                </div>
                <ul className="text-sm text-marmol-700 space-y-0.5">
                  {p.opciones.map((o) => (
                    <li key={o.cargo.id}>
                      Cargo a explorar: <Link href={`/espiral-crecimiento/movilidad?cargo=${o.cargo.id}`} className="text-flow-600 hover:text-flow-700">{o.cargo.nombre}</Link> — {o.match.porcentaje} % de afinidad
                      {conVacante.has(o.cargo.id) ? ' (hay vacante abierta)' : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
