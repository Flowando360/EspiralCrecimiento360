import {
  Award,
  BarChart3,
  Bot,
  CalendarCheck,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  Compass,
  Crosshair,
  DatabaseBackup,
  FileArchive,
  FileBarChart,
  FileStack,
  Gavel,
  GitPullRequestArrow,
  GraduationCap,
  Handshake,
  Heart,
  HeartHandshake,
  Home,
  LayoutGrid,
  ListChecks,
  Megaphone,
  Network,
  NotebookPen,
  RefreshCw,
  Rss,
  Scale,
  ScrollText,
  Send,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Shirt,
  Sparkles,
  Target,
  TrendingUp,
  User,
  UserRoundCog,
  UserSearch,
  Users,
  Users2,
  Wallet,
} from 'lucide-react';
import type { RolUsuario } from '@/types/colaborador';
import type { Modulo } from '@/lib/supabase/get-perfil-actual';

/** Estructura del menú: la usan la barra superior y la matriz de roles y permisos (una sola fuente de verdad). */
export type FasePhva = 'Planear' | 'Hacer' | 'Verificar' | 'Actuar';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: RolUsuario[];
  /** Módulo de permisos si difiere del grupo (ej. Dotaciones dentro de Administración). */
  modulo?: Modulo;
  /** Solo para el desplegable de Procesos y Cumplimiento: agrupa visualmente
   * sus módulos bajo el ciclo PHVA. Sin este campo, el ítem se muestra suelto
   * antes de los grupos de fase (p. ej. la página resumen del módulo). */
  fase?: FasePhva;
}

export const ORDEN_FASES: FasePhva[] = ['Planear', 'Hacer', 'Verificar', 'Actuar'];

export function agruparPorFase(items: NavItem[]): { fase: FasePhva | null; items: NavItem[] }[] {
  const sinFase = items.filter((item) => !item.fase);
  const grupos = ORDEN_FASES.map((fase) => ({ fase, items: items.filter((item) => item.fase === fase) })).filter(
    (g) => g.items.length > 0
  );
  return sinFase.length > 0 ? [{ fase: null, items: sinFase }, ...grupos] : grupos;
}

