import Link from 'next/link';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/ui/stat-card';
import { AlertaSeveridadDot, AlertaTipoBadge } from '@/components/alertas/alerta-badge';
import { TareasPendientesEvaluacion, type TareaPendiente } from '@/components/espiral-crecimiento/tareas-pendientes-evaluacion';
import { formatearFecha, nombreParaSaludo } from '@/lib/utils';
import { Users, Target, ShieldAlert, TrendingUp, Bell, Compass, TrendingDown, Minus } from 'lucide-react';
import { obtenerInformeHistorico } from '@/app/(dashboard)/informes/historico/data';

export default async function InicioPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();

  // Tareas de valoración (Hacer/Deber) pendientes de la persona logueada,
  // sin importar su rol en la app — cualquiera puede ser evaluador
  // (autoevaluación, líder, par, colaborador a cargo) según el organigrama.
  let tareasPendientes: TareaPendiente[] = [];
  if (perfil.colaborador_id) {
    const { data: tareasRaw } = await supabase
      .from('evaluacion_tareas')
      .select(
        `id, evaluacion_id, tipo_evaluador,
         evaluacion:evaluaciones!inner(colaborador:colaborador_evaluado_id(nombre_completo), ciclo:ciclos_evaluacion(nombre))`
      )
      .eq('evaluador_colaborador_id', perfil.colaborador_id)
      .eq('completada', false);

    tareasPendientes = ((tareasRaw ?? []) as any[]).map((t) => ({
      evaluacionId: t.evaluacion_id,
      tipoEvaluador: t.tipo_evaluador,
      colaboradorEvaluado: t.evaluacion?.colaborador?.nombre_completo ?? '—',
      cicloNombre: t.evaluacion?.ciclo?.nombre ?? '—',
    }));
  }

  const { data: identidad } = await supabase
    .from('empresa_identidad')
    .select('proposito_superior')
    .eq('empresa_id', perfil.empresa_id)
    .maybeSingle();

  const tarjetaProposito = identidad?.proposito_superior ? (
    <div className="rounded-xl border border-secundario/15 bg-secundario/5 px-4 py-3 flex items-start gap-2.5">
      <Compass size={16} className="text-secundario mt-0.5 shrink-0" />
      <p className="text-sm text-marmol-700">
        <span className="font-medium text-secundario">Nuestro propósito: </span>
        {identidad.proposito_superior}
      </p>
    </div>
  ) : perfil.rol === 'admin_th' ? (
    <Link href="/administracion/identidad" className="block text-xs text-marmol-400 hover:text-flow-600 underline">
      Agrega el propósito superior de la empresa para que aparezca aquí
    </Link>
  ) : null;

  // ── Vista para Talento Humano y Gerencia: panorama completo de la empresa ──
  if (perfil.rol === 'admin_th' || perfil.rol === 'gerencia') {
    const { data: indicadores } = await supabase
      .from('v_indicadores_empresa')
      .select('*')
      .eq('empresa_id', perfil.empresa_id)
      .maybeSingle();

    const { filas: historico } = await obtenerInformeHistorico();
    const cicloActual = historico[historico.length - 1];
    const cicloAnterior = historico[historico.length - 2];

    const { data: alertasCriticas } = await supabase
      .from('v_alertas_proximas')
      .select('*')
      .eq('colaborador_empresa_id', perfil.empresa_id)
      .order('fecha_objetivo', { ascending: true })
      .limit(6);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario">
            Hola, {nombreParaSaludo(perfil.nombre_completo, perfil.nombre_preferido)}
          </h1>
          <p className="text-sm text-marmol-500 mt-1">
            Panorama general de Flow, Nexus y Visión — Espiral de Crecimiento 360°
          </p>
        </div>

        {tarjetaProposito}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Colaboradores activos"
            value={indicadores?.total_activos ?? '—'}
            icon={Users}
          />
          <StatCard
            label="Índice de Hacer (promedio)"
            value={indicadores?.promedio_hacer_empresa ?? '—'}
            icon={TrendingUp}
            tono="flow"
          />
          <StatCard
            label="Índice de Deber (promedio)"
            value={indicadores?.promedio_deber_empresa ?? '—'}
            icon={TrendingUp}
            tono="flow"
          />
          <StatCard
            label="Alertas críticas abiertas"
            value={indicadores?.alertas_criticas ?? 0}
            icon={ShieldAlert}
            tono={((indicadores?.alertas_criticas as number) ?? 0) > 0 ? 'bajo' : 'alto'}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <StatCard
            label="Cumplimiento Saber (promedio)"
            value={indicadores?.promedio_saber_empresa ? `${indicadores.promedio_saber_empresa}%` : '—'}
          />
          <StatCard
            label="Alineación talento-rol"
            value={indicadores?.pct_alineacion_talento_rol ? `${indicadores.pct_alineacion_talento_rol}%` : '—'}
            hint="% de personas en un rol alineado con su Ser"
          />
          <StatCard
            label="En proceso de salida"
            value={indicadores?.en_proceso_salida ?? 0}
          />
        </div>

        {cicloActual && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-semibold text-secundario flex items-center gap-2">
                <TrendingUp size={16} /> Comparativo: ciclo actual vs. anterior
              </h2>
              <Link href="/informes/historico" className="text-xs text-flow-600 hover:underline">
                Ver histórico completo
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between border-b border-marmol-100 pb-2 sm:border-b-0 sm:border-r sm:pr-4">
                <div>
                  <p className="text-xs text-marmol-500">Hacer — {cicloActual.cicloNombre}</p>
                  <p className="text-xl font-display font-semibold text-secundario">{cicloActual.promedioHacer ?? '—'}</p>
                </div>
                {cicloAnterior && cicloActual.promedioHacer != null && cicloAnterior.promedioHacer != null ? (
                  (() => {
                    const dif = Math.round((cicloActual.promedioHacer - cicloAnterior.promedioHacer) * 100) / 100;
                    if (dif > 0) return <span className="text-alto text-xs flex items-center gap-0.5"><TrendingUp size={12} /> +{dif}</span>;
                    if (dif < 0) return <span className="text-bajo text-xs flex items-center gap-0.5"><TrendingDown size={12} /> {dif}</span>;
                    return <span className="text-marmol-400 text-xs flex items-center gap-0.5"><Minus size={12} /> sin cambio</span>;
                  })()
                ) : (
                  <span className="text-marmol-300 text-xs">sin ciclo anterior</span>
                )}
              </div>
              <div className="flex items-center justify-between pl-0 sm:pl-4">
                <div>
                  <p className="text-xs text-marmol-500">Deber — {cicloActual.cicloNombre}</p>
                  <p className="text-xl font-display font-semibold text-secundario">{cicloActual.promedioDeber ?? '—'}</p>
                </div>
                {cicloAnterior && cicloActual.promedioDeber != null && cicloAnterior.promedioDeber != null ? (
                  (() => {
                    const dif = Math.round((cicloActual.promedioDeber - cicloAnterior.promedioDeber) * 100) / 100;
                    if (dif > 0) return <span className="text-alto text-xs flex items-center gap-0.5"><TrendingUp size={12} /> +{dif}</span>;
                    if (dif < 0) return <span className="text-bajo text-xs flex items-center gap-0.5"><TrendingDown size={12} /> {dif}</span>;
                    return <span className="text-marmol-400 text-xs flex items-center gap-0.5"><Minus size={12} /> sin cambio</span>;
                  })()
                ) : (
                  <span className="text-marmol-300 text-xs">sin ciclo anterior</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-semibold text-secundario flex items-center gap-2">
              <Bell size={16} /> Próximas alertas
            </h2>
            <Link href="/alertas" className="text-xs text-flow-600 hover:underline">
              Ver todas
            </Link>
          </div>
          {!alertasCriticas || alertasCriticas.length === 0 ? (
            <p className="text-sm text-marmol-400">No hay alertas próximas por ahora.</p>
          ) : (
            <div className="space-y-2">
              {alertasCriticas.map((a) => (
                <div key={a.id as string} className="flex items-center gap-3 py-2 border-b border-marmol-100 last:border-0">
                  <AlertaSeveridadDot severidad={a.severidad as 'info' | 'atencion' | 'critica'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-marmol-800 truncate">{a.titulo as string}</p>
                    <p className="text-xs text-marmol-400">{a.colaborador_nombre as string}</p>
                  </div>
                  <AlertaTipoBadge tipo={a.tipo as string} />
                  <span className="text-xs text-marmol-400 w-24 text-right">
                    {formatearFecha(a.fecha_objetivo as string)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <TareasPendientesEvaluacion tareas={tareasPendientes} />
      </div>
    );
  }

  // ── Vista para Líder: su equipo ─────────────────────────────────────────
  if (perfil.rol === 'lider') {
    const { data: equipo } = await supabase
      .from('v_indicadores_equipo')
      .select('*')
      .eq('lider_id', perfil.colaborador_id ?? '')
      .maybeSingle();

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario">
            Hola, {nombreParaSaludo(perfil.nombre_completo, perfil.nombre_preferido)}
          </h1>
          <p className="text-sm text-marmol-500 mt-1">Resumen de tu equipo</p>
        </div>

        {tarjetaProposito}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Tamaño del equipo" value={equipo?.tamano_equipo ?? 0} icon={Users} />
          <StatCard label="Hacer (promedio equipo)" value={equipo?.promedio_hacer ?? '—'} tono="flow" />
          <StatCard label="Deber (promedio equipo)" value={equipo?.promedio_deber ?? '—'} tono="flow" />
          <StatCard
            label="PDI pendientes"
            value={equipo?.pdi_pendientes ?? 0}
            icon={Target}
            tono={((equipo?.pdi_pendientes as number) ?? 0) > 0 ? 'medio' : 'alto'}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/espiral-crecimiento/colaboradores" className="card p-5 hover:border-flow-300 transition">
            <h3 className="font-display font-semibold text-secundario mb-1">Mi equipo</h3>
            <p className="text-sm text-marmol-500">Ver fichas, Encuentros de Crecimiento y Guía del Flow de cada persona.</p>
          </Link>
          <Link href="/espiral-crecimiento/pdi" className="card p-5 hover:border-flow-300 transition">
            <h3 className="font-display font-semibold text-secundario mb-1">Planes de Desarrollo</h3>
            <p className="text-sm text-marmol-500">Seguimiento a los compromisos de cada colaborador.</p>
          </Link>
        </div>

        <TareasPendientesEvaluacion tareas={tareasPendientes} />
      </div>
    );
  }

  // ── Vista para Auditor externo: solo evidencia de auditoría ─────────────
  if (perfil.rol === 'auditor_externo') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario">
            Hola, {nombreParaSaludo(perfil.nombre_completo, perfil.nombre_preferido)}
          </h1>
          <p className="text-sm text-marmol-500 mt-1">Acceso de solo lectura a evidencia de auditoría</p>
        </div>

        <Link href="/informes/evidencia-auditoria" className="card p-5 hover:border-flow-300 transition block max-w-md">
          <h3 className="font-display font-semibold text-secundario mb-1">Evidencia de auditoría</h3>
          <p className="text-sm text-marmol-500">
            Certificaciones SST, checklist de cumplimiento y matriz de riesgos (ISO 9001, SARLAFT/SAGRILAFT).
          </p>
        </Link>
      </div>
    );
  }

  // ── Vista para Colaborador: su propio resumen ───────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">
          Hola, {nombreParaSaludo(perfil.nombre_completo, perfil.nombre_preferido)}
        </h1>
        <p className="text-sm text-marmol-500 mt-1">Este es tu espacio de crecimiento</p>
      </div>

      {tarjetaProposito}

      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/mi-perfil" className="card p-5 hover:border-flow-300 transition">
          <h3 className="font-display font-semibold text-secundario mb-1">Mi Perfil</h3>
          <p className="text-sm text-marmol-500">Tu ficha, resultados y Guía del Flow.</p>
        </Link>
        <Link href="/espiral-crecimiento/pdi" className="card p-5 hover:border-flow-300 transition">
          <h3 className="font-display font-semibold text-secundario mb-1">Mi Plan de Desarrollo</h3>
          <p className="text-sm text-marmol-500">Tus compromisos y su avance.</p>
        </Link>
        <Link href="/nexa/formacion" className="card p-5 hover:border-flow-300 transition">
          <h3 className="font-display font-semibold text-secundario mb-1">Formación</h3>
          <p className="text-sm text-marmol-500">Tus cursos asignados y de SST.</p>
        </Link>
      </div>

      <TareasPendientesEvaluacion tareas={tareasPendientes} />
    </div>
  );
}
