'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { parsearPerfilCargo, type PerfilCargoParseado } from '@/lib/importador-perfil-cargo';
import type { Database } from '@/types/database.types';

type CargoUpdate = Database['public']['Tables']['cargos']['Update'];

/**
 * Parsea el Excel (formato FORSST 61) y devuelve el resultado SIN guardar
 * nada — el admin_th revisa el preview antes de confirmar.
 */
export async function previsualizarPerfilCargo(formData: FormData) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const file = formData.get('archivo') as File;
  if (!file || file.size === 0) return { ok: false as const, error: 'Selecciona un archivo Excel' };

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const datos = await parsearPerfilCargo(buffer);
    return { ok: true as const, datos };
  } catch (e: any) {
    return { ok: false as const, error: `No se pudo leer el archivo: ${e.message ?? e}` };
  }
}

/**
 * Guarda en la base de datos lo que ya se parseó y se mostró en el preview
 * (admin_th). Busca el cargo por nombre; si no existe, lo crea. Reemplaza
 * por completo las listas relacionadas (habilidades, funciones, decisiones,
 * factores de riesgo, exámenes, EPP) — mismo criterio que ya usaba el script
 * hecho a mano para este mismo cargo.
 */
export async function guardarPerfilCargoImportado(datos: PerfilCargoParseado) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  if (!datos.nombre) return { ok: false as const, error: 'El archivo no trae un nombre de cargo identificable' };

  const supabase = createClient();

  const { data: existente } = await supabase
    .from('cargos')
    .select('id')
    .eq('empresa_id', perfil.empresa_id)
    .ilike('nombre', datos.nombre)
    .maybeSingle();

  let cargoId = existente?.id as string | undefined;

  if (!cargoId) {
    const { data: creado, error: errorCrear } = await supabase
      .from('cargos')
      .insert({ empresa_id: perfil.empresa_id, nombre: datos.nombre, proceso_area: datos.procesoArea })
      .select('id')
      .single();
    if (errorCrear || !creado) return { ok: false as const, error: errorCrear?.message ?? 'No se pudo crear el cargo' };
    cargoId = creado.id as string;
  }

  // Solo se sobrescriben los campos que sí se lograron leer del archivo —
  // así un campo que el parser no encontró no borra un dato bueno ya cargado.
  const camposCargo: Record<string, unknown> = {};
  const set = (campo: string, valor: unknown) => {
    if (valor !== null && valor !== undefined) camposCargo[campo] = valor;
  };
  set('proceso_area', datos.procesoArea);
  set('objetivo_cargo', datos.objetivoCargo);
  set('codigo_documento', datos.codigoDocumento);
  set('version_documento', datos.versionDocumento);
  set('fecha_documento', datos.fechaDocumento);
  set('tipo_area', datos.tipoArea);
  set('genero_requerido', datos.generoRequerido);
  set('edad_minima', datos.edadMinima);
  set('edad_maxima', datos.edadMaxima);
  set('salario', datos.salario);
  set('competencias_cardinales', datos.competenciasCardinales);
  set('formacion_nivel', datos.formacionNivel);
  set('formacion_titulo_especifico', datos.formacionTituloEspecifico);
  set('experiencia_minima_meses', datos.experienciaMinimaMeses);
  set('formacion_minima_induccion', datos.formacionMinimaInduccion);
  set('cargos_a_los_que_reporta', datos.cargosALosQueReporta);
  set('cargos_que_le_reportan', datos.cargosQueLeReportan);
  set('manejo_dinero', datos.manejoDinero);
  set('toma_decisiones_organizacionales', datos.tomaDecisionesOrganizacionales);
  set('cambios_documentales', datos.cambiosDocumentales);
  set('responsabilidad_bienes_servicios', datos.responsabilidadBienesServicios);
  set('responsabilidad_informacion', datos.responsabilidadInformacion);
  set('responsabilidad_relaciones_interpersonales', datos.responsabilidadRelacionesInterpersonales);
  set('responsabilidad_direccion_coordinacion', datos.responsabilidadDireccionCoordinacion);
  set('sgsst_responsabilidades_generales', datos.sgsstResponsabilidadesGenerales);
  set('sgsst_responsabilidades_campo', datos.sgsstResponsabilidadesCampo);
  set('sgsst_rendicion_cuentas', datos.sgsstRendicionCuentas);
  set('sgsst_autoridad', datos.sgsstAutoridad);
  set('recursos_seleccion', datos.recursosSeleccion);
  camposCargo.destreza_fisica = datos.destrezaFisica;
  camposCargo.destreza_auditiva = datos.destrezaAuditiva;
  camposCargo.destreza_visual = datos.destrezaVisual;
  camposCargo.destreza_manual = datos.destrezaManual;
  camposCargo.destreza_coordinacion_motora = datos.destrezaCoordinacionMotora;

  // camposCargo se arma dinámicamente con nombres de columnas reales de "cargos"
  // (ver helper set() arriba) — el cast es seguro, solo evita que postgrest exija
  // conocer las claves en tiempo de compilación para un objeto armado en runtime.
  const { error: errorUpdate } = await supabase.from('cargos').update(camposCargo as CargoUpdate).eq('id', cargoId);
  if (errorUpdate) return { ok: false as const, error: errorUpdate.message };

  // Reemplazar listas relacionadas por completo.
  await supabase.from('cargo_habilidades').delete().eq('cargo_id', cargoId);
  if (datos.habilidades.length > 0) {
    await supabase.from('cargo_habilidades').insert(
      datos.habilidades.map((h, i) => ({
        cargo_id: cargoId,
        tipo: h.tipo,
        nombre: h.nombre,
        nivel_esperado: h.nivelEsperado,
        orden: i + 1,
      }))
    );
  }

  await supabase.from('cargo_funciones_principales').delete().eq('cargo_id', cargoId);
  if (datos.funcionesPrincipales.length > 0) {
    await supabase.from('cargo_funciones_principales').insert(
      datos.funcionesPrincipales.map((f, i) => ({
        cargo_id: cargoId,
        proceso: f.proceso,
        funcion: f.funcion,
        tipo_phva: f.tipoPhva,
        periodicidad: f.periodicidad,
        herramientas: f.herramientas,
        orden: i + 1,
      }))
    );
  }

  await supabase.from('cargo_decisiones').delete().eq('cargo_id', cargoId);
  if (datos.decisiones.length > 0) {
    await supabase.from('cargo_decisiones').insert(
      datos.decisiones.map((d, i) => ({
        cargo_id: cargoId,
        descripcion: d.descripcion,
        periodicidad: d.periodicidad,
        orden: i + 1,
      }))
    );
  }

  await supabase.from('cargo_factores_riesgo').delete().eq('cargo_id', cargoId);
  if (datos.factoresRiesgo.length > 0) {
    await supabase.from('cargo_factores_riesgo').insert(
      datos.factoresRiesgo.map((r, i) => ({
        cargo_id: cargoId,
        factor: r.factor,
        categoria: r.categoria,
        efectos_posibles: r.efectosPosibles,
        orden: i + 1,
      }))
    );
  }

  await supabase.from('cargo_examenes_medicos').delete().eq('cargo_id', cargoId);
  if (datos.examenesMedicos.length > 0) {
    await supabase.from('cargo_examenes_medicos').insert(
      datos.examenesMedicos.map((e, i) => ({
        cargo_id: cargoId,
        momento: e.momento,
        nombre_examen: e.nombreExamen,
        orden: i + 1,
      }))
    );
  }

  await supabase.from('cargo_epp').delete().eq('cargo_id', cargoId);
  if (datos.epp.length > 0) {
    await supabase.from('cargo_epp').insert(
      datos.epp.map((item, i) => ({ cargo_id: cargoId, item, orden: i + 1 }))
    );
  }

  revalidatePath('/administracion/cargos');
  return { ok: true as const, cargoId, esNuevo: !existente };
}
