'use client';

import { useState, useTransition } from 'react';
import { enviarSolicitudTitular } from '@/app/ejercer-derechos/actions';
import { CheckCircle2 } from 'lucide-react';

export function FormularioDerechos({ vacanteId }: { vacanteId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  function enviar(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await enviarSolicitudTitular(formData);
      if (res.ok) setEnviado(true);
      else setError(res.error);
    });
  }

  if (enviado) {
    return (
      <div className="text-center py-4">
        <CheckCircle2 size={36} className="text-alto mx-auto mb-2" />
        <p className="font-medium text-marmol-800">Solicitud recibida</p>
        <p className="text-sm text-marmol-500 mt-1">Te responderemos al correo que indicaste.</p>
      </div>
    );
  }

  const campo = 'w-full rounded-lg border border-marmol-200 px-3 py-2 text-sm';
  const label = 'block text-xs text-marmol-500 mb-1';

  return (
    <form action={enviar} className="space-y-3">
      <input type="hidden" name="vacanteId" value={vacanteId} />
      <div>
        <label className={label}>¿Qué quieres hacer?</label>
        <select name="tipo" className={campo} defaultValue="consulta">
          <option value="consulta">Conocer qué datos tienen de mí</option>
          <option value="correccion">Corregir mis datos</option>
          <option value="revocacion">Revocar mi autorización</option>
          <option value="supresion">Suprimir mis datos</option>
        </select>
      </div>
      <div>
        <label className={label}>Nombre completo *</label>
        <input className={campo} name="nombreTitular" required maxLength={200} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Número de documento</label>
          <input className={campo} name="numeroDocumento" maxLength={50} />
        </div>
        <div>
          <label className={label}>Correo para responderte *</label>
          <input className={campo} type="email" name="correo" required maxLength={200} />
        </div>
      </div>
      <div>
        <label className={label}>Detalle de tu solicitud *</label>
        <textarea className={campo} name="detalle" rows={3} required minLength={10} maxLength={2000} />
      </div>
      <button type="submit" disabled={pending} className="w-full rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5">
        {pending ? 'Enviando…' : 'Enviar solicitud'}
      </button>
      {error && <p className="text-xs text-bajo">{error}</p>}
    </form>
  );
}
