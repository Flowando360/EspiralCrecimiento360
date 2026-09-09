'use client';

import { useState, useTransition } from 'react';
import { previsualizarPerfilCargo, guardarPerfilCargoImportado } from '@/app/(dashboard)/administracion/cargos/actions';
import type { PerfilCargoParseado } from '@/lib/importador-perfil-cargo';
import { AlertTriangle, Check, Upload, FileSpreadsheet } from 'lucide-react';

export function ImportadorPerfilCargo() {
  const [mostrar, setMostrar] = useState(false);
  const [datos, setDatos] = useState<PerfilCargoParseado | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ ok: boolean; esNuevo?: boolean } | null>(null);

  function analizar(formData: FormData) {
    setError(null);
    setResultado(null);
    startTransition(async () => {
      const res = await previsualizarPerfilCargo(formData);
      if (res.ok) setDatos(res.datos);
      else setError(res.error);
    });
  }

  function guardar() {
    if (!datos) return;
    startTransition(async () => {
      const res = await guardarPerfilCargoImportado(datos);
      if (res.ok) {
        setResultado({ ok: true, esNuevo: res.esNuevo });
      } else {
        setError(res.error);
      }
    });
  }

  function reiniciar() {
    setDatos(null);
    setError(null);
    setResultado(null);
  }

  if (!mostrar) {
    return (
      <button
        type="button"
        onClick={() => setMostrar(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3.5 py-2 transition"
      >
        <FileSpreadsheet size={16} /> Importar perfil de cargo
      </button>
    );
  }

  return (
    <div className="card p-5 space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-secundario">Importar perfil de cargo (Excel FORSST 61)</h2>
        <button
          type="button"
          onClick={() => {
            setMostrar(false);
            reiniciar();
          }}
          className="text-xs text-marmol-400 hover:text-marmol-600"
        >
          Cerrar
        </button>
      </div>

      {resultado?.ok ? (
        <div className="space-y-3">
          <p className="text-sm text-alto flex items-center gap-1.5">
            <Check size={14} /> {resultado.esNuevo ? 'Cargo creado' : 'Cargo actualizado'} correctamente:{' '}
            <strong>{datos?.nombre}</strong>
          </p>
          <button type="button" onClick={reiniciar} className="text-sm text-flow-600 hover:underline">
            Importar otro archivo
          </button>
        </div>
      ) : !datos ? (
        <form action={analizar} className="space-y-3">
          <input type="file" name="archivo" accept=".xlsx,.xls" required className="text-sm" />
          {error && <p className="text-sm text-bajo">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 transition"
          >
            <Upload size={16} /> {pending ? 'Analizando…' : 'Analizar archivo'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          {datos.advertencias.length > 0 && (
            <div className="rounded-lg border border-medio/30 bg-amber-50 p-3">
              <p className="text-xs font-medium text-medio flex items-center gap-1.5 mb-1">
                <AlertTriangle size={14} /> Advertencias — revisa manualmente después de guardar
              </p>
              <ul className="text-xs text-marmol-600 list-disc list-inside space-y-0.5">
                {datos.advertencias.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-lg border border-marmol-200 p-3">
            <p className="text-sm font-semibold text-marmol-900">{datos.nombre ?? '(sin nombre detectado)'}</p>
            <p className="text-xs text-marmol-500">{datos.procesoArea}</p>
            {datos.objetivoCargo && <p className="text-xs text-marmol-600 mt-2">{datos.objetivoCargo}</p>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <Campo etiqueta="Formación" valor={datos.formacionNivel} />
            <Campo etiqueta="Título específico" valor={datos.formacionTituloEspecifico} />
            <Campo etiqueta="Experiencia mínima" valor={datos.experienciaMinimaMeses ? `${datos.experienciaMinimaMeses} meses` : null} />
            <Campo etiqueta="Género" valor={datos.generoRequerido} />
            <Campo etiqueta="Edad" valor={datos.edadMinima && datos.edadMaxima ? `${datos.edadMinima}-${datos.edadMaxima} años` : null} />
            <Campo etiqueta="Tipo de área" valor={datos.tipoArea} />
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
            <Conteo etiqueta="Habilidades" cantidad={datos.habilidades.length} />
            <Conteo etiqueta="Funciones" cantidad={datos.funcionesPrincipales.length} />
            <Conteo etiqueta="Decisiones" cantidad={datos.decisiones.length} />
            <Conteo etiqueta="Riesgos" cantidad={datos.factoresRiesgo.length} />
            <Conteo etiqueta="Exámenes" cantidad={datos.examenesMedicos.length} />
            <Conteo etiqueta="EPP" cantidad={datos.epp.length} />
          </div>

          {error && <p className="text-sm text-bajo">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending || !datos.nombre}
              onClick={guardar}
              className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 transition"
            >
              {pending ? 'Guardando…' : `Guardar en «${datos.nombre ?? '—'}»`}
            </button>
            <button
              type="button"
              onClick={reiniciar}
              className="rounded-lg border border-marmol-200 text-marmol-500 text-sm font-medium px-4 py-2 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <div>
      <p className="text-marmol-400">{etiqueta}</p>
      <p className="text-marmol-800 font-medium capitalize">{valor ?? '—'}</p>
    </div>
  );
}

function Conteo({ etiqueta, cantidad }: { etiqueta: string; cantidad: number }) {
  return (
    <div className="rounded-lg bg-marmol-50 py-2">
      <p className="text-lg font-display font-semibold text-secundario">{cantidad}</p>
      <p className="text-marmol-500">{etiqueta}</p>
    </div>
  );
}
