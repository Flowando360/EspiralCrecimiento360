import type { CategoriaCriterio, TipoCriterio } from './match';

// Convierte el perfil de cargo existente en criterios de evaluación de la vacante.
// No duplica el perfil: copia sus requisitos en el momento de crear la vacante,
// junto con la versión del perfil, para que el historial siga siendo explicable.

/** Pesos iniciales por bloque (requerimiento §10.3). Son una propuesta para configurar, no una norma. */
export const PESO_POR_CATEGORIA: Record<CategoriaCriterio, number> = {
  formacion: 15,
  experiencia: 30,
  competencia_tecnica: 25,
  competencia_conductual: 15,
  certificacion_idioma: 10,
  requisito_adicional: 5,
};

export interface PerfilCargoParaCriterios {
  id: string;
  nombre: string;
  formacion_nivel: string | null;
  formacion_titulo_especifico: string | null;
  experiencia_minima_meses: number | null;
  competencias_cardinales: string | null;
  version: string;
}

export interface HabilidadCargoParaCriterios {
  id: string;
  tipo: 'funcional' | 'tecnica';
  nombre: string;
  nivel_esperado: 'bajo' | 'medio' | 'alto';
}

export interface CriterioNuevo {
  origen: 'perfil';
  cargo_habilidad_id: string | null;
  categoria: CategoriaCriterio;
  tipo: TipoCriterio;
  descripcion: string;
  valor_requerido: string | null;
  nivel_requerido: 'basico' | 'intermedio' | 'avanzado' | null;
  meses_requeridos: number | null;
  peso: number;
  perfil_version: string;
}

const NIVEL_HABILIDAD: Record<HabilidadCargoParaCriterios['nivel_esperado'], 'basico' | 'intermedio' | 'avanzado'> = {
  bajo: 'basico',
  medio: 'intermedio',
  alto: 'avanzado',
};

/** Traduce el valor de formacion_nivel del perfil al nivel que entiende el motor. Sin requisito → null. */
export function nivelFormacionRequerido(valor: string | null): string | null {
  if (!valor || valor === 'ninguno' || valor === 'empirico') return null;
  return valor;
}

/** Criterios propuestos para un perfil. El peso de cada bloque se reparte entre sus criterios. */
export function criteriosDesdePerfil(perfil: PerfilCargoParaCriterios, habilidades: HabilidadCargoParaCriterios[]): CriterioNuevo[] {
  const borradores: Omit<CriterioNuevo, 'origen' | 'perfil_version' | 'peso'>[] = [];

  const nivel = nivelFormacionRequerido(perfil.formacion_nivel);
  if (nivel) {
    borradores.push({
      cargo_habilidad_id: null,
      categoria: 'formacion',
      tipo: 'obligatorio',
      descripcion: `Formación ${nivel}`,
      valor_requerido: nivel,
      nivel_requerido: null,
      meses_requeridos: null,
    });
  }
  if (perfil.formacion_titulo_especifico?.trim()) {
    borradores.push({
      cargo_habilidad_id: null,
      categoria: 'formacion',
      tipo: 'deseable',
      descripcion: `Formación en: ${perfil.formacion_titulo_especifico.trim()}`,
      valor_requerido: perfil.formacion_titulo_especifico.trim(),
      nivel_requerido: null,
      meses_requeridos: null,
    });
  }
  if (perfil.experiencia_minima_meses && perfil.experiencia_minima_meses > 0) {
    borradores.push({
      cargo_habilidad_id: null,
      categoria: 'experiencia',
      tipo: 'obligatorio',
      descripcion: `Experiencia mínima de ${Math.round(perfil.experiencia_minima_meses / 12)} año(s)`,
      valor_requerido: null,
      nivel_requerido: null,
      meses_requeridos: perfil.experiencia_minima_meses,
    });
  }
  for (const h of habilidades) {
    const esAlta = h.nivel_esperado === 'alto';
    borradores.push({
      cargo_habilidad_id: h.id,
      categoria: h.tipo === 'tecnica' ? 'competencia_tecnica' : 'competencia_conductual',
      tipo: esAlta ? 'obligatorio' : 'deseable',
      descripcion: `${h.tipo === 'tecnica' ? 'Técnica' : 'Funcional'}: ${h.nombre} (nivel ${h.nivel_esperado})`,
      valor_requerido: h.nombre,
      nivel_requerido: NIVEL_HABILIDAD[h.nivel_esperado],
      meses_requeridos: null,
    });
  }
  for (const competencia of (perfil.competencias_cardinales ?? '').split(/[,;\n]/).map((c) => c.trim()).filter(Boolean)) {
    borradores.push({
      cargo_habilidad_id: null,
      categoria: 'competencia_conductual',
      tipo: 'deseable',
      descripcion: `Competencia cardinal: ${competencia}`,
      valor_requerido: competencia,
      nivel_requerido: null,
      meses_requeridos: null,
    });
  }

  const cantidadPorCategoria = new Map<CategoriaCriterio, number>();
  for (const b of borradores) cantidadPorCategoria.set(b.categoria, (cantidadPorCategoria.get(b.categoria) ?? 0) + 1);

  return borradores.map((b) => ({
    ...b,
    origen: 'perfil' as const,
    perfil_version: perfil.version,
    peso: Math.round((PESO_POR_CATEGORIA[b.categoria] / (cantidadPorCategoria.get(b.categoria) ?? 1)) * 100) / 100,
  }));
}
