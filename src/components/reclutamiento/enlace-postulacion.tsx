'use client';

import { useEffect, useState } from 'react';
import { Link2, Check } from 'lucide-react';

export function EnlacePostulacion({ vacanteId }: { vacanteId: string }) {
  const [copiado, setCopiado] = useState(false);
  const [url, setUrl] = useState('');

  // El origin solo existe en el navegador — se resuelve al montar para
  // evitar desajustes de hidratación entre servidor y cliente.
  useEffect(() => {
    setUrl(`${window.location.origin}/postular/${vacanteId}`);
  }, [vacanteId]);

  function copiar() {
    navigator.clipboard.writeText(url).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  return (
    <div className="card p-4 flex items-center justify-between gap-3 bg-flow-50/50 border-flow-100">
      <div className="flex items-center gap-2 min-w-0">
        <Link2 size={16} className="text-flow-600 shrink-0" />
        <p className="text-sm text-marmol-600 truncate">
          Formulario público de postulación: <span className="font-medium text-marmol-800">{url || '…'}</span>
        </p>
      </div>
      <button
        type="button"
        onClick={copiar}
        disabled={!url}
        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:bg-white text-marmol-700 text-xs font-medium px-3 py-1.5 transition"
      >
        {copiado ? (
          <>
            <Check size={13} className="text-alto" /> Copiado
          </>
        ) : (
          'Copiar enlace'
        )}
      </button>
    </div>
  );
}
