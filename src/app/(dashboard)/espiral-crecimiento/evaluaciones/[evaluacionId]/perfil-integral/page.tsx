import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Compass } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { cargarDatosPerfilIntegral } from '@/lib/perfil-integral/cargar';
import { IA_PERFIL_DISPONIBLE } from '@/lib/perfil-integral/ia';
import { PerfilIntegralEditor } from '@/components/espiral-crecimiento/perfil-integral-editor';
import { TarjetaIndiceIntegral } from '@/components/espiral-crecimiento/tarjeta-indice-integral';
import { SemaforoBadge } from '@/components/espiral-crecimiento/semaforo-badge';

export const dynamic = 'force-dynamic';

export default async function PerfilIntegralPage({ params }: { params: { evaluacionId: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const datos = await cargarDatosPerfilIntegral(perfil, params.evaluacionId);
  if (!datos) notFound();
  const { ctx, integral, borrador } = datos;

  const supabase = createClient();
  const { data: guardado } = await supabase
    .from('perfiles_integrales')
    .select('hipotesis_ser, lectura_saber, lectura_hacer, lectura_deber, interpretacion, acciones, fuente, actualizado_por_nombre, updated_at')
    .eq('evaluacion_id', params.evaluacionId)
    .maybeSingle();

  const inicial = guardado
    ? {
        hipotesis_ser: guardado.hipotesis_ser ?? '',
        lectura_saber: guardado.lectura_saber ?? '',
        lectura_hacer: guardado.lectura_hacer ?? '',
        lectura_deber: guardado.lectura_deber ?? '',
        interpretacion: guardado.interpretacion ?? '',
        acciones: guardado.acciones ?? '',
      }
    : borrador;

  const fmt = (n: number | null) => (n == null ? '—' : String(n).replace('.', ','));

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href={`/espiral-crecimiento/evaluaciones/${params.evaluacionId}/resultado`} className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2">
          <ArrowLeft size={12} /> Volver al resultado
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <Compass size={22} className="text-flow-500" /> Perfil integral de talento
        </h1>
        <p className="text-sm text-marmol-500 mt-1">
          {ctx.colaborador.nombre}
          {ctx.colaborador.cargo ? ` · ${ctx.colaborador.cargo}` : ''}
          {ctx.ciclo ? ` · ${ctx.ciclo}` : ''}
        </p>
        <p className="text-xs text-marmol-400 mt-2 max-w-xl">
          Cruza los cuatro resultados en una sola lectura. La plataforma (o la IA) propone un borrador y tú decides: edítalo y guárdalo. Es material de trabajo de Talento Humano y del líder: la persona evaluada no lo ve.
          {guardado?.actualizado_por_nombre ? ` Última versión guardada por ${guardado.actualizado_por_nombre}.` : ''}
        </p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
              <th className="px-4 py-3 font-medium">Dimensión</th>
              <th className="px-4 py-3 font-medium">Resultado</th>
              <th className="px-4 py-3 font-medium">Semáforo</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-marmol-100"><td className="px-4 py-2.5 font-medium text-ser">Ser</td><td className="px-4 py-2.5 text-marmol-500">{ctx.ser.disponible ? 'Guía del Flow aplicada (descriptivo, sin nota)' : 'Sin Guía disponible'}</td><td className="px-4 py-2.5 text-marmol-300">—</td></tr>
            <tr className="border-b border-marmol-100"><td className="px-4 py-2.5 font-medium text-saber">Saber</td><td className="px-4 py-2.5">{ctx.saber.cumplimiento != null ? `${fmt(ctx.saber.cumplimiento)} % del perfil del cargo` : '—'}</td><td className="px-4 py-2.5 text-marmol-300">—</td></tr>
            <tr className="border-b border-marmol-100"><td className="px-4 py-2.5 font-medium text-hacer">Hacer</td><td className="px-4 py-2.5">{fmt(ctx.desempeno.indiceHacer)} / 5</td><td className="px-4 py-2.5"><SemaforoBadge nivel={ctx.desempeno.semaforoHacer as any} /></td></tr>
            <tr><td className="px-4 py-2.5 font-medium text-deber">Deber</td><td className="px-4 py-2.5">{fmt(ctx.desempeno.indiceDeber)} / 5</td><td className="px-4 py-2.5"><SemaforoBadge nivel={ctx.desempeno.semaforoDeber as any} /></td></tr>
          </tbody>
        </table>
      </div>

      <TarjetaIndiceIntegral datos={integral} />

      <PerfilIntegralEditor
        evaluacionId={params.evaluacionId}
        inicial={inicial}
        fuenteInicial={(guardado?.fuente as any) ?? 'automatico'}
        guardado={Boolean(guardado)}
        iaDisponible={IA_PERFIL_DISPONIBLE()}
      />
    </div>
  );
}
