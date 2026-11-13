import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/empty-state';
import { FormularioClima } from '@/components/espiral-crecimiento/formulario-clima';
import { AdminRondaClima } from '@/components/espiral-crecimiento/admin-ronda-clima';
import { formatearFecha } from '@/lib/utils';
import { HeartHandshake, MessageSquareText } from 'lucide-react';
import Link from 'next/link';
import { claveArea, crearNormalizadorAreas } from '@/lib/areas';
import { DIMENSIONES_CLIMA, alfaCronbach, interpretarAlfa, resumirClima, umbralClima, type RespuestaClima } from '@/lib/clima/segmentos';

export default async function ClimaPage({ searchParams }: { searchParams?: { ronda?: string; por?: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();
  const esAdminTh = perfil.rol === 'admin_th';
  const esGerencia = perfil.rol === 'gerencia';
  const esLider = perfil.rol === 'lider';

  const [{ data: rondaAbierta }, { data: empresa }] = await Promise.all([
    supabase
      .from('clima_rondas')
      .select('id, nombre, estado, fecha_apertura')
      .eq('empresa_id', perfil.empresa_id)
      .eq('estado', 'abierta')
      .maybeSingle(),
    supabase
      .from('empresas')
      .select(
        'clima_pregunta_enps, clima_pregunta_reconocimiento, clima_pregunta_liderazgo, clima_pregunta_desarrollo, clima_pregunta_comunicacion, clima_pregunta_condiciones, clima_pregunta_pertenencia'
      )
      .eq('id', perfil.empresa_id)
      .maybeSingle(),
  ]);

  let yaRespondio = false;
  if (rondaAbierta && perfil.colaborador_id) {
    const { data: participacion } = await supabase
      .from('clima_participaciones')
      .select('id')
      .eq('ronda_id', rondaAbierta.id)
      .eq('colaborador_id', perfil.colaborador_id)
      .maybeSingle();
    yaRespondio = !!participacion;
  }

  const resumenEmpresa =
    esAdminTh || esGerencia
      ? (
          await supabase
            .from('v_clima_ronda_resumen')
            .select('*')
            .order('fecha_apertura', { ascending: false })
        ).data
      : null;

  // ── Detalle por dimensión y por segmento (área, líder o sede) para TH y gerencia ──
  const rondaDetalleId = searchParams?.ronda ?? ((resumenEmpresa?.[0] as any)?.ronda_id as string | undefined);
  const por = searchParams?.por === 'lider' || searchParams?.por === 'sede' ? searchParams.por : 'area';
  let detalle: {
    general: ReturnType<typeof resumirClima>;
    confiabilidad: ReturnType<typeof alfaCronbach>;
    filas: { nombre: string; resumen: ReturnType<typeof resumirClima> }[];
  } | null = null;
  if ((esAdminTh || esGerencia) && rondaDetalleId) {
    const [{ data: resps }, { data: cfg }, { data: personas }, { data: sedes }] = await Promise.all([
      supabase.from('clima_respuestas').select('*').eq('ronda_id', rondaDetalleId),
      supabase.from('empresas').select('clima_umbral_tipo, clima_umbral_cantidad, clima_umbral_porcentaje').eq('id', perfil.empresa_id).maybeSingle(),
      supabase
        .from('colaboradores')
        .select('id, nombre_completo, lider_id, sede_id, cargo:cargo_id(proceso_area)')
        .eq('empresa_id', perfil.empresa_id)
        .eq('es_externo', false)
        .eq('estado', 'activo'),
      supabase.from('sedes').select('id, nombre').eq('empresa_id', perfil.empresa_id),
    ]);
    const umbralCfg = { tipo: cfg?.clima_umbral_tipo, cantidad: cfg?.clima_umbral_cantidad, porcentaje: cfg?.clima_umbral_porcentaje };
    const filasP = (personas ?? []) as any[];
    const cargoArea = (p: any) => (Array.isArray(p.cargo) ? p.cargo[0]?.proceso_area : p.cargo?.proceso_area) ?? null;
    const normalizar = crearNormalizadorAreas([...filasP.map(cargoArea), ...((resps ?? []) as any[]).map((r) => r.area)]);
    const todas = (resps ?? []) as unknown as RespuestaClima[];
    const grupos = new Map<string, { nombre: string; resps: RespuestaClima[]; poblacion: number }>();
    const asegurar = (k: string, nombre: string) => {
      if (!grupos.has(k)) grupos.set(k, { nombre, resps: [], poblacion: 0 });
      return grupos.get(k)!;
    };
    const nombreSede = new Map(((sedes ?? []) as any[]).map((x) => [x.id as string, x.nombre as string]));
    const nombrePersona = new Map(filasP.map((p) => [p.id as string, p.nombre_completo as string]));
    for (const p of filasP) {
      if (por === 'area') {
        const a = normalizar(cargoArea(p));
        asegurar(a ? claveArea(a) : '_', a ?? 'Sin área').poblacion++;
      } else if (por === 'sede') {
        asegurar(p.sede_id ?? '_', p.sede_id ? nombreSede.get(p.sede_id) ?? 'Sede' : 'Sin sede').poblacion++;
      } else if (p.lider_id) {
        asegurar(p.lider_id, `Equipo de ${nombrePersona.get(p.lider_id) ?? 'líder'}`).poblacion++;
      }
    }
    for (const r of todas) {
      if (por === 'area') {
        const a = normalizar(r.area);
        asegurar(a ? claveArea(a) : '_', a ?? 'Sin área').resps.push(r);
      } else if (por === 'sede') {
        asegurar(r.sede_id ?? '_', r.sede_id ? nombreSede.get(r.sede_id) ?? 'Sede' : 'Sin sede').resps.push(r);
      } else if (r.equipo_lider_id) {
        asegurar(r.equipo_lider_id, `Equipo de ${nombrePersona.get(r.equipo_lider_id) ?? 'líder'}`).resps.push(r);
      }
    }
    detalle = {
      general: resumirClima(todas, umbralClima(umbralCfg, filasP.length)),
      // Solo se muestra si hay suficientes respuestas completas (mismo mínimo de anonimato).
      confiabilidad: todas.length >= umbralClima(umbralCfg, filasP.length) ? alfaCronbach(todas) : null,
      filas: Array.from(grupos.values())
        .filter((g) => g.resps.length > 0)
        .map((g) => ({ nombre: g.nombre, resumen: resumirClima(g.resps, umbralClima(umbralCfg, g.poblacion)) }))
        .sort((x, y) => x.nombre.localeCompare(y.nombre, 'es')),
    };
  }

  let resumenEquipo:
    | { ronda_id: string; num_respuestas: number; enps: number | null; indice_clima_general: number | null; umbral_respuestas: number; ronda_nombre: string; ronda_fecha: string }[]
    | null = null;
  if (esLider && perfil.colaborador_id) {
    const { data: filas } = await supabase
      .from('v_clima_equipo_resumen')
      .select('*')
      .eq('lider_id', perfil.colaborador_id);
    const { data: rondas } = await supabase
      .from('clima_rondas')
      .select('id, nombre, fecha_apertura')
      .eq('empresa_id', perfil.empresa_id);
    const rondasPorId = new Map((rondas ?? []).map((r: any) => [r.id, r]));
    resumenEquipo = (filas ?? [])
      .map((f: any) => ({
        ronda_id: f.ronda_id,
        num_respuestas: f.num_respuestas,
        enps: f.enps,
        indice_clima_general: f.indice_clima_general,
        umbral_respuestas: f.umbral_respuestas,
        ronda_nombre: rondasPorId.get(f.ronda_id)?.nombre ?? '—',
        ronda_fecha: rondasPorId.get(f.ronda_id)?.fecha_apertura ?? null,
      }))
      .sort((a, b) => (a.ronda_fecha < b.ronda_fecha ? 1 : -1));
  }

  let comentarios: string[] = [];
  if (esAdminTh) {
    const rondaParaComentarios = rondaAbierta ?? (resumenEmpresa?.[0] ?? null);
    if (rondaParaComentarios) {
      const { data } = await supabase
        .from('clima_respuestas')
        .select('comentario')
        .eq('ronda_id', (rondaParaComentarios as any).id ?? (rondaParaComentarios as any).ronda_id)
        .not('comentario', 'is', null);
      comentarios = (data ?? []).map((r: any) => r.comentario).filter(Boolean);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Clima Organizacional</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Mediciones periódicas de eNPS y compromiso, por rondas. Las respuestas son anónimas.
        </p>
      </div>

      {esAdminTh && (
        <AdminRondaClima rondaAbierta={rondaAbierta ? { id: rondaAbierta.id, nombre: rondaAbierta.nombre } : null} />
      )}

      {perfil.colaborador_id && (
        <div>
          <h2 className="font-display text-lg font-semibold text-secundario mb-3">Tu opinión</h2>
          {!rondaAbierta ? (
            <EmptyState
              icon={HeartHandshake}
              titulo="No hay una ronda de clima abierta en este momento"
              descripcion="Cuando Talento Humano abra una nueva medición, podrás responderla aquí."
            />
          ) : yaRespondio ? (
            <div className="card p-5">
              <p className="text-sm font-medium text-marmol-800">Ya respondiste esta ronda. ¡Gracias! 🙌</p>
            </div>
          ) : (
            <FormularioClima
              rondaId={rondaAbierta.id}
              preguntas={{
                enps: empresa?.clima_pregunta_enps,
                reconocimiento: empresa?.clima_pregunta_reconocimiento,
                liderazgo: empresa?.clima_pregunta_liderazgo,
                desarrollo: empresa?.clima_pregunta_desarrollo,
                comunicacion: empresa?.clima_pregunta_comunicacion,
                condiciones: empresa?.clima_pregunta_condiciones,
                pertenencia: empresa?.clima_pregunta_pertenencia,
              }}
            />
          )}
        </div>
      )}

      {(esAdminTh || esGerencia) && (
        <div>
          <h2 className="font-display text-lg font-semibold text-secundario mb-3">Resultados por ronda</h2>
          {!resumenEmpresa || resumenEmpresa.length === 0 ? (
            <EmptyState icon={HeartHandshake} titulo="Aún no hay rondas de clima registradas" />
          ) : (
            <div className="card overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                    <th className="px-4 py-3 font-medium">Ronda</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Respuestas</th>
                    <th className="px-4 py-3 font-medium">eNPS</th>
                    <th className="px-4 py-3 font-medium">Índice de clima</th>
                  </tr>
                </thead>
                <tbody>
                  {resumenEmpresa.map((r: any) => (
                    <tr key={r.ronda_id} className="border-b border-marmol-100 last:border-0">
                      <td className="px-4 py-3 text-marmol-800">
                        {r.nombre}
                        <span className="block text-xs text-marmol-400">{formatearFecha(r.fecha_apertura)}</span>
                      </td>
                      <td className="px-4 py-3 text-marmol-600 capitalize">{r.estado}</td>
                      <td className="px-4 py-3 text-marmol-600">{r.num_respuestas}</td>
                      <td className="px-4 py-3 text-marmol-600">{r.enps ?? `— (menos de ${r.umbral_respuestas} respuestas)`}</td>
                      <td className="px-4 py-3 text-marmol-600">{r.indice_clima_general ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {detalle && (
        <div>
          <h2 className="font-display text-lg font-semibold text-secundario mb-1">Detalle por dimensión</h2>
          <p className="text-xs text-marmol-400 mb-3">
            Escala 1 a 5. Un grupo solo muestra números si tiene al menos el mínimo de respuestas definido en Configuración
            (así nadie queda identificado). Relaciones entre pares, compensación y equidad aparecen en las rondas que se
            abran desde ahora.
          </p>
          {detalle.confiabilidad && (
            <p className="text-xs text-marmol-600 bg-marmol-50 border border-marmol-200 rounded-lg px-3 py-2 mb-3">
              <strong>Confiabilidad del instrumento (alfa de Cronbach): {detalle.confiabilidad.alfa}</strong> — {interpretarAlfa(detalle.confiabilidad.alfa)}, calculada con{' '}
              {detalle.confiabilidad.personas} personas que respondieron las {detalle.confiabilidad.items} afirmaciones. Con 0,7 o más se considera aceptable. Cada dimensión
              se mide hoy con una sola afirmación, así que las comparaciones finas entre dimensiones o grupos pequeños son orientativas; con pocas respuestas el alfa
              es inestable. Una ronda con menos de 30 personas debe leerse con cautela.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
            <span className="text-marmol-500">Ronda:</span>
            {((resumenEmpresa ?? []) as any[]).map((r) => (
              <Link
                key={r.ronda_id}
                href={`/nexa/clima?ronda=${r.ronda_id}&por=${por}`}
                className={`rounded-full border px-3 py-1 ${r.ronda_id === rondaDetalleId ? 'bg-flow-500 border-flow-500 text-white' : 'border-marmol-200 text-marmol-600'}`}
              >
                {r.nombre}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
            <span className="text-marmol-500">Ver por:</span>
            {([['area', 'Área'], ['lider', 'Líder'], ['sede', 'Sede']] as const).map(([k, l]) => (
              <Link
                key={k}
                href={`/nexa/clima?ronda=${rondaDetalleId}&por=${k}`}
                className={`rounded-full border px-3 py-1 ${por === k ? 'bg-flow-500 border-flow-500 text-white' : 'border-marmol-200 text-marmol-600'}`}
              >
                {l}
              </Link>
            ))}
          </div>
          <div className="card overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                  <th className="px-3 py-3 font-medium">Grupo</th>
                  <th className="px-3 py-3 font-medium">Resp.</th>
                  <th className="px-3 py-3 font-medium">eNPS</th>
                  <th className="px-3 py-3 font-medium">Índice</th>
                  {DIMENSIONES_CLIMA.map((d) => (
                    <th key={d.clave} className="px-3 py-3 font-medium">{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[{ nombre: 'Toda la empresa', resumen: detalle.general }, ...detalle.filas].map((f) => (
                  <tr key={f.nombre} className="border-b border-marmol-100 last:border-0">
                    <td className="px-3 py-3 text-marmol-800 font-medium">{f.nombre}</td>
                    <td className="px-3 py-3 text-marmol-600">{f.resumen.n}</td>
                    {f.resumen.oculto ? (
                      <td colSpan={2 + DIMENSIONES_CLIMA.length} className="px-3 py-3 text-marmol-400">
                        Menos respuestas que el mínimo para proteger el anonimato
                      </td>
                    ) : (
                      <>
                        <td className="px-3 py-3 text-marmol-600">{f.resumen.enps}</td>
                        <td className="px-3 py-3 text-marmol-600">{f.resumen.indice ?? '—'}</td>
                        {DIMENSIONES_CLIMA.map((d) => (
                          <td key={d.clave} className="px-3 py-3 text-marmol-600">{f.resumen.dimensiones[d.clave] ?? '—'}</td>
                        ))}
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {esLider && (
        <div>
          <h2 className="font-display text-lg font-semibold text-secundario mb-3">Clima de tu equipo</h2>
          {!resumenEquipo || resumenEquipo.length === 0 ? (
            <EmptyState
              icon={HeartHandshake}
              titulo="Aún no hay resultados para tu equipo"
              descripcion="Se necesita un mínimo de respuestas de tu equipo en una ronda para calcular resultados (definido por Talento Humano), y así proteger el anonimato."
            />
          ) : (
            <div className="card overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                    <th className="px-4 py-3 font-medium">Ronda</th>
                    <th className="px-4 py-3 font-medium">Respuestas de tu equipo</th>
                    <th className="px-4 py-3 font-medium">eNPS</th>
                    <th className="px-4 py-3 font-medium">Índice de clima</th>
                  </tr>
                </thead>
                <tbody>
                  {resumenEquipo.map((r) => (
                    <tr key={r.ronda_id} className="border-b border-marmol-100 last:border-0">
                      <td className="px-4 py-3 text-marmol-800">
                        {r.ronda_nombre}
                        {r.ronda_fecha && (
                          <span className="block text-xs text-marmol-400">{formatearFecha(r.ronda_fecha)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-marmol-600">{r.num_respuestas}</td>
                      <td className="px-4 py-3 text-marmol-600">{r.enps ?? `— (menos de ${r.umbral_respuestas} respuestas)`}</td>
                      <td className="px-4 py-3 text-marmol-600">{r.indice_clima_general ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {esAdminTh && (
        <div>
          <h2 className="font-display text-lg font-semibold text-secundario mb-3">Comentarios</h2>
          <p className="text-xs text-marmol-400 mb-3">
            Solo Talento Humano ve estos comentarios — no están ligados a ningún colaborador.
          </p>
          {comentarios.length === 0 ? (
            <EmptyState icon={MessageSquareText} titulo="Sin comentarios todavía" />
          ) : (
            <div className="space-y-2">
              {comentarios.map((c, i) => (
                <div key={i} className="card p-3.5">
                  <p className="text-sm text-marmol-700">{c}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
