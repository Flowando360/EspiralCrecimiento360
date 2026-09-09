import Link from 'next/link';
import { notFound } from 'next/navigation';
import { obtenerModulo, obtenerPagina } from '@/content/ayuda';
import { ArrowLeft } from 'lucide-react';

export default function PaginaAyudaPage({ params }: { params: { slug: string; pagina: string } }) {
  const modulo = obtenerModulo(params.slug);
  const pagina = obtenerPagina(params.slug, params.pagina);
  if (!modulo || !pagina) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href={`/ayuda/modulo/${modulo.slug}`}
          className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2"
        >
          <ArrowLeft size={12} /> {modulo.titulo}
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario">{pagina.titulo}</h1>
        <p className="text-sm text-marmol-600 mt-2">{pagina.resumen}</p>
      </div>

      {pagina.camposYBotones && pagina.camposYBotones.length > 0 && (
        <div className="card p-5">
          <h2 className="font-display font-semibold text-secundario mb-3">Campos y botones</h2>
          <dl className="space-y-3">
            {pagina.camposYBotones.map((c) => (
              <div key={c.nombre}>
                <dt className="text-sm font-medium text-marmol-800">{c.nombre}</dt>
                <dd className="text-sm text-marmol-600">{c.explicacion}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {pagina.proceso && pagina.proceso.length > 0 && (
        <div className="card p-5">
          <h2 className="font-display font-semibold text-secundario mb-3">Proceso paso a paso</h2>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-marmol-700">
            {pagina.proceso.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ol>
        </div>
      )}

      {pagina.notas && pagina.notas.length > 0 && (
        <div className="space-y-2">
          {pagina.notas.map((n, i) => (
            <p key={i} className="text-sm text-marmol-600 bg-marmol-50 rounded-lg px-3 py-2.5">
              {n}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
