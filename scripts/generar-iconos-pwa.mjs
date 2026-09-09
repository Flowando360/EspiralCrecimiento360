import { Jimp, JimpMime } from 'jimp';
import { mkdir } from 'node:fs/promises';

// Placeholder de marca para esta copia de demostración (Espiral de
// Crecimiento 360° / Flow, Nexus y Visión): ícono plano en el verde de
// marca, sin logo — todavía no hay un logo diseñado para esta empresa
// ficticia. Cuando exista un logo real, reemplazar este script por uno que
// lo recorte igual que hace el aplicativo original con su propio logo.
const VERDE = 0x16a34aff; // flow-500
const BLANCO = 0xffffffff;
const TAMANOS = [
  { nombre: 'icon-192.png', size: 192, fondo: VERDE },
  { nombre: 'icon-512.png', size: 512, fondo: VERDE },
  { nombre: 'icon-maskable-512.png', size: 512, fondo: VERDE },
  { nombre: 'apple-touch-icon.png', size: 180, fondo: VERDE },
];

async function generar() {
  await mkdir('public/icons', { recursive: true });

  for (const { nombre, size, fondo } of TAMANOS) {
    const lienzo = new Jimp({ width: size, height: size, color: fondo });
    // Anillo blanco simple (evoca "espiral"/crecimiento) mientras se define un logo real.
    const grosor = Math.round(size * 0.07);
    const radioExterno = size * 0.32;
    const cx = size / 2;
    const cy = size / 2;
    lienzo.scan(0, 0, size, size, function (x, y, idx) {
      const d = Math.hypot(x - cx, y - cy);
      if (d < radioExterno && d > radioExterno - grosor) {
        this.bitmap.data.writeUInt32BE(BLANCO, idx);
      }
    });
    await lienzo.write(`public/icons/${nombre}`, { mime: JimpMime.png });
    console.log(`Generado public/icons/${nombre}`);
  }
}

generar().catch((e) => {
  console.error(e);
  process.exit(1);
});
