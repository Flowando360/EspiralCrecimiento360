import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Espiral de Crecimiento 360° | Flow, Nexus y Visión',
    short_name: 'Espiral 360°',
    description:
      'Plataforma de Encuentros de Crecimiento 360° Ser · Saber · Hacer · Deber y gestión de talento humano.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#ffffff',
    theme_color: '#16a34a',
    lang: 'es',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
