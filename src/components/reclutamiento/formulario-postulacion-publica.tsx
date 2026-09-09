'use client';

import { useState, useTransition } from 'react';
import { enviarPostulacion } from '@/app/postular/[vacanteId]/actions';
import { CheckCircle2 } from 'lucide-react';

export function FormularioPostulacionPublica({ vacanteId }: { vacanteId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  function enviar(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await enviarPostulacion(formData);
      if (res.ok) setEnviado(true);
      else setError(res.error);
    });
  }

  if (enviado) {
    return (
      <div className="text-center py-4">
        <CheckCircle2 size={36} className="text-alto mx-auto mb-2" />
        <p className="font-medium text-marmol-800">¡Postulación enviada!</p>
        <p className="text-sm text-marmol-500 mt-1">Gracias por tu interés. Si tu perfil encaja, te contactaremos.</p>
      </div>
    );
  }

  const campo = 'w-full rounded-lg border border-marmol-200 px-3 py-2 text-sm';
  const label = 'block text-xs text-marmol-500 mb-1';

  return (
    <form action={enviar} className="space-y-3">
      <input type="hidden" name="vacanteId" value={vacanteId} />
      <div>
        <label className={label}>Nombre completo *</label>
        <input className={campo} name="nombreCompleto" required maxLength={200} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Número de documento</label>
          <input className={campo} name="numeroDocumento" maxLength={50} />
        </div>
        <div>
          <label className={label}>Teléfono</label>
          <input className={campo} name="telefono" maxLength={30} />
        </div>
      </div>
      <div>
        <label className={label}>Correo electrónico</label>
        <input className={campo} type="email" name="correo" maxLength={200} />
      </div>
      <div>
        <label className={label}>Perfil de LinkedIn (opcional)</label>
        <input className={campo} name="linkedinUrl" placeholder="https://linkedin.com/in/…" maxLength={300} />
      </div>
      <div>
        <label className={label}>Hoja de vida (PDF o Word, máx. 8 MB)</label>
        <input className="w-full text-sm" type="file" name="hojaVida" accept=".pdf,.doc,.docx" />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 transition"
      >
        {pending ? 'Enviando…' : 'Enviar postulación'}
      </button>
      {error && <p className="text-xs text-bajo">{error}</p>}
    </form>
  );
}
