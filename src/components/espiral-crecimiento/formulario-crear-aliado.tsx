'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { crearAliado } from '@/app/(dashboard)/nexa/directorio/actions';
import { Plus } from 'lucide-react';

const TIPOS = [
  { valor: 'arl', etiqueta: 'ARL' },
  { valor: 'asesor_sst', etiqueta: 'Asesor SST' },
  { valor: 'proveedor_formacion', etiqueta: 'Proveedor de formación' },
  { valor: 'otro', etiqueta: 'Otro' },
] as const;

export function FormularioCrearAliado() {
  const router = useRouter();
  const [mostrar, setMostrar] = useState(false);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]['valor']>('arl');
  const [contacto, setContacto] = useState('');
  const [notas, setNotas] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function crear() {
    setError(null);
    startTransition(async () => {
      const res = await crearAliado({ nombre, tipo, contacto: contacto || undefined, notas: notas || undefined });
      if (res.ok) {
        setNombre('');
        setContacto('');
        setNotas('');
        setMostrar(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  if (!mostrar) {
    return (
      <button
        type="button"
        onClick={() => setMostrar(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3.5 py-2 transition"
      >
        <Plus size={16} /> Nuevo aliado
      </button>
    );
  }

  return (
    <div className="card p-4 space-y-3 max-w-md">
      <input
        type="text"
        placeholder="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
      />
      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value as typeof tipo)}
        className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
      >
        {TIPOS.map((t) => (
          <option key={t.valor} value={t.valor}>
            {t.etiqueta}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Contacto (teléfono, email…)"
        value={contacto}
        onChange={(e) => setContacto(e.target.value)}
        className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
      />
      <textarea
        placeholder="Notas (opcional)…"
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
      />
      {error && <p className="text-sm text-bajo">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending || !nombre}
          onClick={crear}
          className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 transition"
        >
          {pending ? 'Guardando…' : 'Agregar aliado'}
        </button>
        <button
          type="button"
          onClick={() => setMostrar(false)}
          className="rounded-lg border border-marmol-200 text-marmol-500 text-sm font-medium px-4 py-2 transition"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
