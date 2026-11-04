import type { ContextoBrief, ItemEval } from './contexto';

export interface CamposBrief {
  talento_central: string;
  resumen_ser: string;
  resumen_saber: string;
  resumen_hacer: string;
  resumen_deber: string;
  sugerencias_enfoque: string;
}

const SEMAFORO: Record<string, string> = { alto: 'alto', medio: 'medio', bajo: 'bajo' };
const lista = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`);
const n1 = (v: number | null) => (v == null ? '—' : String(v));

/** Nota "de los demás": lo que puso el líder y el promedio de pares/colaboradores. */
const notaOtros = (i: ItemEval) => {
  const v = [i.lider, i.terceros].filter((x): x is number => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

function resumenDimension(ctx: ContextoBrief, dim: 'hacer' | 'deber'): string {
  const d = ctx.desempeno;
  const indice = dim === 'hacer' ? d.indiceHacer : d.indiceDeber;
  const semaforo = dim === 'hacer' ? d.semaforoHacer : d.semaforoDeber;
  const brecha = dim === 'hacer' ? d.brechaHacer : d.brechaDeber;
  const nombre = dim === 'hacer' ? 'Hacer' : 'Deber';
  const items = d.items.filter((i) => i.dimension === dim && notaOtros(i) != null);
  if (indice == null && items.length === 0) return `Todavía no hay valoraciones enviadas para ${nombre}${ctx.ciclo ? ` en el ciclo ${ctx.ciclo}` : ''}.`;

  const partes: string[] = [];
  partes.push(
    `${nombre}: índice ${n1(indice)}${semaforo ? ` (semáforo ${SEMAFORO[semaforo] ?? semaforo})` : ''}${ctx.ciclo ? ` en el ciclo ${ctx.ciclo}` : ''}.`
  );
  const orden = [...items].sort((a, b) => (notaOtros(b) ?? 0) - (notaOtros(a) ?? 0));
  const fuertes = orden.filter((i) => (notaOtros(i) ?? 0) >= 4).slice(0, 3);
  const debiles = [...orden].reverse().filter((i) => (notaOtros(i) ?? 5) < 3.5).slice(0, 3);
  if (fuertes.length) partes.push(`Lo más fuerte: ${lista(fuertes.map((i) => `${i.titulo} (${(notaOtros(i) as number).toFixed(1)})`))}.`);
  if (debiles.length) partes.push(`Por mejorar: ${lista(debiles.map((i) => `${i.titulo} (${(notaOtros(i) as number).toFixed(1)})`))}.`);
  if (brecha != null && Math.abs(brecha) >= 0.3) {
    partes.push(
      brecha < 0
        ? `La persona se valoró más alto de lo que la ven los demás (diferencia de ${Math.abs(brecha).toFixed(1)} puntos): conviene conversar cómo percibe su propio desempeño.`
        : `La persona se valoró más bajo de lo que la ven los demás (diferencia de ${brecha.toFixed(1)} puntos): reconócele lo que sí se ve en ella.`
    );
  }
  return partes.join(' ');
}

/** Borrador automático: cruza Ser, Saber, Hacer y Deber sin inventar nada que no esté en los datos. */
export function redactarBorrador(ctx: ContextoBrief): CamposBrief {
  const { ser, saber, desempeno } = ctx;

  // ── Talento central: lo más fuerte entre Ser y desempeño ──
  const fuertesSer = ser.fortalezas.slice(0, 2).map((f) => f.nombre);
  const mejores = desempeno.items
    .filter((i) => notaOtros(i) != null)
    .sort((a, b) => (notaOtros(b) ?? 0) - (notaOtros(a) ?? 0))
    .filter((i) => (notaOtros(i) ?? 0) >= 4)
    .slice(0, 2)
    .map((i) => i.titulo);
  const talento: string[] = [];
  if (fuertesSer.length) talento.push(`En su Ser destacan ${lista(fuertesSer)}`);
  if (mejores.length) talento.push(`en el desempeño sobresale ${lista(mejores)}`);
  const talento_central = talento.length
    ? `${talento.join(', y ')}. Empieza la conversación reconociendo esto.`
    : 'Aún no hay suficientes datos para señalar un talento central; empieza preguntándole qué siente que hace mejor.';

  // ── Ser ──
  let resumen_ser: string;
  if (!ser.disponible) {
    resumen_ser = 'Esta persona todavía no tiene Guía del Flow. Puedes invitarla desde su ficha → Guía del Flow para completar su Ser antes de la próxima retroalimentación.';
  } else {
    const p: string[] = [`Guía del Flow aplicada el ${ser.fecha}.`];
    if (ser.fortalezas.length) p.push(`Aspectos más fuertes: ${lista(ser.fortalezas.map((f) => `${f.nombre} (${f.puntaje}/5)`))}.`);
    if (ser.aAcompanar.length) p.push(`Aspectos que conviene acompañar: ${lista(ser.aAcompanar.map((f) => `${f.nombre} (${f.puntaje}/5)`))}.`);
    if (ser.informeLider) {
      const limpio = ser.informeLider
        .replace(/^#+\s*.*$/gm, ' ')
        .replace(/[*_`>#]/g, '')
        .replace(/^\s*[-•]\s+/gm, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (limpio) p.push(limpio.slice(0, 380).replace(/\s\S*$/, '') + '…');
    }
    resumen_ser = p.join(' ');
  }

  // ── Saber ──
  const ps: string[] = [];
  if (saber.cumplimiento != null) {
    ps.push(
      `Cumple el ${saber.cumplimiento}% del perfil de su cargo (${saber.cumple} ítems cumplen, ${saber.parcial} parcialmente y ${saber.pendiente} están pendientes).`
    );
  } else {
    ps.push('Aún no se ha verificado el Saber contra el perfil del cargo.');
  }
  if (saber.pendientes.length) ps.push(`Pendiente por cerrar: ${lista(saber.pendientes.slice(0, 3))}.`);
  const vencidas = saber.certificaciones.filter((c) => c.dias < 0);
  const porVencer = saber.certificaciones.filter((c) => c.dias >= 0);
  if (vencidas.length) ps.push(`Certificaciones vencidas: ${lista(vencidas.map((c) => c.titulo))}.`);
  if (porVencer.length) ps.push(`Certificaciones por vencer: ${lista(porVencer.map((c) => `${c.titulo} (en ${c.dias} días)`))}.`);
  if (saber.formacion.length) ps.push(`Formación en su hoja de vida: ${lista(saber.formacion)}.`);
  if (saber.cursosCompletados.length) ps.push(`Cursos completados: ${lista(saber.cursosCompletados.slice(0, 4))}.`);
  if (saber.cursosEnCurso.length) ps.push(`En curso: ${lista(saber.cursosEnCurso.slice(0, 3).map((c) => `${c.titulo} (${Math.round(c.progreso)}%)`))}.`);
  const resumen_saber = ps.join(' ');

  const resumen_hacer = resumenDimension(ctx, 'hacer');
  const resumen_deber = resumenDimension(ctx, 'deber');

  // ── Sugerencias de enfoque ──
  const s: string[] = ['Abre reconociendo lo que la persona hace bien.'];
  const bajoHacer = desempeno.semaforoHacer === 'bajo';
  const bajoDeber = desempeno.semaforoDeber === 'bajo';
  if (bajoHacer || bajoDeber) s.push(`Prioriza ${bajoHacer && bajoDeber ? 'Hacer y Deber' : bajoHacer ? 'Hacer' : 'Deber'}, donde el semáforo está en bajo, y acuerden una acción concreta en el plan de desarrollo.`);
  const ciegos = [desempeno.brechaHacer, desempeno.brechaDeber].some((b) => b != null && b <= -0.3);
  if (ciegos) s.push('Pregúntale cómo se ve a sí misma antes de mostrarle cómo la ven los demás: hay diferencia entre su autoevaluación y la de su entorno.');
  if (saber.certificaciones.length || saber.pendiente > 0) s.push('Revisa en Saber lo pendiente o por vencer y acuerden fechas para cerrarlo (un curso o una certificación).');
  if (ser.aAcompanar.length) s.push('Conecta el acompañamiento con su Ser: apóyate en sus fortalezas para trabajar los aspectos que más necesita.');
  if (ctx.planesAbiertos > 0) s.push(`Retoma primero los ${ctx.planesAbiertos} planes de desarrollo que siguen abiertos.`);
  s.push('Cierra con el Acuerdo de crecimiento: un compromiso de la persona y uno de la empresa que puedan cumplirse.');

  return { talento_central, resumen_ser, resumen_saber, resumen_hacer, resumen_deber, sugerencias_enfoque: s.join(' ') };
}
