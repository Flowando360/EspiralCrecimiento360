'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { actualizarDatosEmpresa } from '@/app/(dashboard)/meta-admin/actions';

const CAMPO = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';

export interface EmpresaEditable {
  id: string;
  nombre: string;
  logo_url: string | null;
  color_marca: string | null;
  color_secundario: string | null;
  color_acento: string | null;
}

export function EditarDatosEmpresa({ empresa }: { empresa: EmpresaEditable }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(empresa.nombre);
  const [logoUrl, setLogoUrl] = useState(empresa.logo_url ?? '');
  const [colorMarca, setColorMarca] = useState(empresa.color_marca ?? '#16A34A');
  const [colorSecundario, setColorSecundario] = useState(empresa.color_secundario ?? '#1E3A8A');
  const [colorAcento, setColorAcento] = useState(empresa.color_acento ?? '#A3E635');
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function guardar() {
    setMensaje(null);
    startTransition(async () => {
      const res = await actualizarDatosEmpresa({
        empresaId: empresa.id,
        nombre,
        logoUrl: logoUrl || null,
        colorMarca,
        colorSecundario,
        colorAcento,
      });
      setMensaje(res.ok ? { ok: true, texto: 'Datos guardados.' } : { ok: false, texto: res.error });
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="card p-5 space-y-4">
      <h2 className="font-semibold text-marmol-800">Datos y marca</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-marmol-500 mb-1">Nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={CAMPO} />
        </div>
        <div>
          <label className="block text-xs text-marmol-500 mb-1">Logo (ruta o URL)</label>
          <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className={CAMPO} />
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        {[
          { label: 'Principal', valor: colorMarca, set: setColorMarca },
          { label: 'Secundario', valor: colorSecundario, set: setColorSecundario },
          { label: 'Acento', valor: colorAcento, set: setColorAcento },
        ].map((c) => (
          <label key={c.label} className="flex items-center gap-2 text-sm text-marmol-700">
            <input type="color" value={c.valor} onChange={(e) => c.set(e.target.value.toUpperCase())} className="h-8 w-10 rounded border border-marmol-200" />
            {c.label} <span className="font-mono text-xs text-marmol-400">{c.valor}</span>
          </label>
        ))}
      </div>
      {mensaje && <p className={mensaje.ok ? 'text-sm text-flow-700' : 'text-sm text-bajo'}>{mensaje.texto}</p>}
      <button
        type="button"
        onClick={guardar}
        disabled={pending}
        className="rounded-lg bg-flow-600 hover:bg-flow-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-60"
      >
        {pending ? 'Guardando…' : 'Guardar datos'}
      </button>
    </div>
  );
}
