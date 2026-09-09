import Link from 'next/link';
import { notFound } from 'next/navigation';
import { obtenerModulo } from '@/content/ayuda';
import { ArrowLeft } from 'lucide-react';

export default function ModuloAyudaPage({ params }: { params: { slug: string } }) {
  const modulo = obtenerModulo(params.slug);
  if (!modulo) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/ayuda" className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2">
          <ArrowLeft size={12} /> Centro de Ayuda
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario">{modulo.titulo}</h1>
        <p className="text-sm text-marmol-500 mt-1">{modulo.descripcion}</p>
      </div>

      <div className="space-y-2">
        {modulo.paginas.map((p) => (
          <Link
            key={p.slug}
            href={`/ayuda/modulo/${modulo.slug}/${p.slug}`}
            className="block card p-4 hover:border-flow-300 transition"
          >
            <h2 className="font-medium text-marmol-900">{p.titulo}</h2>
            <p className="text-sm text-marmol-500 mt-0.5">{p.resumen}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
