import type { AccionPropuesta, Clasificacion, EstadoReto, TipoDesperdicio } from '@/lib/nexa/makigami';

export interface RetoVista {
  id: string;
  titulo: string;
  descripcion: string | null;
  procesoId: string | null;
  procesoNombre: string | null;
  inicioProceso: string | null;
  finProceso: string | null;
  estado: EstadoReto;
  fechaLimite: string | null;
}

export interface CarrilVista {
  id: string;
  nombre: string;
  orden: number;
}

export interface PasoVista {
  id: string;
  carril_id: string;
  orden: number;
  descripcion: string;
  tiempo_trabajo_min: number;
  tiempo_espera_min: number;
  documento_sistema: string | null;
  clasificacion: Clasificacion | null;
}

export interface CazaVista {
  id: string;
  paso_id: string;
  colaborador_id: string;
  colaborador_nombre: string;
  tipo_desperdicio: TipoDesperdicio;
  comentario: string | null;
  created_at: string;
}

export interface PropuestaVista {
  id: string;
  paso_id: string | null;
  colaborador_id: string;
  colaborador_nombre: string;
  accion: AccionPropuesta;
  descripcion: string;
  ahorro_estimado_min: number;
  estado: 'propuesta' | 'aprobada' | 'descartada';
  acpm_id: string | null;
  acpm_codigo: string | null;
  votos: string[];
}

export interface Hallazgo {
  pasoId: string;
  tipo: TipoDesperdicio;
  cazas: CazaVista[];
  pioneroId: string;
  validado: boolean;
}
