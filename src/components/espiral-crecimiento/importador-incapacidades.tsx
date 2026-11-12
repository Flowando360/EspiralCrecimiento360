'use client';

import { useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { revisarImportacionIncapacidades, confirmarImportacionIncapacidades } from '@/app/(dashboard)/espiral-crecimiento/importar-incapacidades/actions';
import { FileSpreadsheet, CheckCircle2, AlertTriangle, MinusCircle, Upload } from 'lucide-react';

interface FilaRevision {
  fila: number;
  colaborador: string;
  estado: 'ok' | 'error' | 'omitida';
  errores: string[];
  avisos: string[];
  dias: number | null;
}

interface Resultado {
  creadas: number;
  omitidas: number;
  conError: number;
  errores: string[];
}

/** Carga masiva de incapacidades: sube el Excel, revisa fila por fila y solo entonces guarda. */
export function ImportadorIncapacidades() {
  const entrada = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [filas, setFilas] = useState<FilaRevision[] | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const archivo = () => entrada.current?.files?.[0] ?? null;

  function revisar() {
    const a = archivo();
    if (!a) {
      setError('Elige el archivo Excel');
      return;
    }
    setError(null);
    setResultado(null);
    const datos = new FormData();
    datos.set('archivo', a);
    startTransition(async () => {
      const res = await revisarImportacionIncapacidades(datos);
      if (!res.ok) {
        setFilas(null);
        setError(res.error);
        return;
      }
      setFilas(res.filas as FilaRevision[]);
      setAviso(res.aviso);
    });
  }

  function confirmar() {
    const a = archivo();
    if (!a) return;
    setError(null);
    const datos = new FormData();
    datos.set('archivo', a);
    startTransition(async () => {
      const res = await confirmarImportacionIncapacidades(datos);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResultado(res);
      setFilas(null);
      if (entrada.current) entrada.current.value = '';
    });
  }

  const ok = filas?.filter((f) => f.estado === 'ok').length ?? 0;
  const errores = filas?.filter((f) => f.estado === 'error').length ?? 0;
  const omitidas = filas?.filter((f) => f.estado === 'omitida').length ?? 0;

  return (
    <div className="space-y-5">
      <div className="card p-5 space-y-3">
        <h2 className="font-display font-semibold text-secundario">1. Descarga la plantilla</h2>
        <p className="text-sm text-marmol-500">
          Una incapacidad o licencia por fila: documento del colaborador, tipo, fechas y entidad. Puedes copiar las columnas de tu archivo de nómina; basta con que los encabezados se parezcan.
        </p>
        <a
          href="/api/colaboradores/plantilla-incapacidades"
          className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-sm font-medium px-3.5 py-2 transition"
        >
          <FileSpreadsheet size={16} /> Descargar plantilla .xlsx
        </a>
      </div>

      <div className="card p-5 space-y-3">
        <h2 className="font-display font-semibold text-secundario">2. Sube el archivo y revisa</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={entrada}
            type="file"
            accept=".xlsx"
            onChange={() => {
              setFilas(null);
              setResultado(null);
              setError(null);
            }}
            className="text-sm"
          />
          <button
            type="button"
            onClick={revisar}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-3.5 py-1.5 transition"
          >
            <Upload size={14} /> {pending && !filas ? 'Revisando…' : 'Revisar archivo'}
          </button>
        </div>
        {error && <p className="text-sm text-bajo">{error}</p>}
        {aviso && <p className="text-sm text-medio">{aviso}</p>}
      </div>

      {filas && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-marmol-200 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-display font-semibold text-secundario">3. Revisión</h2>
              <p className="text-sm text-marmol-500">
                <strong className="text-alto">{ok}</strong> listas para importar · <strong className="text-bajo">{errores}</strong> con errores (no se importan) · <strong>{omitidas}</strong> omitidas por ya existir
              </p>
            </div>
            <button
              type="button"
              onClick={confirmar}
              disabled={pending || ok === 0}
              className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 transition"
            >
              {pending ? 'Importando…' : `Importar ${ok} ${ok === 1 ? 'incapacidad' : 'incapacidades'}`}
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                <th className="px-4 py-2 font-medium w-14">Fila</th>
                <th className="px-4 py-2 font-medium">Colaborador</th>
                <th className="px-4 py-2 font-medium">Días</th>
                <th className="px-4 py-2 font-medium">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.fila} className="border-b border-marmol-100 last:border-0 align-top">
                  <td className="px-4 py-2 text-marmol-500">{f.fila}</td>
                  <td className="px-4 py-2 text-marmol-800">{f.colaborador}</td>
                  <td className="px-4 py-2 text-marmol-600">{f.dias ?? '—'}</td>
                  <td className="px-4 py-2 space-y-0.5">
                    {f.estado === 'ok' && (
                      <p className="inline-flex items-center gap-1 text-alto">
                        <CheckCircle2 size={13} /> Lista
                      </p>
                    )}
                    {f.estado === 'omitida' && (
                      <p className="inline-flex items-center gap-1 text-marmol-500">
                        <MinusCircle size={13} /> Omitida
                      </p>
                    )}
                    {f.estado === 'error' && (
                      <p className="inline-flex items-center gap-1 text-bajo">
                        <AlertTriangle size={13} /> Con errores
                      </p>
                    )}
                    {f.errores.map((e) => (
                      <p key={e} className="text-xs text-bajo">
                        {e}
                      </p>
                    ))}
                    {f.avisos.map((a) => (
                      <p key={a} className="text-xs text-marmol-400">
                        {a}
                      </p>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {resultado && (
        <div className="card p-5 space-y-2">
          <h2 className="font-display font-semibold text-secundario flex items-center gap-2">
            <CheckCircle2 size={18} className="text-alto" /> Importación terminada
          </h2>
          <p className="text-sm text-marmol-700">
            Se registraron <strong>{resultado.creadas}</strong> incapacidades. {resultado.omitidas > 0 && `${resultado.omitidas} omitidas por ya existir. `}
            {resultado.conError > 0 && `${resultado.conError} con errores no se importaron.`}
          </p>
          {resultado.errores.map((e) => (
            <p key={e} className="text-xs text-bajo">
              {e}
            </p>
          ))}
          <p className="text-xs text-marmol-500">El soporte médico (PDF) de cada incapacidad se adjunta después, desde la ficha de cada persona.</p>
          <Link href="/espiral-crecimiento/colaboradores" className="inline-block text-sm text-flow-600 hover:underline">
            Ver colaboradores →
          </Link>
        </div>
      )}
    </div>
  );
}
