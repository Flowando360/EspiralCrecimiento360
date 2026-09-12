'use client';

import { useState, useTransition } from 'react';
import { actualizarAliado, eliminarAliado } from '@/app/(dashboard)/nexa/directorio/actions';
import { Pencil, Trash2, Check, X } from 'lucide-react';

const TIPOS = [
  { valor: 'arl', etiqueta: 'ARL' },
  { valor: 'asesor_sst', etiqueta: 'Asesor SST' },
  { valor: 'proveedor_formacion', etiqueta: 'Proveedor de formación' },
  { valor: 'otro', etiqueta: 'Otro' },
] as const;

const ETIQUETA_TIPO: Record<string, string> = Object.fromEntries(TIPOS.map((t) => [t.valor, t.etiqueta]));

export interface AliadoFila {
  id: string;
  nombre: string;
  tipo: string | null;
  contacto: string | null;
  notas: string | null;
}

export function FilaAliado({ aliado, esAdminTh }: { aliado: AliadoFila; esAdminTh: boolean }) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(aliado.nombre);
  const [tipo, setTipo] = useState(aliado.tipo ?? 'otro');
  const [contacto, setContacto] = useState(aliado.contacto ?? '');
  const [notas, setNotas] = useState(aliado.notas ?? '');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function guardar() {
    setError(null);
    startTransition(async () => {
      const res = await actualizarAliado({ id: aliado.id, nombre, tipo: tipo as any, contacto, notas });
      if (res.ok) setEditando(false);
      else setError(res.error);
    });
  }

  function cancelar() {
    setNombre(aliado.nombre);
    setTipo(aliado.tipo ?? 'otro');
    setContacto(aliado.contacto ?? '');
    setNotas(aliado.notas ?? '');
    setError(null);
    setEditando(false);
  }

  function eliminar() {
    if (!confirm(`¿Eliminar a ${aliado.nombre} del directorio?`)) return;
    startTransition(async () => {
      await eliminarAliado(aliado.id);
    });
  }

  if (editando) {
    return (
      <tr className="border-b border-marmol-100 last:border-0 bg-flow-50/40">
        <td className="px-4 py-2.5">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full rounded-lg border border-marmol-200 px-2 py-1 text-sm" />
        </td>
        <td className="px-4 py-2.5">
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="rounded-lg border border-marmol-200 px-2 py-1 text-xs">
            {TIPOS.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.etiqueta}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-2.5">
          <input value={contacto} onChange={(e) => setContacto(e.target.value)} className="w-full rounded-lg border border-marmol-200 px-2 py-1 text-sm" />
        </td>
        <td className="px-4 py-2.5">
          <input value={notas} onChange={(e) => setNotas(e.target.value)} className="w-full rounded-lg border border-marmol-200 px-2 py-1 text-sm" />
        </td>
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            <button onClick={guardar} disabled={pending || !nombre.trim()} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-2.5 py-1.5">
              <Check size={12} /> Guardar
            </button>
            <button onClick={cancelar} disabled={pending} className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 text-marmol-600 hover:bg-marmol-100 text-xs font-medium px-2.5 py-1.5">
              <X size={12} /> Cancelar
            </button>
          </div>
          {error && <p className="mt-1 text-xs text-bajo">{error}</p>}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-marmol-100 last:border-0">
      <td className="px-4 py-3 font-medium text-marmol-900">{aliado.nombre}</td>
      <td className="px-4 py-3 text-marmol-600">{(aliado.tipo && ETIQUETA_TIPO[aliado.tipo]) ?? aliado.tipo ?? '—'}</td>
      <td className="px-4 py-3 text-marmol-600">{aliado.contacto ?? '—'}</td>
      <td className="px-4 py-3 text-marmol-500">{aliado.notas ?? '—'}</td>
      {esAdminTh && (
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setEditando(true)} className="text-marmol-400 hover:text-flow-600">
              <Pencil size={13} />
            </button>
            <button onClick={eliminar} disabled={pending} className="text-marmol-400 hover:text-bajo disabled:opacity-40">
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}
