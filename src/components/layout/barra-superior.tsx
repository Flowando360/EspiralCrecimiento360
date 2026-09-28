'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn, etiquetaRol } from '@/lib/utils';
import type { RolUsuario } from '@/types/colaborador';
import { CentroAyudaBoton } from '@/components/ayuda/centro-ayuda-boton';
import {
  Home,
  User,
  Users,
  Users2,
  CalendarClock,
  Target,
  Crosshair,
  X,
  Network,
  BarChart3,
  Rss,
  GraduationCap,
  Award,
  Bot,
  Bell,
  Mail,
  Settings,
  Sparkles,
  Compass,
  FileBarChart,
  ShieldAlert,
  Handshake,
  MessageCircle,
  NotebookPen,
  ClipboardCheck,
  ShieldCheck,
  Building2,
  Wallet,
  HeartHandshake,
  RefreshCw,
  Send,
  LayoutGrid,
  UserSearch,
  Shirt,
  Package,
  FileStack,
  ShieldQuestion,
  ListChecks,
  GitPullRequestArrow,
  ClipboardList,
  Scale,
  Heart,
  TrendingUp,
  FileArchive,
  Gavel,
  Menu,
  ChevronDown,
  LogOut,
} from 'lucide-react';

type FasePhva = 'Planear' | 'Hacer' | 'Verificar' | 'Actuar';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: RolUsuario[];
  /** Solo para el desplegable de Procesos y Cumplimiento: agrupa visualmente
   * sus módulos bajo el ciclo PHVA. Sin este campo, el ítem se muestra suelto
   * antes de los grupos de fase (p. ej. la página resumen del módulo). */
  fase?: FasePhva;
}

const ORDEN_FASES: FasePhva[] = ['Planear', 'Hacer', 'Verificar', 'Actuar'];

function agruparPorFase(items: NavItem[]): { fase: FasePhva | null; items: NavItem[] }[] {
  const sinFase = items.filter((item) => !item.fase);
  const grupos = ORDEN_FASES.map((fase) => ({ fase, items: items.filter((item) => item.fase === fase) })).filter(
    (g) => g.items.length > 0
  );
  return sinFase.length > 0 ? [{ fase: null, items: sinFase }, ...grupos] : grupos;
}

