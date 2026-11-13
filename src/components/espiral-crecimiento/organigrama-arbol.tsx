interface NodoColaborador {
  id: string;
  nombre_completo: string;
  lider_id: string | null;
  es_externo: boolean;
  estado?: string;
  tipo_externo?: string | null;
  cargo: { nombre: string } | null;
}

function construirArbol(colaboradores: NodoColaborador[], liderId: string | null): NodoColaborador[] {
  return colaboradores.filter((c) => c.lider_id === liderId && !c.es_externo);
}

interface Dependencia {
  colaborador_id: string;
  lider_funcional_id: string;
  tipo: string;
  detalle: string | null;
}

function NodoArbol({ nodo, colaboradores, dependencias }: { nodo: NodoColaborador; colaboradores: NodoColaborador[]; dependencias: Dependencia[] }) {
  const hijos = construirArbol(colaboradores, nodo.id);
  const externos = colaboradores.filter((c) => c.lider_id === nodo.id && c.es_externo);
  // Matricial: quienes lo tienen como líder funcional o de proyecto, y a quién más reporta él.
  const nombrePor = new Map(colaboradores.map((c) => [c.id, c.nombre_completo]));
  const aSuCargoFuncional = dependencias.filter((d) => d.lider_funcional_id === nodo.id).map((d) => ({ nombre: nombrePor.get(d.colaborador_id), detalle: d.detalle })).filter((x) => x.nombre);
  const tambienReportaA = dependencias.filter((d) => d.colaborador_id === nodo.id).map((d) => nombrePor.get(d.lider_funcional_id)).filter(Boolean) as string[];

  return (
    <div className="flex flex-col items-center">
      <div className="rounded-lg border border-marmol-200 bg-white px-3 py-2 text-center shadow-sm min-w-[150px]">
        <p className="text-xs font-semibold text-marmol-900">{nodo.nombre_completo}</p>
        <p className="text-[13px] text-marmol-400">{nodo.cargo?.nombre}</p>
        {nodo.estado === 'periodo_prueba' && <p className="text-[11px] text-medio">Período de prueba</p>}
        {tambienReportaA.length > 0 && <p className="text-[11px] text-flow-700">↗ también reporta a {tambienReportaA.join(', ')}</p>}
      </div>
      {aSuCargoFuncional.length > 0 && (
        <div className="mt-2 max-w-[220px] rounded-lg border border-dashed border-flow-300 bg-flow-50 px-2 py-1.5 text-center">
          <p className="text-[11px] font-medium text-flow-700">Línea funcional ({aSuCargoFuncional.length})</p>
          <p className="text-[11px] text-marmol-500 leading-snug">
            {aSuCargoFuncional.slice(0, 4).map((x) => (x.detalle ? `${x.nombre} (${x.detalle})` : x.nombre)).join(' · ')}
            {aSuCargoFuncional.length > 4 ? ` · +${aSuCargoFuncional.length - 4} más` : ''}
          </p>
        </div>
      )}
      {externos.length > 0 && (
        <div className="mt-2 max-w-[220px] rounded-lg border border-dashed border-marmol-300 bg-marmol-50 px-2 py-1.5 text-center">
          <p className="text-[11px] font-medium text-marmol-500">Externos ({externos.length})</p>
          <p className="text-[11px] text-marmol-400 leading-snug">
            {externos.slice(0, 4).map((x) => x.nombre_completo).join(' · ')}
            {externos.length > 4 ? ` · +${externos.length - 4} más` : ''}
          </p>
        </div>
      )}
      {hijos.length > 0 && (
        <>
          <div className="w-px h-4 bg-marmol-300" />
          <div className="flex gap-6 pt-0 border-t border-marmol-300 relative">
            {hijos.map((h) => (
              <div key={h.id} className="pt-4">
                <NodoArbol nodo={h} colaboradores={colaboradores} dependencias={dependencias} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function OrganigramaArbol({ colaboradores, dependencias = [] }: { colaboradores: NodoColaborador[]; dependencias?: Dependencia[] }) {
  const raices = construirArbol(colaboradores, null);

  if (raices.length === 0) {
    return <p className="text-sm text-marmol-400">Sin organigrama cargado todavía.</p>;
  }

  return (
    <div className="flex gap-12 justify-center min-w-max px-4">
      {raices.map((r) => (
        <NodoArbol key={r.id} nodo={r} colaboradores={colaboradores} dependencias={dependencias} />
      ))}
    </div>
  );
}
