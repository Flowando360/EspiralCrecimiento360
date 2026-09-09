import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegister } from '@/components/pwa-register';

export const metadata: Metadata = {
  title: 'Espiral de Crecimiento 360° | Flow, Nexus y Visión',
  description:
    'Plataforma de Encuentros de Crecimiento 360° Ser · Saber · Hacer · Deber y gestión de talento humano, por FlowAndo.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Espiral de Crecimiento',
  },
};

export const viewport: Viewport = {
  themeColor: '#16a34a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
