export type CategoriaInduccion =
  | 'proposito_organizacional'
  | 'funciones'
  | 'riesgos_sst'
  | 'epp'
  | 'examenes_medicos'
  | 'formacion'
  | 'otro';

export interface ItemInduccionGenerado {
  categoria: CategoriaInduccion;
  titulo: string;
  descripcion: string | null;
}

/**
 * Deriva los puntos de inducción específicos de un cargo a partir de lo que
 * ya trae su perfil (funciones, riesgos, EPP, exámenes de ingreso, formación
 * mínima, objetivo del cargo) — nada de esto se inventa, solo se reformula
 * como puntos verificables de un checklist de inducción.
 */
export function generarItemsEspecificos(cargo: {
  objetivo_cargo: string | null;
  formacion_minima_induccion: string | null;
  funciones: { funcion: string }[];
  riesgos: { factor: string; categoria: string }[];
  epp: { item: string }[];
  examenesIngreso: { nombre_examen: string }[];
}): ItemInduccionGenerado[] {
  const items: ItemInduccionGenerado[] = [];

  if (cargo.objetivo_cargo) {
    items.push({ categoria: 'otro', titulo: 'Conoce el objetivo de su cargo', descripcion: cargo.objetivo_cargo });
  }

  if (cargo.formacion_minima_induccion) {
    items.push({ categoria: 'formacion', titulo: 'Formación mínima del cargo', descripcion: cargo.formacion_minima_induccion });
  }

  for (const f of cargo.funciones) {
    items.push({ categoria: 'funciones', titulo: `Instruido en: ${f.funcion}`, descripcion: null });
  }

  for (const r of cargo.riesgos) {
    items.push({
      categoria: 'riesgos_sst',
      titulo: `Conoce el riesgo ${r.categoria.replace(/_/g, ' ')} de su puesto`,
      descripcion: r.factor,
    });
  }

  for (const e of cargo.epp) {
    items.push({ categoria: 'epp', titulo: `Recibió y sabe usar: ${e.item}`, descripcion: null });
  }

  for (const ex of cargo.examenesIngreso) {
    items.push({ categoria: 'examenes_medicos', titulo: `Realizó examen médico de ingreso: ${ex.nombre_examen}`, descripcion: null });
  }

  return items;
}

/**
 * Deriva los puntos de inducción comunes a toda la empresa a partir de la
 * Identidad Organizacional (propósito, visión, creencias, principios,
 * valores) — se generan una sola vez y aplican a cualquier cargo.
 */
export function generarItemsComunes(identidad: {
  proposito_superior: string | null;
  vision: string | null;
  declaracion_creencias: string | null;
  principios: { nombre: string; descripcion: string | null }[];
  valores: { nombre: string; descripcion: string | null }[];
}): ItemInduccionGenerado[] {
  const items: ItemInduccionGenerado[] = [];

  if (identidad.proposito_superior) {
    items.push({ categoria: 'proposito_organizacional', titulo: 'Conoce el propósito superior de la empresa', descripcion: identidad.proposito_superior });
  }
  if (identidad.vision) {
    items.push({ categoria: 'proposito_organizacional', titulo: 'Conoce la visión de la empresa', descripcion: identidad.vision });
  }
  if (identidad.declaracion_creencias) {
    items.push({ categoria: 'proposito_organizacional', titulo: 'Conoce en qué cree la organización', descripcion: identidad.declaracion_creencias });
  }
  for (const p of identidad.principios) {
    items.push({ categoria: 'proposito_organizacional', titulo: `Principio: ${p.nombre}`, descripcion: p.descripcion });
  }
  for (const v of identidad.valores) {
    items.push({ categoria: 'proposito_organizacional', titulo: `Valor: ${v.nombre}`, descripcion: v.descripcion });
  }

  return items;
}
