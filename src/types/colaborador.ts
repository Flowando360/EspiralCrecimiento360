export type RolUsuario = 'admin_th' | 'lider' | 'colaborador' | 'gerencia' | 'auditor_externo';

export type EstadoColaborador = 'activo' | 'inactivo' | 'en_proceso_salida' | 'periodo_prueba';

export type TipoContrato =
  | 'indefinido'
  | 'fijo'
  | 'obra_labor'
  | 'prestacion_servicios'
  | 'aprendizaje'
  | 'externo';

export interface Cargo {
  id: string;
  empresa_id: string;
  nombre: string;
  proceso_area: string | null;
  objetivo_cargo: string | null;
  tiene_personal_a_cargo: boolean;
  formacion_nivel:
    | 'ninguno'
    | 'bachillerato'
    | 'tecnico'
    | 'tecnologo'
    | 'universitario'
    | 'empirico'
    | null;
  formacion_titulo_especifico: string | null;
  experiencia_minima_meses: number | null;
}

export interface CargoHabilidad {
  id: string;
  cargo_id: string;
  tipo: 'funcional' | 'tecnica';
  nombre: string;
  nivel_esperado: 'bajo' | 'medio' | 'alto';
}

export interface Colaborador {
  id: string;
  empresa_id: string;
  usuario_id: string | null;
  cargo_id: string;
  nombre_completo: string;
  numero_documento: string | null;
  email: string | null;
  telefono: string | null;
  foto_url: string | null;
  lider_id: string | null;
  es_externo: boolean;
  fecha_ingreso: string;
  fecha_salida: string | null;
  estado: EstadoColaborador;
  tipo_contrato: TipoContrato;
}

export interface ColaboradorConCargo extends Colaborador {
  cargo: Cargo;
  lider: Pick<Colaborador, 'id' | 'nombre_completo'> | null;
}

export type SemaforoNivel = 'alto' | 'medio' | 'bajo';

export interface ResultadoEvaluacion {
  evaluacion_id: string;
  indice_hacer: number | null;
  indice_deber: number | null;
  semaforo_hacer: SemaforoNivel | null;
  semaforo_deber: SemaforoNivel | null;
  brecha_hacer: number | null;
  brecha_deber: number | null;
}

export interface AlertaResumen {
  id: string;
  tipo: string;
  severidad: 'info' | 'atencion' | 'critica';
  titulo: string;
  fecha_objetivo: string;
  estado: 'pendiente' | 'notificada' | 'resuelta' | 'vencida' | 'descartada';
  colaborador_id: string;
  colaborador_nombre?: string;
}

export type BloqueSaber =
  | 'formacion_academica'
  | 'habilidades_funcionales_tecnicas'
  | 'certificaciones'
  | 'experiencia';

export type EstadoVerificacionSaber = 'cumple' | 'cumple_parcial' | 'no_cumple_pendiente';

export interface VerificacionSaber {
  id: string;
  colaborador_id: string;
  ciclo_id: string | null;
  bloque: BloqueSaber;
  item_evaluado: string;
  estado: EstadoVerificacionSaber;
  evidencia_url: string | null;
  certificado_por: string | null;
  observaciones: string | null;
  fecha_verificacion: string;
}

export type TipoHojaVida = 'academica' | 'certificacion' | 'curso' | 'experiencia_laboral';

export interface HojaVidaFormacion {
  id: string;
  colaborador_id: string;
  tipo: TipoHojaVida;
  titulo: string;
  institucion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  fecha_vencimiento: string | null;
  documento_url: string | null;
  verificado: boolean;
  verificado_por: string | null;
}

export type BloqueSer = 'esencia' | 'emociones' | 'pertenencia_compromiso' | 'desafios';

export interface SerAspecto {
  id: string;
  bloque: BloqueSer;
  nombre: string;
  orden: number;
}

export interface GuiaDelFlow {
  id: string;
  colaborador_id: string;
  fecha_aplicacion: string;
  documento_pdf_url: string | null;
  origen_flow: string | null;
}

export interface SerPuntaje {
  id: string;
  guia_del_flow_id: string;
  aspecto_id: string;
  puntaje: number;
}

export interface SerComentarioColaborador {
  id: string;
  guia_del_flow_id: string;
  aspecto_id: string | null;
  colaborador_id: string;
  comentario: string;
}

export interface PlanDesarrolloItem {
  id: string;
  colaborador_id: string;
  origen: 'hacer' | 'deber' | 'saber' | 'ser' | 'mixto';
  brecha_detectada: string;
  accion: string;
  responsable_id: string | null;
  fecha_compromiso: string | null;
  estado: 'pendiente' | 'en_curso' | 'cumplido' | 'vencido';
  fecha_cumplimiento: string | null;
  evidencia_url: string | null;
  notas: string | null;
}
