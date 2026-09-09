import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Convierte un string "YYYY-MM-DD" (columna DATE de Postgres, sin hora) en un
 * Date de medianoche *local* — en vez de dejar que `new Date(string)` lo
 * interprete como medianoche UTC, que en Colombia (UTC-5) se muestra un día
 * antes de la fecha real al renderizar en el navegador del usuario.
 */
function parsearFechaLocal(fecha: string): Date {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return new Date(anio!, mes! - 1, dia!);
}

/** Colombia: formatea fechas en formato largo local, ej. "16 de julio de 2026" */
export function formatearFecha(fecha: string | Date): string {
  if (typeof fecha === 'string' && SOLO_FECHA.test(fecha)) {
    return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).format(
      parsearFechaLocal(fecha)
    );
  }
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Bogota',
  }).format(d);
}

export function diasHasta(fecha: string | Date): number {
  let d: Date;
  if (typeof fecha === 'string') {
    d = SOLO_FECHA.test(fecha) ? parsearFechaLocal(fecha) : new Date(fecha);
  } else {
    d = new Date(fecha.getTime());
  }
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatearCOP(valor: number): string {
  return `$ ${Math.round(valor).toLocaleString('es-CO')}`;
}

export function formatearTamanoArchivo(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** El apodo/diminutivo que la persona eligió, o si no fijó ninguno, su primer nombre. */
export function nombreParaSaludo(nombreCompleto: string, nombrePreferido?: string | null): string {
  return nombrePreferido?.trim() || nombreCompleto.trim().split(' ')[0] || nombreCompleto;
}

const CARACTERES_PASSWORD = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

/** Contraseña temporal legible (sin caracteres ambiguos como 0/O o 1/l/I). */
export function generarPassword(): string {
  let resultado = '';
  for (let i = 0; i < 10; i++) {
    resultado += CARACTERES_PASSWORD[Math.floor(Math.random() * CARACTERES_PASSWORD.length)];
  }
  return resultado;
}

function quitarAcentos(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Sugiere el "usuario" de login (primernombre.primerapellido) a partir del
 * nombre completo — independiente de cuál sea el correo real de la cuenta.
 * Asume el patrón colombiano [nombre(s)] [apellido1] [apellido2]: toma el
 * primer token como nombre, y el penúltimo como apellido — salvo que solo
 * haya 2 tokens (nombre + un solo apellido, sin segundo nombre ni segundo
 * apellido), caso en el que el apellido es el último token, no el primero.
 */
export function usuarioSugerido(nombreCompleto: string): string {
  const tokens = nombreCompleto.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return '';
  const nombre1 = quitarAcentos(tokens[0]!).toLowerCase().replace(/[^a-z0-9]/g, '');
  const apellidoToken = tokens.length >= 3 ? tokens[tokens.length - 2]! : tokens[tokens.length - 1]!;
  const apellido1 = quitarAcentos(apellidoToken).toLowerCase().replace(/[^a-z0-9]/g, '');
  return apellido1 && apellido1 !== nombre1 ? `${nombre1}.${apellido1}` : nombre1;
}

export const etiquetaRol: Record<string, string> = {
  admin_th: 'Talento Humano',
  lider: 'Líder',
  colaborador: 'Colaborador',
  gerencia: 'Gerencia',
  auditor_externo: 'Auditor externo',
};

export const etiquetaSemaforo: Record<string, string> = {
  alto: 'Alto',
  medio: 'Medio',
  bajo: 'Bajo',
};
