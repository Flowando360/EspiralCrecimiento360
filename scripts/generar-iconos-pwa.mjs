import { Jimp } from 'jimp';
import { mkdir, copyFile } from 'node:fs/promises';

// Genera favicon + íconos PWA a partir del logo real de Espiral de
// Crecimiento 360° (LogoEspiral_3.png, el isotipo/ícono sin texto).
const BLANCO = 0xffffffff;
const FUENTE = 'public/marca/EspiralIsotipo.png';

const TAMANOS = [
  { destino: 'public/icons/icon-192.png', size: 192, margen: 0.12 },
  { destino: 'public/icons/icon-512.png', size: 512, margen: 0.12 },
  { destino: 'public/icons/icon-maskable-512.png', size: 512, margen: 0.22 },
  { destino: 'public/icons/apple-touch-icon.png', size: 180, margen: 0.12 },
  { destino: 'src/app/icon.png', size: 512, margen: 0.12 },
];

async function generar() {
  await mkdir('public/icons', { recursive: true });
  await mkdir('public/marca', { recursive: true });
  await copyFile('LogoEspiral_3.png', FUENTE);

  const original = await Jimp.read(FUENTE);
  original.autocrop();

  for (const { destino, size, margen } of TAMANOS) {
    const interior = Math.round(size * (1 - margen * 2));
    const logo = original.clone().contain({ w: interior, h: interior });
    const lienzo = new Jimp({ width: size, height: size, color: BLANCO });
    lienzo.composite(logo, Math.round((size - logo.width) / 2), Math.round((size - logo.height) / 2));
    await lienzo.write(destino);
    console.log(`Generado ${destino}`);
  }
}

generar().catch((e) => {
  console.error(e);
  process.exit(1);
});
