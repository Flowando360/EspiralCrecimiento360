'use client';

import { useState, useTransition } from 'react';
import { Trash2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { actualizarEstadoDocumento, eliminarDocumentoPolitica } from '@/app/(dashboard)/nexa/asistente/documentos/actions';

const ETIQUETA_CATEGORIA: Record<string, string> = {
  sst: 'SST',
  politicas: 'Políticas',
  procedimientos: 'Procedimientos',
  otro: 'Otro',
};

interface Documento {
  id: string;
  titulo: string;
  categoria: string;
  activo: boolean;
  archivo_url: string | null;
  created_at: string;
  contenido: string;
}

export function ListaDocumentosPolitica({ documentosIniciales }: { documentosIniciales: Documento[] }) {
  const [documentos, setDocumentos] = useState(documentosIniciales);
  const [, startTransition] = useTransition();

  function alternarActivo(id: string, activo: boolean) {
    setDocumentos((prev) => prev.map((d) => (d.id === id ? { ...d, activo } : d)));
    startTransition(async () => {
      await actualizarEstadoDocumento(id, activo);
    });
  }

  function borrar(id: string) {
    setDocumentos((prev) => prev.filter((d) => d.id !== id));
    startTransition(async () => {
      await eliminarDocumentoPolitica(id);
    });
  }

  return (
    <div className="card divide-y divide-marmol-100">
      {documentos.map((d) => (
        <div key={d.id} className="flex items-start justify-between gap-3 px-4 py-3">
          <div className="min-w-0 flex items-start gap-2">
            <FileText size={16} className="text-marmol-300 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-marmol-800">{d.titulo}</p>
              <p className="text-xs text-marmol-400 mt-0.5">
                {ETIQUETA_CATEGORIA[d.categoria] ?? d.categoria} · {d.contenido.length.toLocaleString('es-CO')} caracteres
                {!d.archivo_url && ' · texto pegado'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <label className="flex items-center gap-1.5 text-xs text-marmol-500 cursor-pointer">
              <input type="checkbox" checked={d.activo} onChange={(e) => alternarActivo(d.id, e.target.checked)} />
              {d.activo ? 'Activo' : 'Inactivo'}
            </label>
            <button onClick={() => borrar(d.id)} className={cn('text-marmol-300 hover:text-bajo')}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
