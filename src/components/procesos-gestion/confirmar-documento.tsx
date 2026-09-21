'use client';

import { useState, useTransition } from 'react';
import { confirmarLectura } from '@/app/(dashboard)/procesos-gestion/documentos/actions';
import { Check, FileText, ExternalLink } from 'lucide-react';

export function ConfirmarDocumento({
  documentoId,
  yaConfirmeInicial,
  totalConfirmaciones,
}: {
  documentoId: string;
  yaConfirmeInicial: boolean;
  totalConfirmaciones: number;
}) {
  const [confirmado, setConfirmado] = useState(yaConfirmeInicial);
  const [total, setTotal] = useState(totalConfirmaciones);
  const [comentario, setComentario] = useState('');
  const [mostrarComentario, setMostrarComentario] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirmar() {
    setError(null);
    startTransition(async () => {
      const res = await confirmarLectura(documentoId, comentario || undefined);
      if (res.ok) {
        setConfirmado(true);
        setTotal((t) => t + (yaConfirmeInicial ? 0 : 1));
      } else {
        setError(res.error);
      }
    });
  }

  if (confirmado) {
    return (
      <div className="rounded-lg bg-flow-50 border border-flow-200 p-4 text-center">
        <Check className="mx-auto text-alto mb-1" size={22} />
        <p className="text-sm font-medium text-marmol-800">Ya confirmaste la lectura de este documento.</p>
        <p className="text-xs text-marmol-400 mt-1">{total} persona{total !== 1 ? 's' : ''} han confirmado en total.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {mostrarComentario && (
        <input
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Comentario o pregunta (opcional)"
          className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
        />
      )}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={confirmar}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2"
        >
          <Check size={15} /> {pending ? 'Confirmando…' : 'Confirmar que lo leí'}
        </button>
        {!mostrarComentario && (
          <button onClick={() => setMostrarComentario(true)} className="text-xs text-marmol-500 hover:text-flow-600">
            Agregar comentario
          </button>
        )}
      </div>
      {error && <p className="text-sm text-bajo">{error}</p>}
      <p className="text-xs text-marmol-400">{total} persona{total !== 1 ? 's' : ''} han confirmado hasta ahora.</p>
    </div>
  );
}

export function VerDocumentoLink({ url }: { url: string | null }) {
  if (!url) return <p className="text-xs text-marmol-400">Sin archivo adjunto todavía.</p>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:bg-marmol-50 text-marmol-600 text-sm font-medium px-3.5 py-2"
    >
      <FileText size={15} /> Ver documento <ExternalLink size={12} />
    </a>
  );
}
