import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { redirect, notFound } from 'next/navigation';
import { ArrowLeft, Pencil } from 'lucide-react';
import { FormularioEditarCargo } from '@/components/espiral-crecimiento/formulario-editar-cargo';
import {
  ListaHabilidadesCargo,
  ListaFuncionesCargo,
  ListaDecisionesCargo,
  ListaRiesgosCargo,
  ListaExamenesCargo,
  ListaEppCargo,
} from '@/components/espiral-crecimiento/listas-cargo';

export default async function EditarCargoPage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/inicio');

  const supabase = createClient();

  const { data: cargo } = await supabase.from('cargos').select('*').eq('id', params.id).maybeSingle();
  if (!cargo || cargo.empresa_id !== perfil.empresa_id) notFound();

  const [{ data: habilidades }, { data: funciones }, { data: decisiones }, { data: riesgos }, { data: examenes }, { data: epp }] =
    await Promise.all([
      supabase.from('cargo_habilidades').select('*').eq('cargo_id', params.id).order('orden'),
      supabase.from('cargo_funciones_principales').select('*').eq('cargo_id', params.id).order('orden'),
      supabase.from('cargo_decisiones').select('*').eq('cargo_id', params.id).order('orden'),
      supabase.from('cargo_factores_riesgo').select('*').eq('cargo_id', params.id).order('orden'),
      supabase.from('cargo_examenes_medicos').select('*').eq('cargo_id', params.id).order('orden'),
      supabase.from('cargo_epp').select('*').eq('cargo_id', params.id).order('orden'),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/administracion/cargos/${params.id}`}
          className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2"
        >
          <ArrowLeft size={12} /> Volver al cargo
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <Pencil size={20} className="text-flow-600" /> Editar {cargo.nombre}
        </h1>
        <p className="text-sm text-marmol-500 mt-1">
          Cualquier cambio se refleja de inmediato en la ficha de cada colaborador con este cargo, en el
          organigrama y en los informes — todos leen el cargo en vivo, no una copia.
        </p>
      </div>

      <FormularioEditarCargo
        datosIniciales={{
          id: cargo.id,
          nombre: cargo.nombre,
          procesoArea: cargo.proceso_area ?? '',
          objetivoCargo: cargo.objetivo_cargo ?? '',
          tienePersonalACargo: cargo.tiene_personal_a_cargo,
          codigoDocumento: cargo.codigo_documento ?? '',
          versionDocumento: cargo.version_documento ?? '',
          fechaDocumento: cargo.fecha_documento ?? '',
          tipoArea: cargo.tipo_area ?? '',
          generoRequerido: cargo.genero_requerido ?? '',
          edadMinima: cargo.edad_minima != null ? String(cargo.edad_minima) : '',
          edadMaxima: cargo.edad_maxima != null ? String(cargo.edad_maxima) : '',
          salario: cargo.salario ?? '',
          competenciasCardinales: cargo.competencias_cardinales ?? '',
          formacionNivel: cargo.formacion_nivel ?? '',
          formacionTituloEspecifico: cargo.formacion_titulo_especifico ?? '',
          experienciaMinimaMeses: cargo.experiencia_minima_meses != null ? String(cargo.experiencia_minima_meses) : '',
          formacionMinimaInduccion: cargo.formacion_minima_induccion ?? '',
          cargosALosQueReporta: cargo.cargos_a_los_que_reporta ?? '',
          cargosQueLeReportan: cargo.cargos_que_le_reportan ?? '',
          manejoDinero: cargo.manejo_dinero ?? '',
          tomaDecisionesOrganizacionales: cargo.toma_decisiones_organizacionales ?? '',
          cambiosDocumentales: cargo.cambios_documentales ?? '',
          responsabilidadBienesServicios: cargo.responsabilidad_bienes_servicios ?? '',
          responsabilidadInformacion: cargo.responsabilidad_informacion ?? '',
          responsabilidadRelacionesInterpersonales: cargo.responsabilidad_relaciones_interpersonales ?? '',
          responsabilidadDireccionCoordinacion: cargo.responsabilidad_direccion_coordinacion ?? '',
          sgsstResponsabilidadesGenerales: cargo.sgsst_responsabilidades_generales ?? '',
          sgsstResponsabilidadesCampo: cargo.sgsst_responsabilidades_campo ?? '',
          sgsstRendicionCuentas: cargo.sgsst_rendicion_cuentas ?? '',
          sgsstAutoridad: cargo.sgsst_autoridad ?? '',
          destrezaFisica: cargo.destreza_fisica ?? false,
          destrezaAuditiva: cargo.destreza_auditiva ?? false,
          destrezaVisual: cargo.destreza_visual ?? false,
          destrezaManual: cargo.destreza_manual ?? false,
          destrezaCoordinacionMotora: cargo.destreza_coordinacion_motora ?? false,
          recursosSeleccion: cargo.recursos_seleccion ?? '',
        }}
      />

      <div className="max-w-3xl space-y-4">
        <ListaHabilidadesCargo cargoId={params.id} inicial={(habilidades ?? []) as any} />
        <ListaFuncionesCargo cargoId={params.id} inicial={(funciones ?? []) as any} />
        <ListaDecisionesCargo cargoId={params.id} inicial={(decisiones ?? []) as any} />
        <ListaRiesgosCargo cargoId={params.id} inicial={(riesgos ?? []) as any} />
        <ListaExamenesCargo cargoId={params.id} inicial={(examenes ?? []) as any} />
        <ListaEppCargo cargoId={params.id} inicial={(epp ?? []) as any} />
      </div>
    </div>
  );
}
