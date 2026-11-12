import { Download, QrCode, Image as ImagenIcono } from 'lucide-react';

const boton = 'inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 bg-white px-3 py-1.5 text-xs font-medium text-marmol-700 transition';

/** Material para difundir la vacante: código QR del formulario público e imagen para redes sociales con la marca de la empresa. */
export function DifusionVacante({ vacanteId }: { vacanteId: string }) {
  const base = `/api/reclutamiento/vacantes/${vacanteId}`;
  return (
    <div className="card p-4 space-y-3">
      <div>
        <h2 className="font-display font-semibold text-secundario">Difusión de la vacante</h2>
        <p className="text-xs text-marmol-400 mt-0.5 max-w-2xl">
          Descarga el material listo para publicar: el código QR lleva directo al formulario de postulación (ferias, carteleras, volantes) y la imagen ya trae la marca de tu empresa, los datos de la oferta y el QR. Completa antes modalidad, ciudad, horario y requisitos para que quede útil.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={`${base}/qr?formato=png`} download className={boton}>
          <QrCode size={13} /> QR (PNG)
        </a>
        <a href={`${base}/qr?formato=svg`} download className={boton}>
          <QrCode size={13} /> QR (SVG, para imprimir)
        </a>
        <a href={`${base}/imagen?formato=cuadrada`} download className={boton}>
          <ImagenIcono size={13} /> Imagen cuadrada (Instagram, Facebook, LinkedIn)
        </a>
        <a href={`${base}/imagen?formato=historia`} download className={boton}>
          <Download size={13} /> Imagen vertical (historias y WhatsApp)
        </a>
      </div>
    </div>
  );
}
