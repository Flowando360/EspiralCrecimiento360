'use client';

import { useState, useTransition } from 'react';
import { guardarDatosEmpresa } from '@/app/(dashboard)/administracion/configuracion/actions';
import { Check } from 'lucide-react';

export interface DatosEmpresaIniciales {
  nit: string;
  direccion: string;
  telefono: string;
  ciudad: string;
  firmanteNombre: string;
  firmanteCargo: string;
  siglas: string;
}

const CAMPOS: { key: keyof DatosEmpresaIniciales; label: string }[] = [
  { key: 'nit', label: 'NIT' },
  { key: 'direccion', label: 'Dirección' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'ciudad', label: 'Ciudad' },
  { key: 'firmanteNombre', label: 'Nombre de quien firma el certificado laboral' },
  { key: 'firmanteCargo', label: 'Cargo de quien firma' },
  { key: 'siglas', label: 'Siglas (ej. "MyS") — las usa Guía del Flow para nombrar sus PDF' },
];

export function FormularioDatosEmpresa({ inicial }: { inicial: DatosEmpresaIniciales }) {
  const [datos, setDatos] = useState(inicial);
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<{ ok: boolean; error?: string } | null>(null);

  function guardar() {
    startTransition(async () => {
      const res = await guardarDatosEmpresa(datos);
      setResultado(res);
    });
  }

  return (
    <div className="card p-5 space-y-4">
      <div>
        <h2 className="font-display font-semibold text-secundario">Datos de la empresa</h2>
        <p className="text-xs text-marmol-400 mt-0.5">Se usan para generar el certificado laboral.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {CAMPOS.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs text-marmol-500 mb-1">{label}</label>
            <input
              value={datos[key]}
              onChange={(e) => {
                setDatos((prev) => ({ ...prev, [key]: e.target.value }));
                setResultado(null);
              }}
              className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          disabled={pending}
          onClick={guardar}
          className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 transition"
        >
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </button>
        {resultado?.ok && (
          <p className="text-xs text-alto flex items-center gap-1">
            <Check size={12} /> Guardado
          </p>
        )}
        {resultado && !resultado.ok && <p className="text-xs text-bajo">{resultado.error}</p>}
      </div>
    </div>
  );
}
