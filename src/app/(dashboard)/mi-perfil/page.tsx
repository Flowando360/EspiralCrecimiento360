import Link from 'next/link';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { obtenerUrlFirmadaDocumentoColaborador } from '@/lib/supabase/storage';
import { SemaforoBadge } from '@/components/espiral-crecimiento/semaforo-badge';
import { formatearFecha } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { User, HeartPulse, Paperclip } from 'lucide-react';
import { FechasPersonalesForm } from '@/components/espiral-crecimiento/fechas-personales-form';
import { NombrePreferidoForm } from '@/components/espiral-crecimiento/nombre-preferido-form';
import { MisFechasEspeciales } from '@/components/espiral-crecimiento/mis-fechas-especiales';

const ETIQUETA_TIPO_INCAPACIDAD: Record<string, string> = {
  enfermedad_general: 'Enfermedad general',
  accidente_laboral: 'Accidente laboral',
  enfermedad_laboral: 'Enfermedad laboral',
  licencia_maternidad: 'Licencia de maternidad',
  licencia_paternidad: 'Licencia de paternidad',
  otra: 'Otra',
};

export default async function MiPerfilPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  if (!perfil.colaborador_id) {
    return (
      <div className="space-y-6 max-w-3xl">
        <NombrePreferidoForm nombrePreferidoInicial={perfil.nombre_preferido} />
        <EmptyState
          icon={User}
          titulo="Tu usuario aún no está vinculado a una ficha de colaborador"
          descripcion="Pide a Talento Humano que asocie tu cuenta a tu ficha en Administración → Usuarios."
        />
      </div>
    );
  }

  const supabase = createClient();

  const [{ data: colaborador }, { data: resultado }, { data: ser }, { data: saber }, { data: fechasPersonales }, { data: fechasEspeciales }] = await Promise.all([
    supabase
      .from('colaboradores')
      .select('nombre_completo, fecha_ingreso, cargo:cargos(nombre, proceso_area, objetivo_cargo), lider:lider_id(nombre_completo)')
      .eq('id', perfil.colaborador_id)
      .maybeSingle(),
    supabase
      .from('resultados_evaluacion')
      .select('indice_hacer, indice_deber, semaforo_hacer, semaforo_deber, evaluacion:evaluaciones!inner(id, colaborador_evaluado_id)')
      .eq('evaluacion.colaborador_evaluado_id', perfil.colaborador_id)
      .order('actualizado_en', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('guia_del_flow')
      .select('*')
      .eq('colaborador_id', perfil.colaborador_id)
      .order('fecha_aplicacion', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('v_saber_cumplimiento').select('*').eq('colaborador_id', perfil.colaborador_id).maybeSingle(),
    supabase
      .from('fechas_personales_colaborador')
      .select('fecha_matrimonio, fecha_baby_shower, en_embarazo, fecha_probable_parto')
      .eq('colaborador_id', perfil.colaborador_id)
      .maybeSingle(),
    supabase
      .from('fechas_especiales_colaborador')
      .select('id, descripcion, fecha')
      .eq('colaborador_id', perfil.colaborador_id)
      .order('fecha'),
  ]);

  const { data: incapacidadesRaw } = await supabase
    .from('incapacidades_colaborador')
    .select('id, tipo, fecha_inicio, fecha_fin, dias, entidad_emisora, soporte_url')
    .eq('colaborador_id', perfil.colaborador_id)
    .order('fecha_inicio', { ascending: false });

  const incapacidades = await Promise.all(
    (incapacidadesRaw ?? []).map(async (i) => ({
      ...i,
      soporteUrl: await obtenerUrlFirmadaDocumentoColaborador(i.soporte_url),
    }))
  );

  const cargo = colaborador?.cargo as any;
  const lider = colaborador?.lider as any;
  const evaluacionResultadoId = (resultado?.evaluacion as any)?.id as string | undefined;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Mi Perfil</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Tu ficha 360°: quién eres para la organización, tus resultados y tu formación.
        </p>
      </div>

      <div className="card p-6">
        <h2 className="font-display font-semibold text-secundario">{colaborador?.nombre_completo}</h2>
        <p className="text-sm text-marmol-500">
          {cargo?.nombre} · {cargo?.proceso_area}
        </p>
        <p className="text-xs text-marmol-400 mt-1">
          Ingreso: {colaborador ? formatearFecha(colaborador.fecha_ingreso) : '—'} · Líder:{' '}
          {lider?.nombre_completo ?? '—'}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-marmol-500 mb-1">SER</p>
          <p className="text-sm text-marmol-700">{ser ? 'Completada' : 'Pendiente'}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-marmol-500 mb-1">SABER</p>
          <p className="text-lg font-display font-semibold">
            {saber?.porcentaje_cumplimiento != null ? `${saber.porcentaje_cumplimiento}%` : '—'}
          </p>
        </div>
        {evaluacionResultadoId ? (
          <>
            <Link href={`/espiral-crecimiento/evaluaciones/${evaluacionResultadoId}/resultado`} className="card p-4 hover:border-flow-300 transition">
              <p className="text-xs text-marmol-500 mb-1">HACER</p>
              <SemaforoBadge nivel={resultado?.semaforo_hacer as any} />
            </Link>
            <Link href={`/espiral-crecimiento/evaluaciones/${evaluacionResultadoId}/resultado`} className="card p-4 hover:border-flow-300 transition">
              <p className="text-xs text-marmol-500 mb-1">DEBER</p>
              <SemaforoBadge nivel={resultado?.semaforo_deber as any} />
            </Link>
          </>
        ) : (
          <>
            <div className="card p-4">
              <p className="text-xs text-marmol-500 mb-1">HACER</p>
              <SemaforoBadge nivel={resultado?.semaforo_hacer as any} />
            </div>
            <div className="card p-4">
              <p className="text-xs text-marmol-500 mb-1">DEBER</p>
              <SemaforoBadge nivel={resultado?.semaforo_deber as any} />
            </div>
          </>
        )}
      </div>

      {ser && (
        <div className="card p-5">
          <h3 className="font-display font-semibold text-secundario mb-2">Mi Guía del Flow</h3>
          <div className="grid sm:grid-cols-2 gap-3 text-sm text-marmol-700">
            {ser.talentos_naturales && (
              <div>
                <p className="text-xs text-marmol-400 mb-0.5">Talentos naturales</p>
                <p>{ser.talentos_naturales}</p>
              </div>
            )}
            {ser.proposito && (
              <div>
                <p className="text-xs text-marmol-400 mb-0.5">Propósito</p>
                <p>{ser.proposito}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <NombrePreferidoForm nombrePreferidoInicial={perfil.nombre_preferido} />

      <FechasPersonalesForm datosIniciales={fechasPersonales ?? null} />

      <MisFechasEspeciales itemsIniciales={fechasEspeciales ?? []} />

      {incapacidades.length > 0 && (
        <div className="card p-5">
          <h3 className="font-display font-semibold text-secundario mb-1 flex items-center gap-1.5">
            <HeartPulse size={16} /> Mis incapacidades
          </h3>
          <p className="text-xs text-marmol-400 mb-3">
            Las registra Talento Humano cuando recibe tu certificado. Si falta alguna, avísales.
          </p>
          <div className="space-y-2">
            {incapacidades.map((i) => (
              <div key={i.id} className="flex items-center justify-between border-b border-marmol-100 pb-2 last:border-0">
                <div>
                  <p className="text-sm font-medium text-marmol-800">{ETIQUETA_TIPO_INCAPACIDAD[i.tipo] ?? i.tipo}</p>
                  <p className="text-xs text-marmol-500">
                    {formatearFecha(i.fecha_inicio)} — {formatearFecha(i.fecha_fin)} · {i.dias} día{i.dias === 1 ? '' : 's'}
                    {i.entidad_emisora ? ` · ${i.entidad_emisora}` : ''}
                  </p>
                </div>
                {i.soporteUrl && (
                  <a href={i.soporteUrl} target="_blank" rel="noopener noreferrer" className="text-marmol-400 hover:text-flow-600" title="Ver soporte">
                    <Paperclip size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
