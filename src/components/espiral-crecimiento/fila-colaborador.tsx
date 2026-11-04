'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { eliminarColaborador } from '@/app/(dashboard)/espiral-crecimiento/colaboradores/actions';
import { formatearFecha } from '@/lib/utils';

export interface ColaboradorFila {
  id: string;
  nombre_completo: string;
  estado: string;
  fecha_ingreso: string;
  cargo: { nombre: string; proceso_area: string | null } | null;
  esLider?: boolean;
}

export function FilaColaborador({ colaborador, puedeEliminar }: { colaborador: ColaboradorFila; puedeEliminar: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function eliminar() {
    const mensaje =
      `¿Eliminar la ficha de ${colaborador.nombre_completo}? Esto NO se puede deshacer: se borra ` +
      'su ficha con todo lo asociado (evaluaciones, SER, hoja de vida, inducción, alertas, ' +
      'incapacidades, fechas especiales, dotación, Guía del Flow).\n\n' +
      'Antes de borrar se guarda un registro en el "Histórico de colaboradores" (nombre, documento, cargo, ' +
      'líder, fechas y su historial de movimientos), para saber quién pasó por la empresa.\n\n' +
      'Si la persona solo dejó la empresa, es mejor dejarla inactiva con "Salida" desde su Historial.';
    if (!confirm(mensaje)) return;
    const motivo = window.prompt('Motivo de la eliminación (opcional, queda en el histórico):', '') ?? '';
    setError(null);
    startTransition(async () => {
      const res = await eliminarColaborador(colaborador.id, motivo);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <tr className="border-b border-marmol-100 last:border-0 hover:bg-marmol-50">
      <td className="px-4 py-3">
        <Link
          href={`/espiral-crecimiento/colaboradores/${colaborador.id}`}
          className="font-medium text-marmol-900 hover:text-flow-600"
        >
          {colaborador.nombre_completo}
        </Link>
        {colaborador.esLider && (
          <span className="ml-2 inline-flex items-center rounded-full bg-flow-50 border border-flow-200 px-2 py-0.5 text-[11px] font-medium text-flow-700">
            Líder de área
          </span>
        )}
        {error && <p className="mt-1 text-xs text-bajo">{error}</p>}
      </td>
      <td className="px-4 py-3 text-marmol-600">{colaborador.cargo?.nombre ?? '—'}</td>
      <td className="px-4 py-3 text-marmol-600">{colaborador.cargo?.proceso_area ?? '—'}</td>
      <td className="px-4 py-3 text-marmol-500">{formatearFecha(colaborador.fecha_ingreso)}</td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center rounded-full bg-marmol-100 px-2 py-0.5 text-xs text-marmol-600 capitalize">
          {colaborador.estado.replace(/_/g, ' ')}
        </span>
      </td>
      {puedeEliminar && (
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={eliminar}
            disabled={pending}
            title="Eliminar definitivamente — no se puede deshacer"
            className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-bajo disabled:opacity-40"
          >
            <Trash2 size={12} /> {pending ? 'Eliminando…' : 'Eliminar'}
          </button>
        </td>
      )}
    </tr>
  );
}
