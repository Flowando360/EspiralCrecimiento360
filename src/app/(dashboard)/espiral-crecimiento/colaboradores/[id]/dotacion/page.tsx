import DotacionPage from '@/app/(dashboard)/dotacion/page';

/**
 * Dotación de una persona, abierta desde su ficha. Vive bajo Espiral 360° (y no bajo /dotacion) para que un rol
 * personalizado sin el módulo «Dotaciones» pueda abrir la dotación de la persona sin que lo devuelvan al Inicio.
 * Los datos siguen protegidos por RLS (TH todo, líder su equipo, colaborador lo propio).
 */
export default function DotacionDeLaFicha({ params }: { params: { id: string } }) {
  return <DotacionPage searchParams={{ colaborador_id: params.id }} />;
}
