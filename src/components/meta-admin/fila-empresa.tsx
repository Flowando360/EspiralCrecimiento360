'use client';

import { useState, useTransition } from 'react';
import { actualizarMembresia } from '@/app/(dashboard)/meta-admin/actions';
import { Check } from 'lucide-react';

export interface EmpresaMetaAdmin {
  id: string;
  nombre: string;
  usuariosActivos: number;
  colaboradoresActivos: number;
  planMembresia: 'piloto' | 'estandar' | 'premium';
  precioMembresiaMensual: number | null;
  estadoFacturacion: 'al_dia' | 'pendiente' | 'vencido';
  fechaProximoPago: string | null;
}

const CLASE_FACTURACION: Record<string, string> = {
  al_dia: 'badge-alto',
  pendiente: 'badge-medio',
  vencido: 'badge-bajo',
};

export function FilaEmpresa({ empresa }: { empresa: EmpresaMetaAdmin }) {
  const [plan, setPlan] = useState(empresa.planMembresia);
  const [precio, setPrecio] = useState(empresa.precioMembresiaMensual?.toString() ?? '');
  const [estadoFacturacion, setEstadoFacturacion] = useState(empresa.estadoFacturacion);
  const [fechaProximoPago, setFechaProximoPago] = useState(empresa.fechaProximoPago ?? '');
  const [guardado, setGuardado] = useState(false);
  const [pending, startTransition] = useTransition();

  function guardar() {
    setGuardado(false);
    startTransition(async () => {
      const res = await actualizarMembresia({
        empresaId: empresa.id,
        planMembresia: plan,
        precioMembresiaMensual: precio.trim() ? Number(precio) : null,
        estadoFacturacion,
        fechaProximoPago: fechaProximoPago || null,
      });
      if (res.ok) {
        setGuardado(true);
        setTimeout(() => setGuardado(false), 2000);
      }
    });
  }

  return (
    <tr className="border-b border-marmol-100 last:border-0">
      <td className="px-4 py-3 font-medium text-marmol-900">{empresa.nombre}</td>
      <td className="px-4 py-3 text-marmol-600">{empresa.usuariosActivos}</td>
      <td className="px-4 py-3 text-marmol-600">{empresa.colaboradoresActivos}</td>
      <td className="px-4 py-3">
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value as typeof plan)}
          className="rounded-lg border border-marmol-200 px-2 py-1 text-xs"
        >
          <option value="piloto">Piloto</option>
          <option value="estandar">Estándar</option>
          <option value="premium">Premium</option>
        </select>
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          placeholder="$/mes"
          className="w-24 rounded-lg border border-marmol-200 px-2 py-1 text-xs"
        />
      </td>
      <td className="px-4 py-3">
        <select
          value={estadoFacturacion}
          onChange={(e) => setEstadoFacturacion(e.target.value as typeof estadoFacturacion)}
          className={`text-xs rounded-full px-2 py-0.5 font-medium border-0 ${CLASE_FACTURACION[estadoFacturacion]}`}
        >
          <option value="al_dia">Al día</option>
          <option value="pendiente">Pendiente</option>
          <option value="vencido">Vencido</option>
        </select>
      </td>
      <td className="px-4 py-3">
        <input
          type="date"
          value={fechaProximoPago}
          onChange={(e) => setFechaProximoPago(e.target.value)}
          className="rounded-lg border border-marmol-200 px-2 py-1 text-xs"
        />
      </td>
      <td className="px-4 py-3">
        <button
          onClick={guardar}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-2.5 py-1.5"
        >
          {guardado ? <Check size={12} /> : null} {pending ? 'Guardando…' : guardado ? 'Guardado' : 'Guardar'}
        </button>
      </td>
    </tr>
  );
}
