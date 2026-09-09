import Link from 'next/link';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { Target, Users2, ShieldCheck, BarChart3, GraduationCap, Heart, TrendingUp, FileArchive } from 'lucide-react';
import type { RolUsuario } from '@/types/colaborador';

interface InformeDisponible {
  href: string;
  titulo: string;
  descripcion: string;
  icon: React.ElementType;
  roles: RolUsuario[];
}

// Se va completando a medida que se construye cada informe de la Fase 2.
const INFORMES: InformeDisponible[] = [
  {
    href: '/informes/360',
    titulo: 'Encuentro de Crecimiento 360° Integrado',
    descripcion: 'Resultado consolidado de Ser, Saber, Hacer y Deber, con detalle de cada acompañante.',
    icon: Users2,
    roles: ['admin_th', 'lider', 'colaborador'],
  },
  {
    href: '/informes/pdi',
    titulo: 'Plan de Desarrollo Individual (PDI)',
    descripcion: 'Brechas detectadas, plan de acción y seguimiento a su cumplimiento.',
    icon: Target,
    roles: ['admin_th', 'lider', 'colaborador'],
  },
  {
    href: '/informes/sst',
    titulo: 'Cumplimiento SST',
    descripcion: 'Certificaciones, vencimientos y alertas SST abiertas, con evidencia documental.',
    icon: ShieldCheck,
    // No existe todavía un rol "Líder SST" en el sistema — se apoya en los roles existentes.
    roles: ['admin_th', 'lider', 'gerencia'],
  },
  {
    href: '/informes/brechas',
    titulo: 'Brechas por dimensión',
    descripcion: 'Comparativo de Ser, Saber, Hacer y Deber por equipo o área, para priorizar intervenciones.',
    icon: BarChart3,
    roles: ['admin_th', 'lider', 'gerencia'],
  },
  {
    href: '/informes/formacion',
    titulo: 'Formación',
    descripcion: 'Cursos y rutas de aprendizaje asignados en Nexa, con su estado y avance.',
    icon: GraduationCap,
    roles: ['admin_th', 'lider', 'gerencia', 'colaborador'],
  },
  {
    href: '/informes/cultura',
    titulo: 'Cultura y Engagement',
    descripcion: 'Reconocimientos, participación en el feed y formación de cultura completada.',
    icon: Heart,
    roles: ['admin_th', 'lider', 'gerencia'],
  },
  {
    href: '/informes/consolidado',
    titulo: 'Consolidado Gerencial',
    descripcion: 'Panorama completo de la empresa, con desglose por área — listo para presentar.',
    icon: BarChart3,
    roles: ['admin_th', 'gerencia'],
  },
  {
    href: '/informes/historico',
    titulo: 'Histórico Comparativo entre Ciclos',
    descripcion: 'Evolución del promedio de Hacer y Deber de un ciclo de evaluación al siguiente.',
    icon: TrendingUp,
    roles: ['admin_th', 'lider', 'gerencia'],
  },
  {
    href: '/informes/evidencia-auditoria',
    titulo: 'Evidencia de auditoría',
    descripcion: 'Paquete descargable de evidencia SST, ISO 9001 y SARLAFT/SAGRILAFT, con los documentos de soporte.',
    icon: FileArchive,
    roles: ['admin_th', 'gerencia', 'auditor_externo'],
  },
];

export default async function InformesPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const disponibles = INFORMES.filter((i) => i.roles.includes(perfil.rol));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Informes</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Todos los informes se pueden filtrar por persona o equipo, y exportar en PDF o Excel.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {disponibles.map((informe) => (
          <Link key={informe.href} href={informe.href} className="card p-5 hover:border-flow-300 transition">
            <informe.icon size={20} className="text-flow-600 mb-2" />
            <h2 className="font-display font-semibold text-secundario">{informe.titulo}</h2>
            <p className="text-sm text-marmol-500 mt-1">{informe.descripcion}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
