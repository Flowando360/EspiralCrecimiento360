import type { ContextoBrief } from '@/lib/brief/contexto';

export interface CamposPerfilIntegral {
  hipotesis_ser: string;
  lectura_saber: string;
  lectura_hacer: string;
  lectura_deber: string;
  interpretacion: string;
  acciones: string;
}

export interface DatosPerfilIntegral {
  ctx: ContextoBrief;
  /** Saber en escala 1-5 (lineal desde el %), Hacer y Deber 1-5, índice integral 1-5. */
  integral: number | null;
  objetivos: { total: number; cerrados: number; porcentaje: number | null };
}

const fmt = (n: number | null | undefined) => (n == null ? null : String(n).replace('.', ','));

function nivelIndice(n: number | null): 'alto' | 'medio' | 'bajo' | null {
  if (n == null) return null;
  return n >= 4 ? 'alto' : n >= 3.5 ? 'medio' : 'bajo';
}

/**
 * Borrador automático (sin IA) del perfil integral, en el formato del modelo: lectura por dimensión, interpretación
 * integral y posibles acciones. Solo usa datos ya cruzados; el Ser aparece como hipótesis para conversar, nunca como
 * conclusión ni como explicación automática del desempeño.
 */
export function borradorPerfilIntegral({ ctx, integral, objetivos }: DatosPerfilIntegral): CamposPerfilIntegral {
  const nombre = ctx.colaborador.nombre.split(' ')[0];
  const { saber, desempeno } = ctx;

  // SER: hipótesis y recursos para conversar
  const fuertes = ctx.ser.fortalezas.map((f) => f.nombre);
  const acompanar = ctx.ser.aAcompanar.map((f) => f.nombre);
  const hipotesis_ser = !ctx.ser.disponible
    ? 'Aún no hay un esquema del Ser disponible para esta persona. Sin él no se formulan hipótesis del Ser.'
    : [
        fuertes.length ? `El esquema de su Ser apunta a recursos como ${fuertes.slice(0, 3).join(', ').toLowerCase()}.` : null,
        acompanar.length ? `Y a aspectos para acompañar como ${acompanar.slice(0, 2).join(', ').toLowerCase()}.` : null,
        !fuertes.length && !acompanar.length ? 'El esquema del Ser todavía no tiene rasgos marcados como «para aprovechar» o «para acompañar».' : null,
        'Son hipótesis y recursos para conversar sobre su desarrollo, no conclusiones ni una explicación de su desempeño.',
      ]
        .filter(Boolean)
        .join(' ');

  // SABER
  const lectura_saber =
    saber.cumplimiento == null
      ? 'Aún no hay una verificación de Saber para esta persona.'
      : `Cumple el ${fmt(saber.cumplimiento)} % del perfil del cargo (${saber.cumple} requisitos cumplidos, ${saber.parcial} parciales, ${saber.pendiente} pendientes).` +
        (saber.pendientes.length ? ` Pendiente: ${saber.pendientes.slice(0, 3).join('; ')}.` : '');

  const lecturaDim = (nombreDim: string, n: number | null, semaforo: string | null, brecha: number | null) => {
    if (n == null) return `Aún no hay resultado de ${nombreDim} para este ciclo.`;
    const nivel = nivelIndice(n);
    const texto =
      nivel === 'alto' ? 'un resultado destacado' : nivel === 'medio' ? 'un resultado adecuado, con oportunidades de mejora' : 'un resultado por debajo de lo esperado';
    const br =
      brecha == null
        ? ''
        : brecha < -0.5
          ? ' La persona se valoró por encima de como la ven los demás.'
          : brecha > 0.5
            ? ' La persona se valoró por debajo de como la ven los demás.'
            : ' Su autoevaluación y la mirada de los demás van en línea.';
    return `${nombreDim}: ${fmt(n)} (${semaforo ?? nivel}), ${texto}.${br}`;
  };
  const lectura_hacer = lecturaDim('Hacer', desempeno.indiceHacer, desempeno.semaforoHacer, desempeno.brechaHacer);
  const lectura_deber = lecturaDim('Deber', desempeno.indiceDeber, desempeno.semaforoDeber, desempeno.brechaDeber);

  // INTERPRETACIÓN INTEGRAL
  const nSaber = saber.cumplimiento == null ? null : saber.cumplimiento >= 80 ? 'alto' : saber.cumplimiento >= 60 ? 'medio' : 'bajo';
  const nHacer = nivelIndice(desempeno.indiceHacer);
  const nDeber = nivelIndice(desempeno.indiceDeber);
  const partes: string[] = [];
  if (nSaber === 'alto' && nHacer && nHacer !== 'alto') {
    partes.push(`${nombre} dispone de los conocimientos del cargo, pero todavía no convierte todo ese potencial en resultados consistentes. Conviene explorar si hay oportunidades de formación, herramientas, condiciones de trabajo, priorización, acompañamiento o ajustes en la asignación de responsabilidades.`);
  } else if (nSaber === 'bajo' && nHacer === 'bajo') {
    partes.push(`${nombre} tiene brechas de conocimiento y su aplicación en el trabajo también está por debajo de lo esperado: la formación y la práctica guiada son el primer frente de trabajo.`);
  } else if (nHacer === 'alto' && nSaber && nSaber !== 'alto') {
    partes.push(`${nombre} logra buenos resultados aunque su perfil de conocimientos aún tiene requisitos pendientes: vale la pena formalizar y certificar lo que ya sabe hacer.`);
  } else if (nHacer && nSaber) {
    partes.push(`Saber (${nSaber}) y Hacer (${nHacer}) van en una línea coherente.`);
  }
  if (nDeber === 'alto') partes.push('Asume sus responsabilidades y compromisos de manera destacada.');
  else if (nDeber === 'bajo') partes.push('Las responsabilidades y compromisos del cargo son el punto a conversar primero, con ejemplos concretos.');
  if (integral != null) partes.push(`El índice de desempeño integral es ${fmt(integral)} sobre 5.`);
  if (objetivos.porcentaje != null) partes.push(`Los objetivos concertados del ciclo se cumplieron en un ${objetivos.porcentaje} % (${objetivos.cerrados} de ${objetivos.total} cerrados).`);
  if (ctx.ser.disponible && fuertes.length) partes.push('Las fortalezas identificadas en el Ser pueden orientar una conversación sobre proyectos donde se apliquen; no permiten concluir por sí solas que el desempeño deba ser alto ni explican automáticamente las brechas de Hacer o Deber.');
  const interpretacion = partes.length ? partes.join(' ') : 'Todavía no hay datos suficientes para una lectura integral.';

  // POSIBLES ACCIONES
  const acciones: string[] = [];
  if (nHacer && nHacer !== 'alto') acciones.push('Revisar con la persona qué factores dificultan la consistencia, oportunidad o calidad de sus entregables.');
  if (nHacer && nHacer !== 'alto') acciones.push('Definir estándares de calidad y tiempos de entrega más explícitos.');
  if (saber.pendientes.length) acciones.push(`Cerrar los requisitos de Saber pendientes (${saber.pendientes.slice(0, 2).join('; ')}) con formación o práctica guiada.`);
  if (nDeber === 'bajo') acciones.push('Acordar compromisos claros y verificables de responsabilidad, con seguimiento corto.');
  if (ctx.ser.disponible && fuertes.length) acciones.push('Asignar un proyecto acotado donde pueda desplegar las fortalezas identificadas.');
  if (objetivos.total === 0) acciones.push('Concertar objetivos para el próximo ciclo antes de evaluar.');
  acciones.push('Acordar evidencias y una fecha de seguimiento.');

  return { hipotesis_ser, lectura_saber, lectura_hacer, lectura_deber, interpretacion, acciones: acciones.map((a) => `• ${a}`).join('\n') };
}
