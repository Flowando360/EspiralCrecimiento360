import { FileText, File, Image as ImageIcon, Download, ExternalLink } from 'lucide-react';
import { formatearTamanoArchivo } from '@/lib/utils';

const EXTENSIONES_IMAGEN = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

function extension(nombre: string | null): string {
  if (!nombre) return '';
  return nombre.split('.').pop()?.toLowerCase() ?? '';
}

function IconoDocumento({ nombre }: { nombre: string | null }) {
  const ext = extension(nombre);
  if (ext === 'pdf') return <FileText size={20} className="text-red-500 shrink-0" />;
  if (EXTENSIONES_IMAGEN.includes(ext)) return <ImageIcon size={20} className="text-flow-500 shrink-0" />;
  return <File size={20} className="text-marmol-400 shrink-0" />;
}

export function TarjetaAdjuntoFeed({
  tipoAdjunto,
  archivoUrlFirmada,
  archivoNombre,
  archivoTamanoBytes,
  linkUrl,
  linkPreviewTitulo,
  linkPreviewImagen,
  linkPreviewDescripcion,
}: {
  tipoAdjunto: string;
  archivoUrlFirmada: string | null;
  archivoNombre: string | null;
  archivoTamanoBytes: number | null;
  linkUrl: string | null;
  linkPreviewTitulo: string | null;
  linkPreviewImagen: string | null;
  linkPreviewDescripcion: string | null;
}) {
  if (tipoAdjunto === 'documento' && archivoUrlFirmada) {
    return (
      <a
        href={archivoUrlFirmada}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center gap-2.5 rounded-lg border border-marmol-200 px-3 py-2.5 hover:bg-marmol-50 transition"
      >
        <IconoDocumento nombre={archivoNombre} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-marmol-800 truncate">{archivoNombre ?? 'Documento'}</p>
          {archivoTamanoBytes !== null && (
            <p className="text-xs text-marmol-400">{formatearTamanoArchivo(archivoTamanoBytes)}</p>
          )}
        </div>
        <Download size={16} className="text-marmol-400 shrink-0" />
      </a>
    );
  }

  if (tipoAdjunto === 'video_imagen' && archivoUrlFirmada) {
    const esImagen = EXTENSIONES_IMAGEN.includes(extension(archivoNombre));
    return (
      <div className="mt-2 rounded-lg overflow-hidden border border-marmol-200">
        {esImagen ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={archivoUrlFirmada} alt={archivoNombre ?? ''} className="w-full max-h-96 object-cover" />
        ) : (
          <video src={archivoUrlFirmada} controls className="w-full max-h-96" />
        )}
      </div>
    );
  }

  if (tipoAdjunto === 'link' && linkUrl) {
    const tieneVistaPrevia = linkPreviewTitulo || linkPreviewImagen || linkPreviewDescripcion;
    return (
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex gap-3 rounded-lg border border-marmol-200 overflow-hidden hover:bg-marmol-50 transition"
      >
        {linkPreviewImagen && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={linkPreviewImagen} alt="" className="w-20 h-20 object-cover shrink-0" />
        )}
        <div className="py-2 pr-3 min-w-0 flex-1">
          {tieneVistaPrevia ? (
            <>
              {linkPreviewTitulo && <p className="text-sm font-medium text-marmol-800 truncate">{linkPreviewTitulo}</p>}
              {linkPreviewDescripcion && (
                <p className="text-xs text-marmol-500 line-clamp-2 mt-0.5">{linkPreviewDescripcion}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-flow-600 truncate flex items-center gap-1">
              <ExternalLink size={12} /> {linkUrl}
            </p>
          )}
        </div>
      </a>
    );
  }

  return null;
}