interface NavGroup {
  /** Vacío = no es un grupo, es un ítem suelto (se renderiza directo, sin desplegable). */
  titulo: string;
  /** Etiqueta corta para el botón del desplegable en escritorio, cuando "titulo" es
   * más largo de lo que cabe cómodo en la barra — el desplegable en sí sigue
   * usando los nombres completos de cada página. */
  tituloCorto?: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  { titulo: '', items: [{ href: '/inicio', label: 'Inicio', icon: Home, roles: ['admin_th', 'lider', 'colaborador', 'gerencia', 'auditor_externo'] }] },
  { titulo: '', items: [{ href: '/mi-perfil', label: 'Mi Perfil', icon: User, roles: ['admin_th', 'lider', 'colaborador', 'gerencia'] }] },
  {
    titulo: 'Espiral de Crecimiento 360°',
    tituloCorto: 'Espiral 360°',
    items: [
      { href: '/espiral-crecimiento/colaboradores', label: 'Colaboradores', icon: Users, roles: ['admin_th', 'lider', 'gerencia'] },
      { href: '/espiral-crecimiento/dimensiones', label: 'Dimensiones', icon: LayoutGrid, roles: ['admin_th', 'lider', 'gerencia'] },
      { href: '/espiral-crecimiento/ciclos', label: 'Ciclos de Crecimiento', icon: CalendarClock, roles: ['admin_th', 'lider'] },
      { href: '/espiral-crecimiento/pdi', label: 'Planes de Desarrollo', icon: Target, roles: ['admin_th', 'lider', 'colaborador'] },
      { href: '/espiral-crecimiento/organigrama', label: 'Organigrama', icon: Network, roles: ['admin_th', 'lider', 'gerencia'] },
      { href: '/espiral-crecimiento/indicadores', label: 'Indicadores', icon: BarChart3, roles: ['admin_th', 'lider', 'gerencia'] },
    ],
  },
  {
    titulo: 'Reclutamiento',
    items: [
      { href: '/reclutamiento', label: 'Reclutamiento y Selección', icon: UserSearch, roles: ['admin_th', 'lider'] },
      { href: '/reclutamiento/candidatos', label: 'Banco de candidatos', icon: Users2, roles: ['admin_th', 'lider'] },
    ],
  },
  {
    titulo: 'Dotación',
    items: [
      { href: '/dotacion', label: 'Gestión de Dotaciones', icon: Shirt, roles: ['admin_th', 'lider', 'colaborador'] },
      { href: '/dotacion/catalogo', label: 'Catálogo de dotación', icon: Package, roles: ['admin_th', 'lider', 'colaborador'] },
      { href: '/dotacion/reporte', label: 'Reporte de consumo', icon: FileBarChart, roles: ['admin_th', 'lider'] },
    ],
  },
  {
    titulo: 'Nexa · Cultura y Formación',
    tituloCorto: 'Nexa',
    items: [
      { href: '/nexa/feed', label: 'Feed corporativo', icon: Rss, roles: ['admin_th', 'lider', 'colaborador', 'gerencia'] },
      { href: '/nexa/formacion', label: 'Formación y SST', icon: GraduationCap, roles: ['admin_th', 'lider', 'colaborador'] },
      { href: '/nexa/makigami', label: 'Cacería Makigami', icon: Crosshair, roles: ['admin_th', 'lider', 'colaborador', 'gerencia'] },
      { href: '/nexa/notebook', label: 'Mi cuaderno', icon: NotebookPen, roles: ['admin_th', 'lider', 'colaborador'] },
      { href: '/nexa/simulacros', label: 'Simulacros', icon: ShieldAlert, roles: ['admin_th', 'lider', 'colaborador'] },
      { href: '/nexa/reconocimientos', label: 'Reconocimientos', icon: Award, roles: ['admin_th', 'lider', 'colaborador', 'gerencia'] },
      { href: '/nexa/clima', label: 'Clima Organizacional', icon: HeartHandshake, roles: ['admin_th', 'lider', 'colaborador', 'gerencia'] },
      { href: '/nexa/directorio', label: 'Directorio de aliados', icon: Handshake, roles: ['admin_th', 'lider', 'gerencia'] },
      { href: '/nexa/asistente', label: 'Asistente IA', icon: Bot, roles: ['admin_th', 'lider', 'colaborador'] },
    ],
  },
  {
    titulo: 'Procesos y Cumplimiento',
    tituloCorto: 'Procesos',
    items: [
      { href: '/procesos-gestion', label: 'Procesos y sistemas de gestión', icon: ClipboardCheck, roles: ['admin_th', 'lider', 'gerencia'] },
      { href: '/procesos-gestion/contexto', label: 'Contexto (FODA)', icon: Compass, roles: ['admin_th', 'lider', 'gerencia'], fase: 'Planear' },
      { href: '/procesos-gestion/riesgos', label: 'Riesgos y oportunidades', icon: ShieldAlert, roles: ['admin_th', 'lider', 'gerencia'], fase: 'Planear' },
      { href: '/procesos-gestion/legal', label: 'Matriz legal', icon: Scale, roles: ['admin_th', 'lider', 'gerencia'], fase: 'Planear' },
      { href: '/procesos-gestion/documentos', label: 'Gestión documental', icon: FileStack, roles: ['admin_th', 'lider', 'gerencia'], fase: 'Hacer' },
      { href: '/procesos-gestion/auditorias', label: 'Auditorías internas', icon: ShieldQuestion, roles: ['admin_th', 'lider', 'gerencia', 'auditor_externo'], fase: 'Verificar' },
      { href: '/procesos-gestion/diagnostico-iso9001', label: 'Diagnóstico ISO 9001', icon: ClipboardList, roles: ['admin_th', 'lider', 'gerencia'], fase: 'Verificar' },
      { href: '/procesos-gestion/acpm', label: 'ACPM', icon: ListChecks, roles: ['admin_th', 'lider', 'gerencia'], fase: 'Actuar' },
      { href: '/procesos-gestion/cambios', label: 'Gestión de cambio', icon: GitPullRequestArrow, roles: ['admin_th', 'lider', 'gerencia'], fase: 'Actuar' },
    ],
  },
  {
    titulo: 'Informes',
    items: [
      { href: '/informes', label: 'Todos los informes', icon: FileBarChart, roles: ['admin_th', 'lider', 'colaborador', 'gerencia'] },
      { href: '/informes/360', label: 'Encuentro 360° Integrado', icon: Users2, roles: ['admin_th', 'lider', 'colaborador'] },
      { href: '/informes/pdi', label: 'Plan de Desarrollo Individual', icon: Target, roles: ['admin_th', 'lider', 'colaborador'] },
      { href: '/informes/sst', label: 'Cumplimiento SST', icon: ShieldCheck, roles: ['admin_th', 'lider', 'gerencia'] },
      { href: '/informes/brechas', label: 'Brechas por dimensión', icon: BarChart3, roles: ['admin_th', 'lider', 'gerencia'] },
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
    items: [
      { href: '/administracion/cargos', label: 'Cargos y perfiles', icon: Sparkles, roles: ['admin_th'] },
      { href: '/administracion/organigrama', label: 'Organigrama (editar)', icon: Network, roles: ['admin_th'] },
      { href: '/administracion/identidad', label: 'Identidad Organizacional', icon: Compass, roles: ['admin_th'] },
      { href: '/administracion/guias-flow', label: 'Guías del Flow', icon: Send, roles: ['admin_th'] },
      { href: '/administracion/sincronizaciones-guia-flow', label: 'Sincronizaciones Guía del Flow', icon: RefreshCw, roles: ['admin_th'] },
      { href: '/administracion/usuarios', label: 'Usuarios y roles', icon: Users, roles: ['admin_th'] },
      { href: '/administracion/salarios', label: 'Salarios', icon: Wallet, roles: ['admin_th'] },
      { href: '/administracion/configuracion', label: 'Configuración', icon: Settings, roles: ['admin_th'] },
    ],
  },
];

export function BarraSuperior({
  rol,
  esSuperadmin,
  nombre,
  alertasPendientes,
  notificacionesNoLeidas,
  mensajesNoLeidos,
}: {
  rol: RolUsuario;
  esSuperadmin?: boolean;
  nombre: string;
  alertasPendientes: number;
  notificacionesNoLeidas: number;
  mensajesNoLeidos: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [gruposAbiertosMovil, setGruposAbiertosMovil] = useState<Set<number>>(new Set());

  useEffect(() => setMenuMovilAbierto(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuMovilAbierto ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuMovilAbierto]);

  async function cerrarSesion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  function alternarGrupoMovil(i: number) {
    setGruposAbiertosMovil((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(i)) siguiente.delete(i);
      else siguiente.add(i);
      return siguiente;
    });
  }

  const gruposVisibles = NAV.map((grupo, i) => ({ ...grupo, i, items: grupo.items.filter((item) => item.roles.includes(rol)) })).filter(
    (g) => g.items.length > 0
  );

  return (
    <header className="sticky top-0 z-40 bg-barra shadow-md">
      {/* Fila 1: marca + utilidades (siempre una sola línea). */}
      <div className="h-14 sm:h-16 flex items-center gap-2 px-3 sm:px-6">
        <button
          type="button"
          onClick={() => setMenuMovilAbierto(true)}
          className="rounded-lg p-2 text-white hover:bg-white/10 transition lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>

        <Link href="/inicio" className="flex items-center gap-2 shrink-0 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0">
            <Image src="/marca/EspiralIsotipo.png" alt="" width={32} height={32} className="h-7 w-7 object-contain" />
          </div>
          <div className="hidden md:block leading-tight min-w-0">
            <p className="font-display text-sm font-semibold text-white truncate">Espiral de Crecimiento</p>
            <p className="text-xs text-acento/80 truncate">Flow, Nexus y Visión</p>
          </div>
        </Link>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1.5 shrink-0">
          <CentroAyudaBoton className="rounded-lg p-2 text-white/85 hover:bg-white/10 hover:text-white transition" />
          <IconoConBadge href="/alertas" icon={Bell} contador={alertasPendientes} titulo="Alertas de fechas clave" />
          <IconoConBadge href="/notificaciones" icon={Mail} contador={notificacionesNoLeidas} titulo="Notificaciones" />
          <IconoConBadge href="/mensajes" icon={MessageCircle} contador={mensajesNoLeidos} titulo="Mensajes" />
          <div className="hidden sm:block text-right leading-tight mx-1 max-w-[9rem]">
            <p className="text-sm font-medium text-white truncate">{nombre}</p>
            <p className="text-xs text-white/60 truncate">{etiquetaRol[rol] ?? rol}</p>
          </div>
          <button onClick={cerrarSesion} className="rounded-lg p-2 text-white/85 hover:bg-white/10 hover:text-white transition" title="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Fila 2: navegación por módulos — solo escritorio (lg+). Envuelve a una
          segunda línea si no cabe, en vez de recortarse o exigir scroll horizontal. */}
      <nav className="hidden lg:flex flex-wrap items-center gap-x-0.5 gap-y-1 px-4 sm:px-6 pb-2 border-t border-white/10 pt-1.5">
        {gruposVisibles.map((grupo) => {
          const primero = grupo.items[0];
          if (!primero) return null;

          if (grupo.items.length === 1 || !grupo.titulo) {
            const item = primero;
            const activo = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center rounded-lg px-2 py-1.5 text-sm font-bold whitespace-nowrap transition',
                  activo ? 'bg-white/15 text-white' : 'text-white/85 hover:bg-white/10 hover:text-white'
                )}
              >
                {item.label}
              </Link>
            );
          }

          const activo = grupo.items.some((item) => pathname.startsWith(item.href));
          return (
            <div key={grupo.titulo} className="group relative">
              <Link
                href={primero.href}
                className={cn(
                  'flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-bold whitespace-nowrap transition',
                  activo ? 'bg-white/15 text-white' : 'text-white/85 hover:bg-white/10 hover:text-white'
                )}
              >
                {grupo.tituloCorto ?? grupo.titulo}
                <ChevronDown size={14} strokeWidth={2.5} className="opacity-70 group-hover:rotate-180 transition-transform" />
              </Link>

              <div className="invisible absolute left-0 top-full pt-1 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 z-50">
                <div className="w-72 rounded-xl bg-white shadow-xl ring-1 ring-black/5 p-2 max-h-[75vh] overflow-y-auto">
                  <p className="px-2.5 pb-1 pt-0.5 text-xs font-semibold uppercase tracking-wide text-marmol-400">{grupo.titulo}</p>
                  {agruparPorFase(grupo.items).map((sub, si) => (
                    <div key={sub.fase ?? `sin-fase-${si}`} className={si > 0 ? 'mt-1.5 pt-1.5 border-t border-marmol-100' : undefined}>
                      {sub.fase && (
                        <p className="px-2.5 pb-0.5 text-[11px] font-bold uppercase tracking-wider text-flow-600">{sub.fase}</p>
                      )}
                      {sub.items.map((item) => {
                        const Icon = item.icon;
                        const itemActivo = pathname.startsWith(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition',
                              itemActivo ? 'bg-flow-50 text-flow-700 font-semibold' : 'text-marmol-700 hover:bg-marmol-100'
                            )}
                          >
                            <Icon size={16} strokeWidth={2} className="shrink-0 text-marmol-400" />
                            <span className="min-w-0 break-words">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {esSuperadmin && (
          <Link
            href="/meta-admin"
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold whitespace-nowrap transition',
              pathname.startsWith('/meta-admin') ? 'bg-white/15 text-white' : 'text-white/85 hover:bg-white/10 hover:text-white'
            )}
          >
            <Building2 size={16} strokeWidth={2.25} />
            Cuentas y membresías
          </Link>
        )}
      </nav>

      {/* Menú móvil: NO es un costado — es la misma barra de arriba, que se
          despliega hacia abajo a todo el ancho (nunca coexiste con la de
          escritorio: esta sección es "lg:hidden", la de escritorio es
          "hidden lg:flex"; a un tamaño de pantalla dado solo una de las dos
          existe en el DOM). */}
      <div
        className={cn(
          'fixed inset-x-0 top-14 sm:top-16 bottom-0 z-50 bg-barra flex flex-col transition-transform duration-200 lg:hidden',
          menuMovilAbierto ? 'translate-y-0' : '-translate-y-[120%]'
        )}
      >
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Menú</p>
          <button type="button" onClick={() => setMenuMovilAbierto(false)} className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white shrink-0" aria-label="Cerrar menú">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {gruposVisibles.map((grupo) => {
            const primero = grupo.items[0];
            if (!primero) return null;

            if (grupo.items.length === 1 || !grupo.titulo) {
              const item = primero;
              const Icon = item.icon;
              const activo = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-bold transition',
                    activo ? 'bg-white/15 text-white' : 'text-white/85 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon size={17} strokeWidth={2.25} />
                  {item.label}
                </Link>
              );
            }

            const expandido = gruposAbiertosMovil.has(grupo.i);
            const activo = grupo.items.some((item) => pathname.startsWith(item.href));
            return (
              <div key={grupo.titulo}>
                <button
                  type="button"
                  onClick={() => alternarGrupoMovil(grupo.i)}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition',
                    activo ? 'bg-white/15 text-white' : 'text-white/85 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <span className="text-left break-words">{grupo.titulo}</span>
                  <ChevronDown size={16} className={cn('shrink-0 transition-transform', expandido && 'rotate-180')} />
                </button>
                {expandido && (
                  <div className="mt-0.5 mb-1 ml-2 space-y-0.5 border-l-2 border-white/10 pl-2">
                    {agruparPorFase(grupo.items).map((sub, si) => (
                      <div key={sub.fase ?? `sin-fase-${si}`} className={si > 0 ? 'mt-1.5 pt-1.5 border-t border-white/10' : undefined}>
                        {sub.fase && (
                          <p className="px-3 pb-0.5 text-[11px] font-bold uppercase tracking-wider text-acento/90">{sub.fase}</p>
                        )}
                        {sub.items.map((item) => {
                          const Icon = item.icon;
                          const itemActivo = pathname.startsWith(item.href);
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={cn(
                                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition',
                                itemActivo ? 'bg-white/15 text-white font-semibold' : 'text-white/75 hover:bg-white/10 hover:text-white'
                              )}
                            >
                              <Icon size={15} strokeWidth={2} className="shrink-0" />
                              <span className="min-w-0 break-words">{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {esSuperadmin && (
            <Link
              href="/meta-admin"
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-bold transition',
                pathname.startsWith('/meta-admin') ? 'bg-white/15 text-white' : 'text-white/85 hover:bg-white/10 hover:text-white'
              )}
            >
              <Building2 size={17} strokeWidth={2.25} />
              Cuentas y membresías
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function IconoConBadge({
  href,
  icon: Icon,
  contador,
  titulo,
}: {
  href: string;
  icon: React.ElementType;
  contador: number;
  titulo: string;
}) {
  return (
    <Link href={href} className="relative rounded-lg p-2 text-white/85 hover:bg-white/10 hover:text-white transition" title={titulo}>
      <Icon size={18} />
      {contador > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-acento text-barra text-[12px] font-bold flex items-center justify-center px-1">
          {contador}
        </span>
      )}
    </Link>
  );
}
