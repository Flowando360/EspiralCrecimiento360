'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { RolUsuario } from '@/types/colaborador';
import {
  Home,
  User,
  Users,
  CalendarClock,
  Target,
  Network,
  BarChart3,
  Rss,
  GraduationCap,
  Award,
  Bot,
  Bell,
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
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: RolUsuario[];
}

interface NavGroup {
  titulo: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    titulo: '',
    items: [
      { href: '/inicio', label: 'Inicio', icon: Home, roles: ['admin_th', 'lider', 'colaborador', 'gerencia', 'auditor_externo'] },
      { href: '/mi-perfil', label: 'Mi Perfil', icon: User, roles: ['admin_th', 'lider', 'colaborador', 'gerencia'] },
    ],
  },
  {
    titulo: 'Espiral de Crecimiento 360°',
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
    items: [{ href: '/reclutamiento', label: 'Reclutamiento y Selección', icon: UserSearch, roles: ['admin_th', 'lider'] }],
  },
  {
    titulo: 'Dotación',
    items: [{ href: '/dotacion', label: 'Gestión de Dotaciones', icon: Shirt, roles: ['admin_th', 'lider', 'colaborador'] }],
  },
  {
    titulo: 'Nexa · Cultura y Formación',
    items: [
      { href: '/nexa/feed', label: 'Feed corporativo', icon: Rss, roles: ['admin_th', 'lider', 'colaborador', 'gerencia'] },
      { href: '/nexa/formacion', label: 'Formación y SST', icon: GraduationCap, roles: ['admin_th', 'lider', 'colaborador'] },
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
    items: [
      { href: '/procesos-gestion', label: 'Procesos y sistemas de gestión', icon: ClipboardCheck, roles: ['admin_th', 'lider', 'gerencia'] },
      { href: '/informes/evidencia-auditoria', label: 'Evidencia de auditoría', icon: ShieldCheck, roles: ['admin_th', 'gerencia', 'auditor_externo'] },
    ],
  },
  {
    titulo: '',
    items: [
      { href: '/mensajes', label: 'Mensajes', icon: MessageCircle, roles: ['admin_th', 'lider', 'colaborador', 'gerencia'] },
      { href: '/alertas', label: 'Alertas y fechas clave', icon: Bell, roles: ['admin_th', 'lider', 'colaborador'] },
      { href: '/informes', label: 'Informes', icon: FileBarChart, roles: ['admin_th', 'lider', 'colaborador', 'gerencia'] },
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

export function Sidebar({ rol, esSuperadmin }: { rol: RolUsuario; esSuperadmin?: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 bg-secundario flex flex-col">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0">
            <Image src="/marca/EspiralIsotipo.png" alt="" width={32} height={32} className="h-7 w-7 object-contain" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold leading-tight text-acento">
              Espiral de Crecimiento
            </p>
            <p className="text-xs text-acento/70 leading-tight">Flow, Nexus y Visión</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV.map((grupo, gi) => {
          const items = grupo.items.filter((item) => item.roles.includes(rol));
          if (items.length === 0) return null;
          return (
            <div key={gi}>
              {grupo.titulo && (
                <p className="px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-acento/60">
                  {grupo.titulo}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const activo = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition',
                        activo
                          ? 'bg-flow-500/25 text-acento font-medium'
                          : 'text-acento/70 hover:bg-white/10 hover:text-acento'
                      )}
                    >
                      <Icon size={16} strokeWidth={2} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

        {esSuperadmin && (
          <div>
            <p className="px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-acento/60">
              Alianza (interno)
            </p>
            <div className="space-y-0.5">
              <Link
                href="/meta-admin"
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition',
                  pathname.startsWith('/meta-admin')
                    ? 'bg-flow-500/25 text-acento font-medium'
                    : 'text-acento/70 hover:bg-white/10 hover:text-acento'
                )}
              >
                <Building2 size={16} strokeWidth={2} />
                Cuentas y membresías
              </Link>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}
