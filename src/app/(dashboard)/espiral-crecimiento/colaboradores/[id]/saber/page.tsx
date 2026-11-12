import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { BotonGenerarChecklistSaber } from '@/components/espiral-crecimiento/boton-generar-checklist-saber';
import { ChecklistSaber } from '@/components/espiral-crecimiento/checklist-saber';
import { notFound } from 'next/navigation';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import type { BloqueSaber, VerificacionSaber } from '@/types/colaborador';
import { resumirDominio, NIVELES_DOMINIO, ETIQUETA_FUENTE } from '@/lib/saber/dominio';

const BLOQUES: { valor: BloqueSaber; titulo: string }[] = [
  { valor: 'formacion_academica', titulo: 'Formación académica' },
  { valor: 'habilidades_funcionales_tecnicas', titulo: 'Habilidades funcionales y técnicas' },
  { valor: 'certificaciones', titulo: 'Certificaciones' },
  { valor: 'experiencia', titulo: 'Experiencia' },
];

const ETIQUETA_FORMACION: Record<string, string> = {
  ninguno: 'Ninguna',
  bachillerato: 'Bachillerato',
  tecnico: 'Técnico',
  tecnologo: 'Tecnólogo',
  universitario: 'Universitario',
  empirico: 'Empírico',
};

export default async function SaberColaboradorPage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();

  const { data: colaborador } = await supabase
    .from('colaboradores')
    .select(
      `id, nombre_completo, lider_id, empresa_id,
       cargo:cargos(id, nombre, formacion_nivel, formacion_titulo_especifico, experiencia_minima_meses)`
    )
    .eq('id', params.id)
    .maybeSingle();

  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id) notFound();

  const puedeEditar =
    perfil.rol === 'admin_th' || (perfil.rol === 'lider' && colaborador.lider_id === perfil.colaborador_id);
  const puedeVer = puedeEditar || (perfil.rol === 'colaborador' && perfil.colaborador_id === colaborador.id);
  if (!puedeVer) notFound();

  const cargo = colaborador.cargo as any;

  const [{ data: verificaciones }, { data: habilidades }] = await Promise.all([
    supabase
      .from('verificaciones_saber')
      .select('*')
      .eq('colaborador_id', params.id)
      .order('created_at', { ascending: true }),
    cargo?.id
      ? supabase.from('cargo_habilidades').select('*').eq('cargo_id', cargo.id).order('orden')
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const verificacionesPorBloque = (bloque: BloqueSaber) =>
    ((verificaciones ?? []) as VerificacionSaber[]).filter((v) => v.bloque === bloque);

  const todas = (verificaciones ?? []) as VerificacionSaber[];
  const resumen = resumirDominio(todas);
  const brechas = todas.filter((v) => v.estado === 'no_cumple_pendiente');

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href={`/espiral-crecimiento/colaboradores/${params.id}`}
          className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2"
        >
          <ArrowLeft size={12} /> Volver a la ficha
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <GraduationCap size={22} className="text-saber" /> Verificación de Saber
        </h1>
        <p className="text-sm text-marmol-500 mt-1">{colaborador.nombre_completo}</p>
      </div>

      {resumen.total > 0 && (
        <div className="card p-5 space-y-3">
          <h2 className="font-display font-semibold text-secundario">Mapa de dominio</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-alto/10 p-3"><p className="text-2xl font-display font-semibold text-secundario">{resumen.dominados}</p><p className="text-xs text-marmol-500">Dominado</p></div>
            <div className="rounded-lg bg-medio/10 p-3"><p className="text-2xl font-display font-semibold text-secundario">{resumen.parciales}</p><p className="text-xs text-marmol-500">Parcial</p></div>
            <div className="rounded-lg bg-bajo/10 p-3"><p className="text-2xl font-display font-semibold text-secundario">{resumen.brechas}</p><p className="text-xs text-marmol-500">Brecha</p></div>
          </div>
          {brechas.length > 0 && (
            <div className="text-xs text-marmol-600">
              <p className="font-medium mb-1">Brechas a cerrar:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {brechas.map((b) => (
                  <li key={b.id}>
                    {b.item_evaluado}
                    {b.nivel_dominio != null && b.nivel_requerido != null ? ` — demuestra ${NIVELES_DOMINIO.find((n) => n.valor === b.nivel_dominio)?.etiqueta.toLowerCase()}, el cargo exige ${NIVELES_DOMINIO.find((n) => n.valor === b.nivel_requerido)?.etiqueta.toLowerCase()}` : ''}
                    {b.fuente_evidencia ? ` (${ETIQUETA_FUENTE[b.fuente_evidencia]})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {resumen.sinFuente > 0 && (
            <p className="text-xs text-marmol-400">{resumen.sinFuente} ítem(s) aún sin fuente de evidencia declarada: cuando la indiques, el mapa gana respaldo.</p>
          )}
        </div>
      )}

      {puedeEditar && <BotonGenerarChecklistSaber colaboradorId={params.id} />}

      {BLOQUES.map(({ valor, titulo }) => (
        <div key={valor} className="card p-5 space-y-3">
          <h2 className="font-display font-semibold text-secundario">{titulo}</h2>

          {valor === 'formacion_academica' && (
            <p className="text-xs text-marmol-500 bg-marmol-50 rounded-lg px-3 py-2">
              Exige el cargo: {ETIQUETA_FORMACION[cargo?.formacion_nivel] ?? 'No definido'}
              {cargo?.formacion_titulo_especifico ? ` — ${cargo.formacion_titulo_especifico}` : ''}
            </p>
          )}

          {valor === 'experiencia' && (
            <p className="text-xs text-marmol-500 bg-marmol-50 rounded-lg px-3 py-2">
              Mínimo exigido por el cargo:{' '}
              {cargo?.experiencia_minima_meses ? `${cargo.experiencia_minima_meses} meses` : 'No definido'}
            </p>
          )}

          {valor === 'habilidades_funcionales_tecnicas' && habilidades && habilidades.length > 0 && (
            <div className="text-xs text-marmol-500 bg-marmol-50 rounded-lg px-3 py-2 space-y-1">
              <p className="font-medium text-marmol-600">Exige el cargo:</p>
              {habilidades.map((h: any) => (
                <p key={h.id}>
                  {h.nombre} <span className="capitalize">({h.tipo}, nivel {h.nivel_esperado})</span>
                </p>
              ))}
            </div>
          )}

          <ChecklistSaber
            key={`${valor}-${verificacionesPorBloque(valor).length}`}
            colaboradorId={params.id}
            bloque={valor}
            itemsIniciales={verificacionesPorBloque(valor)}
            puedeEditar={puedeEditar}
          />
        </div>
      ))}
    </div>
  );
}