export interface NavGroup {
  /** Vacío = no es un grupo, es un ítem suelto (se renderiza directo, sin desplegable). */
  titulo: string;
  /** Módulo que controla la visibilidad del grupo con un rol personalizado. */
  modulo: Modulo;
  /** Etiqueta corta para el botón del desplegable en escritorio, cuando "titulo" es
   * más largo de lo que cabe cómodo en la barra — el desplegable en sí sigue
   * usando los nombres completos de cada página. */
  tituloCorto?: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  { titulo: '', modulo: 'inicio', items: [{ href: '/inicio', label: 'Inicio', icon: Home, roles: ['admin_th', 'lider', 'colaborador', 'gerencia', 'auditor_externo'] }] },
  { titulo: '', modulo: 'mi_perfil', items: [{ href: '/mi-perfil', label: 'Mi Perfil', icon: User, roles: ['admin_th', 'lider', 'colaborador', 'gerencia'] }] },
  {
    titulo: 'Espiral de Crecimiento 360°',
    modulo: 'espiral_360',
    tituloCorto: 'Espiral 360°',
    items: [
      { href: '/espiral-crecimiento/colaboradores', label: 'Colaboradores', icon: Users, roles: ['admin_th', 'lider', 'gerencia'] },
      { href: '/espiral-crecimiento/externos', label: 'Externos', icon: UserRoundCog, roles: ['admin_th', 'lider', 'gerencia'] },
      { href: '/espiral-crecimiento/movilidad', label: 'Movilidad interna', icon: TrendingUp, roles: ['admin_th'] },
      { href: '/espiral-crecimiento/dimensiones', label: 'Dimensiones', icon: LayoutGrid, roles: ['admin_th', 'lider', 'gerencia'] },
      { href: '/espiral-crecimiento/ciclos', label: 'Ciclos de Crecimiento', icon: CalendarClock, roles: ['admin_th', 'lider'] },
      { href: '/espiral-crecimiento/pdi', label: 'Planes de Desarrollo', icon: Target, roles: ['admin_th', 'lider', 'colaborador'] },
      { href: '/espiral-crecimiento/organigrama', label: 'Organigrama', icon: Network, roles: ['admin_th', 'lider', 'gerencia'] },
      { href: '/espiral-crecimiento/indicadores', label: 'Indicadores', icon: BarChart3, roles: ['admin_th', 'lider', 'gerencia'] },
      { href: '/nexa/formacion', label: 'Formación individual', icon: GraduationCap, roles: ['admin_th', 'lider', 'colaborador'] },
      { href: '/nexa/reconocimientos', label: 'Reconocimientos', icon: Award, roles: ['admin_th', 'lider', 'colaborador', 'gerencia'] },
      { href: '/nexa/clima', label: 'Clima Organizacional', icon: HeartHandshake, roles: ['admin_th', 'lider', 'colaborador', 'gerencia'] },
      { href: '/administracion/guias-flow', label: 'Guías del Flow', icon: Send, roles: ['admin_th'] },
      { href: '/administracion/sincronizaciones-guia-flow', label: 'Sincronizaciones Guía del Flow', icon: RefreshCw, roles: ['admin_th'] },
    ],
  },
  {
    titulo: 'Reclutamiento y selección',
    modulo: 'reclutamiento',
    items: [
      { href: '/reclutamiento', label: 'Reclutamiento y Selección', icon: UserSearch, roles: ['admin_th', 'lider'] },
      { href: '/reclutamiento/candidatos', label: 'Banco de candidatos', icon: Users2, roles: ['admin_th', 'lider'] },
    ],
  },
  {
    titulo: 'Nexa · Cultura y Formación',
    modulo: 'nexa',
    tituloCorto: 'Nexa',
    items: [
      { href: '/nexa/feed', label: 'Feed corporativo', icon: Rss, roles: ['admin_th', 'lider', 'colaborador', 'gerencia'] },
      { href: 'https://andre-proy.vercel.app/juegos', label: 'Ludo Retos', icon: Crosshair, roles: ['admin_th', 'lider', 'colaborador', 'gerencia'] },
      { href: '/nexa/notebook', label: 'Mi cuaderno', icon: NotebookPen, roles: ['admin_th', 'lider', 'colaborador'] },
      { href: '/nexa/directorio', label: 'Directorio de aliados', icon: Handshake, roles: ['admin_th', 'lider', 'gerencia'] },
      { href: '/nexa/asistente', label: 'Gino · Asistente IA', icon: Bot, roles: ['admin_th', 'lider', 'colaborador'] },
    ],
  },
  {
    titulo: 'Procesos y Cumplimiento',
    modulo: 'procesos',
    tituloCorto: 'Procesos',
    items: [
      { href: '/procesos-gestion', label: 'Procesos y sistemas de gestión', icon: ClipboardCheck, roles: ['admin_th', 'lider', 'gerencia'] },
      { href: '/procesos-gestion/contexto', label: 'Contexto (FODA)', icon: Compass, roles: ['admin_th', 'lider', 'gerencia'], fase: 'Planear' },
      { href: '/procesos-gestion/riesgos', label: 'Riesgos y oportunidades', icon: ShieldAlert, roles: ['admin_th', 'lider', 'gerencia'], fase: 'Planear' },
      { href: '/procesos-gestion/plan-trabajo', label: 'Plan de trabajo anual', icon: CalendarCheck, roles: ['admin_th', 'lider', 'gerencia'], fase: 'Planear' },
      { href: '/procesos-gestion/legal', label: 'Matriz legal', icon: Scale, roles: ['admin_th', 'lider', 'gerencia'], fase: 'Planear' },
      { href: '/procesos-gestion/comunicaciones', label: 'Matriz de comunicaciones', icon: Megaphone, roles: ['admin_th', 'lider', 'gerencia'], fase: 'Planear' },
      { href: '/procesos-gestion/documentos', label: 'Gestión documental', icon: FileStack, roles: ['admin_th', 'lider', 'gerencia'], fase: 'Hacer' },
      { href: '/procesos-gestion/auditorias', label: 'Auditorías internas', icon: ShieldQuestion, roles: ['admin_th', 'lider', 'gerencia', 'auditor_externo'], fase: 'Verificar' },
      { href: '/procesos-gestion/diagnostico-iso9001', label: 'Diagnóstico ISO 9001', icon: ClipboardList, roles: ['admin_th', 'lider', 'gerencia'], fase: 'Verificar' },
      { href: '/procesos-gestion/acpm', label: 'ACPM', icon: ListChecks, roles: ['admin_th', 'lider', 'gerencia'], fase: 'Actuar' },
      { href: '/procesos-gestion/cambios', label: 'Gestión de cambio', icon: GitPullRequestArrow, roles: ['admin_th', 'lider', 'gerencia'], fase: 'Actuar' },
      { href: '/nexa/simulacros', label: 'Simulacros (SST)', icon: ShieldAlert, roles: ['admin_th', 'lider', 'colaborador'] },
    ],
  },
  {
    titulo: 'Informes',
    modulo: 'informes',
    items: [
      { href: '/informes', label: 'Todos los informes', icon: FileBarChart, roles: ['admin_th', 'lider', 'colaborador', 'gerencia'] },
      { href: '/informes/360', label: 'Encuentro 360° Integrado', icon: Users2, roles: ['admin_th', 'lider', 'colaborador'] },
      { href: '/informes/pdi', label: 'Plan de Desarrollo Individual', icon: Target, roles: ['admin_th', 'lider', 'colaborador'] },
      { href: '/informes/sst', label: 'Seguimiento SST', icon: ShieldCheck, roles: ['admin_th', 'lider', 'gerencia'] },
      { href: '/informes/brechas', label: 'Brechas por dimensión', icon: BarChart3, roles: ['admin_th', 'lider', 'gerencia'] },
      { href: '/informes/equidad', label: 'Equidad de la valoración', icon: BarChart3, roles: ['admin_th'] },
      { href: '/informes/formacion', label: 'Formación', icon: GraduationCap, roles: ['admin_th', 'lider', 'gerencia', 'colaborador'] },
      { href: '/informes/cultura', label: 'Cultura y Engagement', icon: Heart, roles: ['admin_th', 'lider', 'gerencia'] },
      { href: '/informes/consolidado', label: 'Consolidado Gerencial', icon: BarChart3, roles: ['admin_th', 'gerencia'] },
      { href: '/informes/historico', label: 'Histórico Comparativo', icon: TrendingUp, roles: ['admin_th', 'lider', 'gerencia'] },
      { href: '/informes/evidencia-auditoria', label: 'Evidencia de auditoría', icon: FileArchive, roles: ['admin_th', 'gerencia', 'auditor_externo'] },
      { href: '/informes/revision-direccion', label: 'Revisión por la Dirección', icon: Gavel, roles: ['admin_th', 'gerencia'] },
    ],
  },
  {
    titulo: 'Administración',
    modulo: 'administracion',
    items: [
      { href: '/administracion/cargos', label: 'Cargos y perfiles', icon: Sparkles, roles: ['admin_th'] },
      { href: '/administracion/competencias', label: 'Competencias por nivel', icon: Sparkles, roles: ['admin_th'] },
      { href: '/administracion/indice-integral', label: 'Índice integral (pesos)', icon: BarChart3, roles: ['admin_th'] },
      { href: '/administracion/organigrama', label: 'Organigrama (editar)', icon: Network, roles: ['admin_th'] },
      { href: '/administracion/identidad', label: 'Identidad Organizacional', icon: Compass, roles: ['admin_th'] },
      { href: '/administracion/dotaciones', label: 'Dotaciones', icon: Shirt, roles: ['admin_th'], modulo: 'dotaciones' },
      { href: '/administracion/usuarios', label: 'Usuarios y roles', icon: Users, roles: ['admin_th'] },
      { href: '/administracion/roles', label: 'Roles y permisos', icon: ShieldCheck, roles: ['admin_th'] },
      { href: '/administracion/auditoria', label: 'Auditoría de cambios', icon: ScrollText, roles: ['admin_th'] },
      { href: '/administracion/respaldo', label: 'Respaldo de datos', icon: DatabaseBackup, roles: ['admin_th'] },
      { href: '/administracion/salarios', label: 'Salarios', icon: Wallet, roles: ['admin_th'] },
      { href: '/administracion/parametros-legales', label: 'Parámetros legales', icon: Scale, roles: ['admin_th'] },
      { href: '/administracion/configuracion', label: 'Configuración', icon: Settings, roles: ['admin_th'] },
    ],
  },
];

