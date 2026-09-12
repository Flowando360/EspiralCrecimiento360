'use client';

import { useRef, useState, useTransition } from 'react';
import { Sparkles, Check } from 'lucide-react';
import { extraerDatosHojaVida } from '@/app/(dashboard)/espiral-crecimiento/colaboradores/ia-actions';

interface DatosHojaVida {
  nombre_completo?: string;
  numero_documento?: string;
  email?: string;
  telefono?: string;
}

/**
 * Sube una hoja de vida en PDF, la lee con IA y entrega al formulario que la
 * use los campos que pudo identificar (nombre, documento, correo, teléfono)
 * — quien la usa decide qué hacer con esos datos (normalmente, prellenar
 * campos que la persona luego puede corregir). No guarda el archivo en
 * ningún lado; eso se sigue haciendo aparte, desde Documentos en la ficha.
 */
export function CargaHojaVidaIA({ onDatos }: { onDatos: (datos: DatosHojaVida) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [camposEncontrados, setCamposEncontrados] = useState<string[] | null>(null);

  const ETIQUETAS: Record<string, string> = {
    nombre_completo: 'nombre',
    numero_documento: 'documento',
    email: 'correo',
    telefono: 'teléfono',
  };

  function archivoSeleccionado(file: File | undefined) {
    if (!file) return;
    setError(null);
    setCamposEncontrados(null);
    const formData = new FormData();
    formData.append('archivo', file);
    startTransition(async () => {
      const res = await extraerDatosHojaVida(formData);
      if (res.ok) {
        onDatos(res.datos);
        setCamposEncontrados(Object.keys(res.datos));
      } else {
        setError(res.error);
      }
      if (inputRef.current) inputRef.current.value = '';
    });
  }

  return (
    <div className="rounded-lg border border-dashed border-flow-200 bg-flow-50/40 px-3 py-2.5">
      <label className="flex items-center gap-2 text-xs font-medium text-flow-700 cursor-pointer">
        <Sparkles size={14} />
        {pending ? 'Leyendo la hoja de vida…' : 'Cargar hoja de vida (PDF) y prellenar con IA'}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          disabled={pending}
          onChange={(e) => archivoSeleccionado(e.target.files?.[0])}
          className="hidden"
        />
      </label>
      <p className="text-[11px] text-marmol-400 mt-1">
        Solo lee nombre, documento, correo y teléfono — revisa y corrige lo que necesites antes de guardar.
      </p>
      {camposEncontrados && (
        <p className="text-[11px] text-alto mt-1 flex items-center gap-1">
          <Check size={11} /> Se llenaron: {camposEncontrados.map((c) => ETIQUETAS[c] ?? c).join(', ')}
        </p>
      )}
      {error && <p className="text-[11px] text-bajo mt-1">{error}</p>}
    </div>
  );
}
