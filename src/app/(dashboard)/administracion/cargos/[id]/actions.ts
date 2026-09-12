'use server';

import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const CATEGORIAS = [
  'proposito_organizacional',
  'funciones',
  'riesgos_sst',
  'epp',
  'examenes_medicos',
  'formacion',
  'otro',
] as const;

const ItemSchema = z.object({
  cargoId: z.string().uuid(),
  categoria: z.enum(CATEGORIAS),
  titulo: z.string().trim().min(1, 'El título es requerido'),
  descripcion: z.string().trim().optional(),
});

/** Agrega un punto al plan de inducción específico de un cargo (admin_th). */
export async function agregarItemInduccion(input: z.infer<typeof ItemSchema>) {
  const parsed = ItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();

  const { data: cargo } = await supabase.from('cargos').select('empresa_id').eq('id', parsed.data.cargoId).maybeSingle();
  if (!cargo || cargo.empresa_id !== perfil.empresa_id) return { ok: false as const, error: 'Cargo no encontrado' };

  const { count } = await supabase
    .from('induccion_items')
    .select('id', { count: 'exact', head: true })
    .eq('cargo_id', parsed.data.cargoId);

  const { error } = await supabase.from('induccion_items').insert({
    empresa_id: perfil.empresa_id,
    cargo_id: parsed.data.cargoId,
    categoria: parsed.data.categoria,
    titulo: parsed.data.titulo,
    descripcion: parsed.data.descripcion || null,
    orden: (count ?? 0) + 1,
  });

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/administracion/cargos/${parsed.data.cargoId}`);
  return { ok: true as const };
}

/** Quita un punto del plan de inducción de un cargo (admin_th). */
export async function eliminarItemInduccion(itemId: string, cargoId: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase.from('induccion_items').delete().eq('id', itemId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/administracion/cargos/${cargoId}`);
  return { ok: true as const };
}

// ── Editar cargo (todos los campos) ─────────────────────────────────────────
// Antes la única forma de tocar un cargo era volver a subir el Excel
// completo (FORSST 61), que reemplaza todo. Esto permite corregir un dato
// puntual sin rehacer el documento entero. La ficha del colaborador, el
// organigrama y los informes ya leen el cargo por `cargo_id` en vivo (join),
// así que un cambio acá se refleja solo, sin ningún paso adicional.

const NIVEL = ['alto', 'medio', 'bajo'] as const;

const EditarCargoSchema = z.object({
  cargoId: z.string().uuid(),
  nombre: z.string().trim().min(1, 'El nombre es requerido'),
  procesoArea: z.string().trim().optional(),
  objetivoCargo: z.string().trim().optional(),
  tienePersonalACargo: z.boolean(),
  codigoDocumento: z.string().trim().optional(),
  versionDocumento: z.string().trim().optional(),
  fechaDocumento: z.string().optional(),
  tipoArea: z.enum(['administrativa', 'operativa']).optional().or(z.literal('')),
  generoRequerido: z.string().trim().optional(),
  edadMinima: z.string().optional(),
  edadMaxima: z.string().optional(),
  salario: z.string().trim().optional(),
  competenciasCardinales: z.string().trim().optional(),
  formacionNivel: z
    .enum(['ninguno', 'bachillerato', 'tecnico', 'tecnologo', 'universitario', 'empirico'])
    .optional()
    .or(z.literal('')),
  formacionTituloEspecifico: z.string().trim().optional(),
  experienciaMinimaMeses: z.string().optional(),
  formacionMinimaInduccion: z.string().trim().optional(),
  cargosALosQueReporta: z.string().trim().optional(),
  cargosQueLeReportan: z.string().trim().optional(),
  manejoDinero: z.string().trim().optional(),
  tomaDecisionesOrganizacionales: z.string().trim().optional(),
  cambiosDocumentales: z.string().trim().optional(),
  responsabilidadBienesServicios: z.enum(NIVEL).optional().or(z.literal('')),
  responsabilidadInformacion: z.enum(NIVEL).optional().or(z.literal('')),
  responsabilidadRelacionesInterpersonales: z.enum(NIVEL).optional().or(z.literal('')),
  responsabilidadDireccionCoordinacion: z.enum(NIVEL).optional().or(z.literal('')),
  sgsstResponsabilidadesGenerales: z.string().trim().optional(),
  sgsstResponsabilidadesCampo: z.string().trim().optional(),
  sgsstRendicionCuentas: z.string().trim().optional(),
  sgsstAutoridad: z.string().trim().optional(),
  destrezaFisica: z.boolean(),
  destrezaAuditiva: z.boolean(),
  destrezaVisual: z.boolean(),
  destrezaManual: z.boolean(),
  destrezaCoordinacionMotora: z.boolean(),
  recursosSeleccion: z.string().trim().optional(),
});

