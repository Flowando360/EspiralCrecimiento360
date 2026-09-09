interface NodoColaborador {
  id: string;
  nombre_completo: string;
  lider_id: string | null;
  es_externo: boolean;
  cargo: { nombre: string } | null;
}

function construirArbol(colaboradores: NodoColaborador[], liderId: string | null): NodoColaborador[] {
  return colaboradores.filter((c) => c.lider_id === liderId && !c.es_externo);
}

function NodoArbol({ nodo, colaboradores }: { nodo: NodoColaborador; colaboradores: NodoColaborador[] }) {
  const hijos = construirArbol(colaboradores, nodo.id);

  return (
    <div className="flex flex-col items-center">
      <div className="rounded-lg border border-marmol-200 bg-white px-3 py-2 text-center shadow-sm min-w-[150px]">
        <p className="text-xs font-semibold text-marmol-900">{nodo.nombre_completo}</p>
        <p className="text-[11px] text-marmol-400">{nodo.cargo?.nombre}</p>
      </div>
      {hijos.length > 0 && (
        <>
          <div className="w-px h-4 bg-marmol-300" />
          <div className="flex gap-6 pt-0 border-t border-marmol-300 relative">
            {hijos.map((h) => (
              <div key={h.id} className="pt-4">
                <NodoArbol nodo={h} colaboradores={colaboradores} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function OrganigramaArbol({ colaboradores }: { colaboradores: NodoColaborador[] }) {
  const raices = construirArbol(colaboradores, null);

  if (raices.length === 0) {
    return <p className="text-sm text-marmol-400">Sin organigrama cargado todavía.</p>;
  }

  return (
    <div className="flex gap-12 justify-center min-w-max px-4">
      {raices.map((r) => (
        <NodoArbol key={r.id} nodo={r} colaboradores={colaboradores} />
      ))}
    </div>
  );
}
