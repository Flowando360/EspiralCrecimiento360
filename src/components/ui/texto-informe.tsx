import { Fragment, type ReactNode } from 'react';

/**
 * Muestra un texto generado con IA que puede traer formato sencillo (títulos con #, **negritas**, listas con - o 1.).
 * No usa HTML crudo: solo arma elementos de React, así que es seguro con cualquier texto.
 */
export function TextoInforme({ texto, className = '' }: { texto: string; className?: string }) {
  const bloques: ReactNode[] = [];
  let lista: { ordenada: boolean; items: string[] } | null = null;

  const cerrarLista = () => {
    if (!lista) return;
    const items = lista.items.map((it, i) => <li key={i}>{enLinea(it)}</li>);
    bloques.push(
      lista.ordenada ? (
        <ol key={bloques.length} className="list-decimal pl-5 space-y-1">
          {items}
        </ol>
      ) : (
        <ul key={bloques.length} className="list-disc pl-5 space-y-1">
          {items}
        </ul>
      )
    );
    lista = null;
  };

  for (const cruda of texto.replace(/\r\n/g, '\n').split('\n')) {
    const linea = cruda.trim();
    if (!linea || /^-{3,}$/.test(linea)) {
      cerrarLista();
      continue;
    }
    const titulo = linea.match(/^#{1,6}\s+(.*)$/);
    if (titulo) {
      cerrarLista();
      bloques.push(
        <p key={bloques.length} className="font-semibold text-marmol-800 pt-1">
          {enLinea(titulo[1] ?? '')}
        </p>
      );
      continue;
    }
    const vineta = linea.match(/^[-•*]\s+(.*)$/);
    const numerada = linea.match(/^\d+[.)]\s+(.*)$/);
    if (vineta || numerada) {
      const ordenada = Boolean(numerada);
      if (!lista || lista.ordenada !== ordenada) {
        cerrarLista();
        lista = { ordenada, items: [] };
      }
      lista.items.push((vineta ?? numerada)![1] ?? '');
      continue;
    }
    cerrarLista();
    bloques.push(<p key={bloques.length}>{enLinea(linea)}</p>);
  }
  cerrarLista();

  return <div className={`space-y-2 ${className}`}>{bloques}</div>;
}

/** **negrita** dentro de una línea; cualquier asterisco suelto que quede se retira. */
function enLinea(texto: string): ReactNode {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g);
  return partes.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') && p.length > 4 ? <strong key={i}>{p.slice(2, -2)}</strong> : <Fragment key={i}>{p.replace(/\*\*/g, '')}</Fragment>
  );
}
