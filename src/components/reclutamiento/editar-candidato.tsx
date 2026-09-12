'use client';

import { useRef, useState, useTransition } from 'react';
import { Pencil, Check, X, Upload } from 'lucide-react';
import { actualizarCandidato, subirHojaVidaCandidato } from '@/app/(dashboard)/reclutamiento/actions';

export function EditarCandidato({
  candidatoId,
  datosIniciales,
}: {
  candidatoId: string;
  datosIniciales: { nombreCompleto: string; correo: string; telefono: string; linkedinUrl: string; notas: string };
}) {
  const [editando, setEditando] = useState(false);
  const [nombreCompleto, setNombreCompleto] = useState(datosIniciales.nombreCompleto);
  const [correo, setCorreo] = useState(datosIniciales.correo);
  const [telefono, setTelefono] = useState(datosIniciales.telefono);
  const [linkedinUrl, setLinkedinUrl] = useState(datosIniciales.linkedinUrl);
  const [notas, setNotas] = useState(datosIniciales.notas);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function guardar() {
    setError(null);
    startTransition(async () => {
      const res = await actualizarCandidato({ candidatoId, nombreCompleto, correo, telefono, linkedinUrl, notas });
      if (res.ok) setEditando(false);
      else setError(res.error);
    });
  }

  function cancelar() {
    setNombreCompleto(datosIniciales.nombreCompleto);
    setCorreo(datosIniciales.correo);
    setTelefono(datosIniciales.telefono);
    setLinkedinUrl(datosIniciales.linkedinUrl);
    setNotas(datosIniciales.notas);
    setError(null);
    setEditando(false);
  }

  const campo = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';
  const label = 'block text-xs text-marmol-500 mb-1';

  if (!editando) {
    return (
      <button type="button" onClick={() => setEditando(true)} className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-flow-600">
        <Pencil size={12} /> Editar datos
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div>
        <label className={label}>Nombre completo</label>
        <input value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} className={campo} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={label}>Correo</label>
          <input value={correo} onChange={(e) => setCorreo(e.target.value)} className={campo} />
        </div>
        <div>
          <label className={label}>Teléfono</label>
          <input value={telefono} onChange={(e) => setTelefono(e.target.value)} className={campo} />
        </div>
      </div>
      <div>
        <label className={label}>Perfil de LinkedIn</label>
        <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/…" className={campo} />
      </div>
      <div>
        <label className={label}>Notas del reclutador</label>
        <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} placeholder="Comentarios sobre el desempeño en entrevistas, impresión general…" className={campo} />
      </div>
      {error && <p className="text-xs text-bajo">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={guardar}
          disabled={pending || !nombreCompleto.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-2.5 py-1.5"
        >
          <Check size={12} /> {pending ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" onClick={cancelar} disabled={pending} className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 text-marmol-600 hover:bg-marmol-100 text-xs font-medium px-2.5 py-1.5">
          <X size={12} /> Cancelar
        </button>
      </div>
    </div>
  );
}

/** Botón compacto para subir (o reemplazar) la hoja de vida de un candidato ya en el banco. */
export function SubirHojaVidaCandidato({ candidatoId }: { candidatoId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function archivoSeleccionado(file: File | undefined) {
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.append('candidatoId', candidatoId);
    formData.append('archivo', file);
    startTransition(async () => {
      const res = await subirHojaVidaCandidato(formData);
      if (!res.ok) setError(res.error);
      if (inputRef.current) inputRef.current.value = '';
    });
  }

  return (
    <div>
      <label className="inline-flex items-center gap-1.5 text-xs text-flow-600 hover:text-flow-700 font-medium cursor-pointer">
        <Upload size={13} /> {pending ? 'Subiendo…' : 'Subir / reemplazar hoja de vida'}
        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" disabled={pending} onChange={(e) => archivoSeleccionado(e.target.files?.[0])} className="hidden" />
      </label>
      {error && <p className="text-xs text-bajo mt-1">{error}</p>}
    </div>
  );
}
