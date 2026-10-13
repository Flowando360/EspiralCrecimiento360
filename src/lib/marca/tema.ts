/**
 * Tema por empresa: a partir de los colores de marca de la empresa se generan
 * las variables CSS que usan las clases de Tailwind (flow-*, secundario, acento,
 * barra). Cada variable se guarda en formato "R G B" para que Tailwind pueda
 * aplicar opacidad con rgb(var(--x) / <alpha-value>).
 */

/** Paleta original de la copia: es el tema por defecto si una empresa no define colores. */
export const PALETA_BASE = {
  marca: '#16a34a',
  secundario: '#1E3A8A',
  acento: '#A3E635',
  barra: '#0F1F52',
};

const HEX = /^#?([0-9a-f]{6})$/i;

function aRgb(hex: string): [number, number, number] {
  const digitos = HEX.exec(hex.trim())?.[1];
  if (!digitos) throw new Error(`Color inválido: ${hex}`);
  const n = parseInt(digitos, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function aHex(rgb: [number, number, number]): string {
  return '#' + rgb.map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('');
}

/** Mezcla un color con otro: t=0 es el primero, t=1 es el segundo. */
function mezclar(a: string, b: string, t: number): string {
  const ra = aRgb(a);
  const rb = aRgb(b);
  const [ar, ag, ab] = ra;
  const [br, bg, bb] = rb;
  return aHex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]);
}

/** Escala de 10 tonos (50 → 900) partiendo del color de marca como tono 500. */
export function escalaDesde(base: string): Record<string, string> {
  return {
    50: mezclar(base, '#ffffff', 0.95),
    100: mezclar(base, '#ffffff', 0.85),
    200: mezclar(base, '#ffffff', 0.7),
    300: mezclar(base, '#ffffff', 0.5),
    400: mezclar(base, '#ffffff', 0.25),
    500: base,
    600: mezclar(base, '#000000', 0.12),
    700: mezclar(base, '#000000', 0.25),
    800: mezclar(base, '#000000', 0.4),
    900: mezclar(base, '#000000', 0.55),
  };
}

function canal(hex: string): string {
  return aRgb(hex).join(' ');
}

/** Variables CSS para una empresa. Los colores inválidos caen al valor base. */
export function variablesDeMarca(marca: { colorMarca?: string | null; colorSecundario?: string | null; colorAcento?: string | null }): Record<string, string> {
  const valido = (c: string | null | undefined, fallback: string) => (c && HEX.test(c.trim()) ? c.trim() : fallback);
  const marcaPrincipal = valido(marca.colorMarca, PALETA_BASE.marca);
  const secundario = valido(marca.colorSecundario, PALETA_BASE.secundario);
  const acento = valido(marca.colorAcento, PALETA_BASE.acento);

  const variables: Record<string, string> = {};
  for (const [tono, hex] of Object.entries(escalaDesde(marcaPrincipal))) variables[`--flow-${tono}`] = canal(hex);
  variables['--secundario'] = canal(secundario);
  variables['--acento'] = canal(acento);
  variables['--barra'] = canal(mezclar(secundario, '#000000', 0.35));
  return variables;
}

/** Bloque CSS listo para inyectar en la página. */
export function css(variables: Record<string, string>): string {
  return ':root{' + Object.entries(variables).map(([k, v]) => `${k}:${v};`).join('') + '}';
}