/**
 * Edita todos los campos propios del cargo (no las listas relacionadas —
 * esas tienen su propia acción abajo). admin_th únicamente.
 */
export async function actualizarCargo(input: z.infer<typeof EditarCargoSchema>) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return { ok: false as const, error: 'No autorizado' };

  const parsed = EditarCargoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const supabase = createClient();
  const { data: cargo } = await supabase.from('cargos').select('empresa_id').eq('id', d.cargoId).maybeSingle();
  if (!cargo || cargo.empresa_id !== perfil.empresa_id) return { ok: false as const, error: 'Cargo no encontrado' };

  const numOrNull = (v: string | undefined) => (v?.trim() ? Number(v) : null);

  const { error } = await supabase
    .from('cargos')
    .update({
      nombre: d.nombre,
      proceso_area: d.procesoArea || null,
      objetivo_cargo: d.objetivoCargo || null,
      tiene_personal_a_cargo: d.tienePersonalACargo,
      codigo_documento: d.codigoDocumento || null,
      version_documento: d.versionDocumento || null,
      fecha_documento: d.fechaDocumento || null,
      tipo_area: d.tipoArea || null,
      genero_requerido: d.generoRequerido || null,
      edad_minima: numOrNull(d.edadMinima),
      edad_maxima: numOrNull(d.edadMaxima),
      salario: d.salario || null,
      competencias_cardinales: d.competenciasCardinales || null,
      formacion_nivel: d.formacionNivel || null,
      formacion_titulo_especifico: d.formacionTituloEspecifico || null,
      experiencia_minima_meses: numOrNull(d.experienciaMinimaMeses),
      formacion_minima_induccion: d.formacionMinimaInduccion || null,
      cargos_a_los_que_reporta: d.cargosALosQueReporta || null,
      cargos_que_le_reportan: d.cargosQueLeReportan || null,
      manejo_dinero: d.manejoDinero || null,
      toma_decisiones_organizacionales: d.tomaDecisionesOrganizacionales || null,
      cambios_documentales: d.cambiosDocumentales || null,
      responsabilidad_bienes_servicios: d.responsabilidadBienesServicios || null,
      responsabilidad_informacion: d.responsabilidadInformacion || null,
      responsabilidad_relaciones_interpersonales: d.responsabilidadRelacionesInterpersonales || null,
      responsabilidad_direccion_coordinacion: d.responsabilidadDireccionCoordinacion || null,
      sgsst_responsabilidades_generales: d.sgsstResponsabilidadesGenerales || null,
      sgsst_responsabilidades_campo: d.sgsstResponsabilidadesCampo || null,
      sgsst_rendicion_cuentas: d.sgsstRendicionCuentas || null,
      sgsst_autoridad: d.sgsstAutoridad || null,
      destreza_fisica: d.destrezaFisica,
      destreza_auditiva: d.destrezaAuditiva,
      destreza_visual: d.destrezaVisual,
      destreza_manual: d.destrezaManual,
      destreza_coordinacion_motora: d.destrezaCoordinacionMotora,
      recursos_seleccion: d.recursosSeleccion || null,
    })
    .eq('id', d.cargoId);

  if (error) return { ok: false as const, error: error.message };

  // El cargo se lee en vivo (join por cargo_id) desde la ficha del
  // colaborador, la lista de Colaboradores y el organigrama — no hay datos
  // copiados que sincronizar, pero sí páginas cacheadas que refrescar.
  revalidatePath(`/administracion/cargos/${d.cargoId}`);
  revalidatePath(`/administracion/cargos/${d.cargoId}/editar`);
  revalidatePath('/administracion/cargos');
  revalidatePath('/espiral-crecimiento/colaboradores');
  revalidatePath('/espiral-crecimiento/organigrama');
  revalidatePath('/administracion/organigrama');

  return { ok: true as const };
}

