import Link from 'next/link';

/** Página que se muestra cuando la dirección no existe (o la persona no tiene permiso para verla). */
export default function NoEncontrada() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-marmol-50 px-6">
      <div className="card max-w-md w-full p-8 text-center space-y-4">
        <p className="text-sm font-medium text-marmol-400">Espiral de Crecimiento 360°</p>
        <h1 className="font-display text-2xl font-semibold text-secundario">No encontramos esta página</h1>
        <p className="text-sm text-marmol-600">
          Puede que la dirección esté mal escrita, que ya no exista, o que no tengas permiso para verla. Si crees que es un error, avísale a Talento Humano.
        </p>
        <Link href="/inicio" className="btn-primary text-sm">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
