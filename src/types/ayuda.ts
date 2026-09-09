export interface CampoOBoton {
  nombre: string;
  explicacion: string;
}

export interface PaginaAyuda {
  /** Slug único dentro del módulo, usado en la URL /ayuda/modulo/[slug]/[pagina]. */
  slug: string;
  /**
   * Patrón de la ruta real en la app, con "*" en cada segmento dinámico
   * (ej. "/espiral-crecimiento/colaboradores/*" para la ficha de una persona).
   * Se usa para mostrar la ayuda contextual de la pantalla en la que estás.
   */
  ruta: string;
  titulo: string;
  resumen: string;
  camposYBotones?: CampoOBoton[];
  proceso?: string[];
  notas?: string[];
}

export interface ModuloAyuda {
  slug: string;
  titulo: string;
  descripcion: string;
  paginas: PaginaAyuda[];
}

export interface PreguntaFrecuente {
  pregunta: string;
  respuesta: string;
}

export interface TerminoGlosario {
  termino: string;
  definicion: string;
}

export interface PasoPrueba {
  paso: string;
  resultadoEsperado: string;
}

export interface EscenarioPrueba {
  titulo: string;
  rolNecesario: string;
  pasos: PasoPrueba[];
}

export interface SeccionPlanPruebas {
  modulo: string;
  escenarios: EscenarioPrueba[];
}
