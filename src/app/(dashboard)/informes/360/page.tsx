import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { redirect } from 'next/navigation';
import { EmptyState } from '@/components/ui/empty-state';
import { SemaforoBadge } from '@/components/espiral-crecimiento/semaforo-badge';
import { Sparkles, GraduationCap, Briefcase, ShieldCheck, FileDown, FileSpreadsheet, Users2 } from 'lucide-react';
import { formatearFecha } from '@/lib/utils';
import { obtenerInforme360 } from './data';
import { IdentidadReferencia } from '@/components/espiral-crecimiento/identidad-referencia';

const ETIQUETA_EVALUADOR: Record<string, string> = {
  autoevaluacion: 'Autoevaluación',
  lider: 'Líder',
  par: 'Pares',
  colaborador_a_cargo: 'Colaboradores a cargo',
};

export default async function Informe360Page({
  searchParams,
}: {
  searchParams: { colaboradorId?: string };
}) {
  const perfil = await getPerfilActual();
  if (!perfil) redirect('/inicio');
  if (perfil.rol === 'gerencia') redirect('/informes');

  const colaboradorId = perfil.rol === 'colaborador' ? perfil.colaborador_id ?? undefined : searchParams.colaboradorId;

  let colaboradoresFiltrables: { id: string; nombre_completo: string }[] = [];
  if (perfil.rol !== 'colaborador') {
    const supabase = createClient();
    let query = supabase
      .from('colaboradores')
      .select('id, nombre_completo')
      .eq('empresa_id', perfil.empresa_id)
      .eq('estado', 'activo')
      .order('nombre_completo');

    if (perfil.rol === 'lider' && perfil.colaborador_id) {
      query = query.eq('lider_id', perfil.colaborador_id);
    }

    const { data } = await query;
    colaboradoresFiltrables = data ?? [];
  }

  const { informe } = colaboradorId ? await obtenerInforme360(colaboradorId) : { informe: null };
  const queryString = colaboradorId ? `?colaboradorId=${colaboradorId}` : '';

  const hacer = informe?.detallePorEvaluador.filter((d) => d.dimension === 'hacer') ?? [];
  const deber = informe?.detallePorEvaluador.filter((d) => d.dimension === 'deber') ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario">
            Informe de Encuentro de Crecimiento 360° Integrado
          </h1>
          <p className="text-sm text-marmol-500 mt-1">
            Resultado consolidado de Ser, Saber, Hacer y Deber, con detalle de cada acompañante.
          </p>
        </div>

        {informe && (
          <div className="flex items-center gap-2">
            <a
              href={`/api/informes/360/pdf${queryString}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-sm font-medium px-3.5 py-2 transition"
            >
              <FileDown size={16} /> PDF
            </a>
            <a
              href={`/api/informes/360/excel${queryString}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-sm font-medium px-3.5 py-2 transition"
            >
              <FileSpreadsheet size={16} /> Excel
            </a>
          </div>
        )}
      </div>

      <IdentidadReferencia empresaId={perfil.empresa_id} />

      {perfil.rol !== 'colaborador' && colaboradoresFiltrables.length > 0 && (
        <form className="card p-3 flex items-center gap-3">
          <label className="text-xs text-marmol-500 shrink-0">Persona</label>
          <select
            name="colaboradorId"
            defaultValue={colaboradorId ?? ''}
            className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm flex-1"
          >
            <option value="">Selecciona una persona…</option>
            {colaboradoresFiltrables.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre_completo}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3.5 py-1.5 transition"
          >
            Ver informe
          </button>
        </form>
      )}

      {!colaboradorId ? (
        <EmptyState icon={Users2} titulo="Selecciona una persona" descripcion="Elige de quién quieres ver el Informe 360°." />
      ) : !informe ? (
        <EmptyState
          icon={Users2}
          titulo="No se pudo cargar el informe"
          descripcion="La persona no existe, o no tienes autorización para verla."
        />
      ) : (
        <>
          <div className="card p-6">
            <h2 className="font-display text-lg font-semibold text-secundario">{informe.colaborador.nombre_completo}</h2>
            <p className="text-sm text-marmol-500">
              {informe.colaborador.cargo_nombre} · {informe.colaborador.area}
            </p>
            <p className="text-xs text-marmol-400 mt-1">
              Ingreso: {formatearFecha(informe.colaborador.fecha_ingreso)} · Líder: {informe.colaborador.lider_nombre ?? '—'}
              {informe.ciclo_nombre && ` · Ciclo: ${informe.ciclo_nombre}`}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <p className="text-xs font-medium text-marmol-500 mb-2 flex items-center gap-1.5">
                <Sparkles size={14} className="text-ser" /> SER
              </p>
              <p className="text-sm text-marmol-700">{informe.ser ? 'Guía del Flow completada' : 'Pendiente'}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs font-medium text-marmol-500 mb-2 flex items-center gap-1.5">
                <GraduationCap size={14} className="text-saber" /> SABER
              </p>
              <p className="text-2xl font-display font-semibold text-secundario">
                {informe.saber?.porcentaje_cumplimiento != null ? `${informe.saber.porcentaje_cumplimiento}%` : '—'}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-xs font-medium text-marmol-500 mb-2 flex items-center gap-1.5">
                <Briefcase size={14} className="text-hacer" /> HACER
              </p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-display font-semibold text-secundario">
                  {informe.resultado?.indice_hacer ?? '—'}
                </p>
                <SemaforoBadge nivel={informe.resultado?.semaforo_hacer as any} />
              </div>
            </div>
            <div className="card p-4">
              <p className="text-xs font-medium text-marmol-500 mb-2 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-deber" /> DEBER
              </p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-display font-semibold text-secundario">
                  {informe.resultado?.indice_deber ?? '—'}
                </p>
                <SemaforoBadge nivel={informe.resultado?.semaforo_deber as any} />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="font-display font-semibold text-secundario mb-3">Hacer — detalle por acompañante</h3>
              {hacer.length === 0 ? (
                <p className="text-sm text-marmol-400">Sin respuestas registradas todavía.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {hacer.map((d) => (
                    <div key={d.tipo_evaluador} className="flex justify-between border-b border-marmol-100 pb-1.5 last:border-0">
                      <span className="text-marmol-600">{ETIQUETA_EVALUADOR[d.tipo_evaluador] ?? d.tipo_evaluador}</span>
                      <span className="font-medium text-marmol-900">{d.promedio}</span>
                    </div>
                  ))}
                </div>
              )}
              {informe.resultado?.brecha_hacer != null && (
                <p className="text-xs text-marmol-400 mt-3">
                  Brecha vs. autoevaluación: {informe.resultado.brecha_hacer > 0 ? '+' : ''}
                  {informe.resultado.brecha_hacer}
                </p>
              )}
            </div>

            <div className="card p-5">
              <h3 className="font-display font-semibold text-secundario mb-3">Deber — detalle por acompañante</h3>
              {deber.length === 0 ? (
                <p className="text-sm text-marmol-400">Sin respuestas registradas todavía.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {deber.map((d) => (
                    <div key={d.tipo_evaluador} className="flex justify-between border-b border-marmol-100 pb-1.5 last:border-0">
                      <span className="text-marmol-600">{ETIQUETA_EVALUADOR[d.tipo_evaluador] ?? d.tipo_evaluador}</span>
                      <span className="font-medium text-marmol-900">{d.promedio}</span>
                    </div>
                  ))}
                </div>
              )}
              {informe.resultado?.brecha_deber != null && (
                <p className="text-xs text-marmol-400 mt-3">
                  Brecha vs. autoevaluación: {informe.resultado.brecha_deber > 0 ? '+' : ''}
                  {informe.resultado.brecha_deber}
                </p>
              )}
            </div>
          </div>

          {informe.ser && (
            <div className="card p-5">
              <h3 className="font-display font-semibold text-secundario mb-3">Ser — Guía del Flow</h3>
              <dl className="space-y-2 text-sm">
                {informe.ser.proposito && (
                  <div>
                    <dt className="text-marmol-500 text-xs">Propósito</dt>
                    <dd className="text-marmol-800">{informe.ser.proposito}</dd>
                  </div>
                )}
                {informe.ser.talentos_naturales && (
                  <div>
                    <dt className="text-marmol-500 text-xs">Talentos naturales</dt>
                    <dd className="text-marmol-800">{informe.ser.talentos_naturales}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </>
      )}
    </div>
  );
}