// ── Listas relacionadas del cargo (habilidades, funciones, decisiones,
// riesgos, exámenes médicos, EPP) — agregar y quitar filas una por una, sin
// tener que resubir el Excel completo. admin_th únicamente.

async function cargoDeEstaEmpresa(cargoId: string) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') return null;
  const supabase = createClient();
  const { data: cargo } = await supabase.from('cargos').select('empresa_id').eq('id', cargoId).maybeSingle();
  if (!cargo || cargo.empresa_id !== perfil.empresa_id) return null;
  return perfil;
}

function revalidarCargo(cargoId: string) {
  revalidatePath(`/administracion/cargos/${cargoId}`);
  revalidatePath(`/administracion/cargos/${cargoId}/editar`);
}

const HabilidadSchema = z.object({
  cargoId: z.string().uuid(),
  tipo: z.enum(['funcional', 'tecnica']),
  nombre: z.string().trim().min(1, 'El nombre es requerido'),
  nivelEsperado: z.enum(['bajo', 'medio', 'alto']),
});

export async function agregarHabilidadCargo(input: z.infer<typeof HabilidadSchema>) {
  const parsed = HabilidadSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const perfil = await cargoDeEstaEmpresa(parsed.data.cargoId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { count } = await supabase.from('cargo_habilidades').select('id', { count: 'exact', head: true }).eq('cargo_id', parsed.data.cargoId);
  const { error } = await supabase.from('cargo_habilidades').insert({
    cargo_id: parsed.data.cargoId,
    tipo: parsed.data.tipo,
    nombre: parsed.data.nombre,
    nivel_esperado: parsed.data.nivelEsperado,
    orden: (count ?? 0) + 1,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidarCargo(parsed.data.cargoId);
  return { ok: true as const };
}

export async function eliminarHabilidadCargo(id: string, cargoId: string) {
  const perfil = await cargoDeEstaEmpresa(cargoId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const supabase = createClient();
  const { error } = await supabase.from('cargo_habilidades').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidarCargo(cargoId);
  return { ok: true as const };
}

const FuncionSchema = z.object({
  cargoId: z.string().uuid(),
  proceso: z.string().trim().optional(),
  funcion: z.string().trim().min(1, 'La función es requerida'),
  tipoPhva: z.string().trim().optional(),
  periodicidad: z.string().trim().optional(),
  herramientas: z.string().trim().optional(),
});

export async function agregarFuncionCargo(input: z.infer<typeof FuncionSchema>) {
  const parsed = FuncionSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const perfil = await cargoDeEstaEmpresa(parsed.data.cargoId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { count } = await supabase.from('cargo_funciones_principales').select('id', { count: 'exact', head: true }).eq('cargo_id', parsed.data.cargoId);
  const { error } = await supabase.from('cargo_funciones_principales').insert({
    cargo_id: parsed.data.cargoId,
    proceso: parsed.data.proceso || null,
    funcion: parsed.data.funcion,
    tipo_phva: parsed.data.tipoPhva || null,
    periodicidad: parsed.data.periodicidad || null,
    herramientas: parsed.data.herramientas || null,
    orden: (count ?? 0) + 1,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidarCargo(parsed.data.cargoId);
  return { ok: true as const };
}

export async function eliminarFuncionCargo(id: string, cargoId: string) {
  const perfil = await cargoDeEstaEmpresa(cargoId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const supabase = createClient();
  const { error } = await supabase.from('cargo_funciones_principales').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidarCargo(cargoId);
  return { ok: true as const };
}

const DecisionSchema = z.object({
  cargoId: z.string().uuid(),
  descripcion: z.string().trim().min(1, 'La descripción es requerida'),
  periodicidad: z.string().trim().optional(),
});

export async function agregarDecisionCargo(input: z.infer<typeof DecisionSchema>) {
  const parsed = DecisionSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const perfil = await cargoDeEstaEmpresa(parsed.data.cargoId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { count } = await supabase.from('cargo_decisiones').select('id', { count: 'exact', head: true }).eq('cargo_id', parsed.data.cargoId);
  const { error } = await supabase.from('cargo_decisiones').insert({
    cargo_id: parsed.data.cargoId,
    descripcion: parsed.data.descripcion,
    periodicidad: parsed.data.periodicidad || null,
    orden: (count ?? 0) + 1,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidarCargo(parsed.data.cargoId);
  return { ok: true as const };
}

export async function eliminarDecisionCargo(id: string, cargoId: string) {
  const perfil = await cargoDeEstaEmpresa(cargoId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const supabase = createClient();
  const { error } = await supabase.from('cargo_decisiones').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidarCargo(cargoId);
  return { ok: true as const };
}

const RiesgoSchema = z.object({
  cargoId: z.string().uuid(),
  factor: z.string().trim().min(1, 'El factor es requerido'),
  categoria: z.enum(['quimico', 'mecanico', 'locativo', 'ergonomico', 'psicosocial', 'fisico', 'biologico']).optional().or(z.literal('')),
  efectosPosibles: z.string().trim().optional(),
});

export async function agregarRiesgoCargo(input: z.infer<typeof RiesgoSchema>) {
  const parsed = RiesgoSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const perfil = await cargoDeEstaEmpresa(parsed.data.cargoId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { count } = await supabase.from('cargo_factores_riesgo').select('id', { count: 'exact', head: true }).eq('cargo_id', parsed.data.cargoId);
  const { error } = await supabase.from('cargo_factores_riesgo').insert({
    cargo_id: parsed.data.cargoId,
    factor: parsed.data.factor,
    categoria: parsed.data.categoria || null,
    efectos_posibles: parsed.data.efectosPosibles || null,
    orden: (count ?? 0) + 1,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidarCargo(parsed.data.cargoId);
  return { ok: true as const };
}

export async function eliminarRiesgoCargo(id: string, cargoId: string) {
  const perfil = await cargoDeEstaEmpresa(cargoId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const supabase = createClient();
  const { error } = await supabase.from('cargo_factores_riesgo').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidarCargo(cargoId);
  return { ok: true as const };
}

const ExamenSchema = z.object({
  cargoId: z.string().uuid(),
  momento: z.enum(['ingreso', 'periodico', 'retiro']),
  nombreExamen: z.string().trim().min(1, 'El nombre del examen es requerido'),
});

export async function agregarExamenCargo(input: z.infer<typeof ExamenSchema>) {
  const parsed = ExamenSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const perfil = await cargoDeEstaEmpresa(parsed.data.cargoId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { count } = await supabase.from('cargo_examenes_medicos').select('id', { count: 'exact', head: true }).eq('cargo_id', parsed.data.cargoId);
  const { error } = await supabase.from('cargo_examenes_medicos').insert({
    cargo_id: parsed.data.cargoId,
    momento: parsed.data.momento,
    nombre_examen: parsed.data.nombreExamen,
    orden: (count ?? 0) + 1,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidarCargo(parsed.data.cargoId);
  return { ok: true as const };
}

export async function eliminarExamenCargo(id: string, cargoId: string) {
  const perfil = await cargoDeEstaEmpresa(cargoId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const supabase = createClient();
  const { error } = await supabase.from('cargo_examenes_medicos').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidarCargo(cargoId);
  return { ok: true as const };
}

const EppSchema = z.object({ cargoId: z.string().uuid(), item: z.string().trim().min(1, 'El elemento es requerido') });

export async function agregarEppCargo(input: z.infer<typeof EppSchema>) {
  const parsed = EppSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const perfil = await cargoDeEstaEmpresa(parsed.data.cargoId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };

  const supabase = createClient();
  const { count } = await supabase.from('cargo_epp').select('id', { count: 'exact', head: true }).eq('cargo_id', parsed.data.cargoId);
  const { error } = await supabase.from('cargo_epp').insert({
    cargo_id: parsed.data.cargoId,
    item: parsed.data.item,
    orden: (count ?? 0) + 1,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidarCargo(parsed.data.cargoId);
  return { ok: true as const };
}

export async function eliminarEppCargo(id: string, cargoId: string) {
  const perfil = await cargoDeEstaEmpresa(cargoId);
  if (!perfil) return { ok: false as const, error: 'No autorizado' };
  const supabase = createClient();
  const { error } = await supabase.from('cargo_epp').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidarCargo(cargoId);
  return { ok: true as const };
}
