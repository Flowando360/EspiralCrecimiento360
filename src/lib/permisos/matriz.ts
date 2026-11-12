import { NAV } from '@/lib/permisos/menu';
import type { RolUsuario } from '@/types/colaborador';

/**
 * Matriz de roles y permisos del sistema (informe de pruebas, 7.4: «documentar y publicar la matriz
 * de roles y permisos con la lista exacta de accesos de cada uno»). Se arma a partir del mismo menú
 * que usa la aplicación, así nunca queda desactualizada respecto a lo que cada rol ve.
 */
export const ROLES_SISTEMA: { value: RolUsuario; label: string }[] = [
  { value: 'admin_th', label: 'Administrador de Talento Humano' },
  { value: 'gerencia', label: 'Gerencia' },
  { value: 'lider', label: 'Líder' },
  { value: 'colaborador', label: 'Colaborador' },
  { value: 'auditor_externo', label: 'Auditor externo' },
];

export interface FilaMatriz {
  grupo: string;
  pantalla: string;
  ruta: string;
  roles: Record<string, boolean>;
}

export function filasMatrizRoles(): FilaMatriz[] {
  const filas: FilaMatriz[] = [];
  for (const g of NAV) {
    for (const item of g.items) {
      if (item.href.startsWith('http')) continue; // enlaces externos (Ludo Retos)
      filas.push({
        grupo: g.titulo || 'General',
        pantalla: item.label,
        ruta: item.href,
        roles: Object.fromEntries(ROLES_SISTEMA.map((r) => [r.value, item.roles.includes(r.value)])),
      });
    }
  }
  return filas;
}

/** Lo que cada rol de sistema puede hacer dentro de las pantallas, en palabras (no se deduce del menú). */
export const ALCANCE_POR_ROL: Record<string, string> = {
  admin_th: 'Ve y gestiona toda la empresa: crea, edita y elimina. Es el único que administra usuarios, roles, cargos y configuración. Con un rol personalizado sin «Administración» opera Talento Humano sin poder cambiar permisos ni configuración.',
  gerencia: 'Consulta el panorama de la empresa (colaboradores, indicadores, informes, procesos) sin modificar datos de Talento Humano.',
  lider: 'Ve y valora a su equipo directo; participa en los módulos de cultura y formación. No administra la empresa.',
  colaborador: 'Ve y gestiona lo propio: su perfil, su Plan de Desarrollo, su formación y la participación en Nexa. No ve datos de otras personas.',
  auditor_externo: 'Solo lectura de lo necesario para una auditoría: nombre y cargo de los colaboradores, certificaciones y la evidencia de auditoría. Sin acceso a más módulos.',
};
