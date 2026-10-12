import Link from 'next/link';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { redirect } from 'next/navigation';
import { Shirt, Package, Users, ArrowRight } from 'lucide-react';

const SECCIONES = [
  {
    href: '/dotacion',
    titulo: 'Gestión de dotaciones',
    descripcion: 'Registrar entregas, confirmar recibido, verificar uso y revisar el reporte de cumplimiento por corte.',
    icon: Shirt,
  },
  {
    href: '/dotacion/catalogo',
    titulo: 'Catálogo de dotación',
    descripcion: 'Artículos, referencias, tallas y stock en bodega. Kit de dotación que le corresponde a cada cargo.',
    icon: Package,
  },
  {
    href: '/dotacion/seguimiento',
    titulo: 'Seguimiento por persona',
    descripcion: 'Para cada colaborador: su kit, lo que falta en el corte actual y si es elegible.',
    icon: Users,
  },
];

export default async function DotacionesAdminPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/inicio');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Dotaciones</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Gestión de la dotación de la empresa, con normativa de elegibilidad y cortes obligatorios. Solo Talento Humano.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {SECCIONES.map((s) => (
          <Link key={s.href} href={s.href} className="card p-5 space-y-3 hover:shadow-md transition group">
            <s.icon size={22} className="text-flow-600" />
            <h2 className="font-display font-semibold text-secundario">{s.titulo}</h2>
            <p className="text-sm text-marmol-500">{s.descripcion}</p>
            <span className="inline-flex items-center gap-1 text-xs text-flow-600 font-medium group-hover:underline">
              Abrir <ArrowRight size={12} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
