import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export interface Pendiente {
  etiqueta: string;
  cantidad: number;
  href: string;
}

const CICLO: { fase: string; descripcion: string; items: { href: string; label: string }[] }[] = [
  {
    fase: 'Planear',
    descripcion: 'Contexto, riesgos, requisitos legales y comunicación',
    items: [
      { href: '/procesos-gestion/contexto', label: 'Contexto (FODA)' },
      { href: '/procesos-gestion/riesgos', label: 'Riesgos y oportunidades' },
      { href: '/procesos-gestion/legal', label: 'Matriz legal' },
      { href: '/procesos-gestion/comunicaciones', label: 'Matriz de comunicaciones' },
    ],
  },
  {
    fase: 'Hacer',
    descripcion: 'Procesos y control de la información documentada',
    items: [{ href: '/procesos-gestion/documentos', label: 'Gestión documental' }],
  },
  {
    fase: 'Verificar',
    descripcion: 'Seguimiento, auditoría y evaluación',
    items: [
      { href: '/procesos-gestion/auditorias', label: 'Auditorías internas' },
      { href: '/procesos-gestion/diagnostico-iso9001', label: 'Diagnóstico ISO 9001' },
    ],
  },
  {
    fase: 'Actuar',
    descripcion: 'Acciones correctivas, de mejora y cambios',
    items: [
      { href: '/procesos-gestion/acpm', label: 'ACPM' },
      { href: '/procesos-gestion/cambios', label: 'Gestión de cambio' },
    ],
  },
];

/** Panel del módulo de Procesos: ciclo PHVA, madurez promedio del sistema y pendientes del día. */
export function PanelPhva({ madurezPromedio, pendientes }: { madurezPromedio: number; pendientes: Pendiente[] }) {
  const totalPendientes = pendientes.reduce((acc, p) => acc + p.cantidad, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-secundario text-sm">Madurez del sistema</h2>
            <span className="text-sm font-semibold text-marmol-800">{madurezPromedio}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-marmol-100 overflow-hidden">
            <div className="h-full rounded-full bg-flow-500" style={{ width: `${madurezPromedio}%` }} />
          </div>
          <p className="text-xs text-marmol-400">Promedio del índice de madurez de todos los procesos (caracterización, indicadores, riesgos, documentos y ACPM al día).</p>
        </div>

        <div className="card p-4 space-y-2">
          <div className="flex items-center gap-2">
            {totalPendientes === 0 ? <CheckCircle2 size={16} className="text-alto" /> : <AlertTriangle size={16} className="text-medio" />}
            <h2 className="font-display font-semibold text-secundario text-sm">Pendientes</h2>
          </div>
          {totalPendientes === 0 ? (
            <p className="text-sm text-marmol-500">Todo al día.</p>
          ) : (
            <ul className="space-y-1.5">
              {pendientes
                .filter((p) => p.cantidad > 0)
                .map((p) => (
                  <li key={p.etiqueta}>
                    <Link href={p.href} className="flex items-center justify-between text-sm text-marmol-700 hover:text-flow-700">
                      <span>{p.etiqueta}</span>
                      <span className="font-semibold">{p.cantidad}</span>
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {CICLO.map((c) => (
          <div key={c.fase} className="card p-4 space-y-3">
            <div>
              <h3 className="font-display font-semibold text-secundario">{c.fase}</h3>
              <p className="text-xs text-marmol-400">{c.descripcion}</p>
            </div>
            <div className="space-y-1">
              {c.items.map((i) => (
                <Link key={i.href} href={i.href} className="flex items-center justify-between rounded-lg px-2.5 py-2 text-sm text-marmol-700 hover:bg-marmol-50">
                  {i.label}
                  <ArrowRight size={14} className="text-marmol-300" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
