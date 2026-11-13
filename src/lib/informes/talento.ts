import { crearNormalizadorAreas } from '@/lib/areas';

/**
 * Indicadores estratégicos de talento para el Consolidado Gerencial (informe de Luisa 6.7.1).
 * Todo agregado: ninguna fila identifica a una persona.
 */

export const ETIQUETAS_MOTIVO_SALIDA: Record<string, string> = {
  renuncia_voluntaria: 'Renuncia voluntaria',
  despido: 'Terminación por la empresa',
  fin_contrato: 'Vencimiento de contrato',
  mutuo_acuerdo: 'Mutuo acuerdo',
  jubilacion: 'Jubilación',
  otro: 'Otro',
  sin_motivo: 'Sin motivo registrado',
};

export const ETIQUETAS_TIPO_INCAPACIDAD: Record<string, string> = {
  enfermedad_general: 'Enfermedad general',
  accidente_laboral: 'Accidente laboral',
  enfermedad_laboral: 'Enfermedad laboral',
  licencia_maternidad: 'Licencia de maternidad',
  licencia_paternidad: 'Licencia de paternidad',
  otra: 'Otra',
};

export interface PersonaTalento {
  estado: string;
  fecha_ingreso: string | null;
  fecha_salida: string | null;
  motivo_salida: string | null;
  area: string | null;
}

export interface TalentoResumen {
  headcountPorArea: { area: string; total: number; enPrueba: number }[];
  totalVigentes: number;
  totalEnPrueba: number;
  rotacion: { salidas: number; tasaPct: number | null; porCausa: { causa: string; cantidad: number }[] };
  seleccion: { vacantesCerradas: number; diasPromedioCierre: number | null; contratadosEvaluables: number; superaronPrueba: number; pctSuperaPrueba: number | null };
  ausentismo: { dias: number; eventos: number; porTipo: { tipo: string; dias: number; eventos: number }[] } | null;
}

function diasEntre(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function calcularTalento(input: {
  personas: PersonaTalento[]; // incluye vigentes y quienes salieron (inactivo)
  vacantes: { estado: string; fecha_apertura: string; fecha_cierre: string | null }[];
  incapacidades: { tipo: string; dias: number; fecha_inicio: string }[] | null; // null = sin permiso para verlas
  desde: string;
  hasta: string;
}): TalentoResumen {
  const { personas, vacantes, incapacidades, desde, hasta } = input;
  const vigentes = personas.filter((p) => ['activo', 'periodo_prueba', 'en_proceso_salida'].includes(p.estado));
  const normalizar = crearNormalizadorAreas(vigentes.map((p) => p.area));
  const porArea = new Map<string, { total: number; enPrueba: number }>();
  for (const p of vigentes) {
    const a = normalizar(p.area) ?? 'Sin área asignada';
    const f = porArea.get(a) ?? { total: 0, enPrueba: 0 };
    f.total++;
    if (p.estado === 'periodo_prueba') f.enPrueba++;
    porArea.set(a, f);
  }

  const salieron = personas.filter((p) => p.fecha_salida && p.fecha_salida >= desde && p.fecha_salida <= hasta);
  const causas = new Map<string, number>();
  for (const p of salieron) causas.set(p.motivo_salida ?? 'sin_motivo', (causas.get(p.motivo_salida ?? 'sin_motivo') ?? 0) + 1);
  // Tasa = salidas / promedio entre quienes había al inicio (vigentes hoy - ingresos + salidas) y hoy; aproximación sencilla.
  const ingresaron = personas.filter((p) => p.fecha_ingreso && p.fecha_ingreso >= desde && p.fecha_ingreso <= hasta).length;
  const alInicio = Math.max(0, vigentes.length - ingresaron + salieron.length);
  const promedio = (alInicio + vigentes.length) / 2;

  const cerradas = vacantes.filter((v) => v.estado === 'cerrada' && v.fecha_cierre && v.fecha_cierre >= desde && v.fecha_cierre <= hasta);
  const dias = cerradas.map((v) => diasEntre(v.fecha_apertura, v.fecha_cierre!)).filter((d) => d >= 0);

  // Superar el período de prueba (aprox.): quienes ingresaron hace al menos 90 días y siguen vinculados pasados esos 90 días.
  const limite = new Date(hasta);
  limite.setDate(limite.getDate() - 90);
  const limiteIso = limite.toISOString().slice(0, 10);
  const evaluables = personas.filter((p) => p.fecha_ingreso && p.fecha_ingreso >= desde && p.fecha_ingreso <= limiteIso);
  const superaron = evaluables.filter((p) => !p.fecha_salida || diasEntre(p.fecha_ingreso!, p.fecha_salida) >= 90);

  let ausentismo: TalentoResumen['ausentismo'] = null;
  if (incapacidades) {
    const delPeriodo = incapacidades.filter((i) => i.fecha_inicio >= desde && i.fecha_inicio <= hasta);
    const porTipo = new Map<string, { dias: number; eventos: number }>();
    for (const i of delPeriodo) {
      const f = porTipo.get(i.tipo) ?? { dias: 0, eventos: 0 };
      f.dias += i.dias;
      f.eventos++;
      porTipo.set(i.tipo, f);
    }
    ausentismo = {
      dias: delPeriodo.reduce((a, i) => a + i.dias, 0),
      eventos: delPeriodo.length,
      porTipo: Array.from(porTipo.entries()).map(([tipo, v]) => ({ tipo, ...v })).sort((a, b) => b.dias - a.dias),
    };
  }

  return {
    headcountPorArea: Array.from(porArea.entries()).map(([area, v]) => ({ area, ...v })).sort((a, b) => b.total - a.total),
    totalVigentes: vigentes.length,
    totalEnPrueba: vigentes.filter((p) => p.estado === 'periodo_prueba').length,
    rotacion: {
      salidas: salieron.length,
      tasaPct: promedio > 0 ? Math.round((salieron.length / promedio) * 1000) / 10 : null,
      porCausa: Array.from(causas.entries()).map(([causa, cantidad]) => ({ causa, cantidad })).sort((a, b) => b.cantidad - a.cantidad),
    },
    seleccion: {
      vacantesCerradas: cerradas.length,
      diasPromedioCierre: dias.length ? Math.round(dias.reduce((a, b) => a + b, 0) / dias.length) : null,
      contratadosEvaluables: evaluables.length,
      superaronPrueba: superaron.length,
      pctSuperaPrueba: evaluables.length ? Math.round((superaron.length / evaluables.length) * 100) : null,
    },
    ausentismo,
  };
}
