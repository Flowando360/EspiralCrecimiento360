'use client';

import { useState, useTransition } from 'react';
import { subirHojaVida, guardarContrato, guardarAfiliaciones } from '@/app/(dashboard)/espiral-crecimiento/colaboradores/[id]/documentos/actions';
import { FileText, Upload, FileDown, Check, ShieldPlus } from 'lucide-react';

export function DocumentosColaborador({
  colaboradorId,
  puedeEditar,
  hojaVidaUrl,
  contratoUrl,
  salarioInicial,
  afiliaciones,
}: {
  colaboradorId: string;
  puedeEditar: boolean;
  hojaVidaUrl: string | null;
  contratoUrl: string | null;
  salarioInicial: number | null;
  afiliaciones: { eps: string | null; arl: string | null; afp: string | null; caja_compensacion: string | null };
}) {
  return (
    <div className="space-y-4">
      <BloqueHojaVida colaboradorId={colaboradorId} puedeEditar={puedeEditar} urlActual={hojaVidaUrl} />
      <BloqueContrato colaboradorId={colaboradorId} puedeEditar={puedeEditar} urlActual={contratoUrl} salarioInicial={salarioInicial} />
      <BloqueAfiliaciones colaboradorId={colaboradorId} puedeEditar={puedeEditar} inicial={afiliaciones} />
      {puedeEditar && <BloqueCertificado colaboradorId={colaboradorId} />}
    </div>
  );
}

function BloqueAfiliaciones({
  colaboradorId,
  puedeEditar,
  inicial,
}: {
  colaboradorId: string;
  puedeEditar: boolean;
  inicial: { eps: string | null; arl: string | null; afp: string | null; caja_compensacion: string | null };
}) {
  const [eps, setEps] = useState(inicial.eps ?? '');
  const [arl, setArl] = useState(inicial.arl ?? '');
  const [afp, setAfp] = useState(inicial.afp ?? '');
  const [cajaCompensacion, setCajaCompensacion] = useState(inicial.caja_compensacion ?? '');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function guardar() {
    setError(null);
    setOk(false);
    startTransition(async () => {
      const res = await guardarAfiliaciones({ colaboradorId, eps, arl, afp, cajaCompensacion });
      if (res.ok) setOk(true);
      else setError(res.error);
    });
  }

  const campos: { etiqueta: string; valor: string; set: (v: string) => void }[] = [
    { etiqueta: 'EPS', valor: eps, set: setEps },
    { etiqueta: 'ARL', valor: arl, set: setArl },
    { etiqueta: 'AFP (pensión)', valor: afp, set: setAfp },
    { etiqueta: 'Caja de compensación', valor: cajaCompensacion, set: setCajaCompensacion },
  ];

  return (
    <div className="card p-5">
      <h2 className="font-display font-semibold text-secundario mb-1 flex items-center gap-1.5">
        <ShieldPlus size={16} /> Afiliaciones
      </h2>
      <p className="text-xs text-marmol-400 mb-3">
        EPS, ARL, fondo de pensiones y caja de compensación. Solo lo ven Talento Humano y el propio colaborador.
      </p>

      {puedeEditar ? (
        <div className="grid grid-cols-2 gap-2">
          {campos.map((c) => (
            <div key={c.etiqueta}>
              <label className="block text-xs text-marmol-500 mb-1">{c.etiqueta}</label>
              <input
                type="text"
                value={c.valor}
                onChange={(e) => c.set(e.target.value)}
                className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
              />
            </div>
          ))}
        </div>
      ) : (
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {campos.map((c) => (
            <div key={c.etiqueta}>
              <dt className="text-xs text-marmol-400">{c.etiqueta}</dt>
              <dd className="text-marmol-700">{c.valor || '—'}</dd>
            </div>
          ))}
        </dl>
      )}

      {puedeEditar && (
        <button
          type="button"
          onClick={guardar}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5 transition mt-3"
        >
          {pending ? 'Guardando…' : 'Guardar'}
        </button>
      )}
      {ok && <p className="text-xs text-alto mt-1.5 flex items-center gap-1"><Check size={12} /> Guardado</p>}
      {error && <p className="text-xs text-bajo mt-1.5">{error}</p>}
    </div>
  );
}

function BloqueHojaVida({ colaboradorId, puedeEditar, urlActual }: { colaboradorId: string; puedeEditar: boolean; urlActual: string | null }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function subir(formData: FormData) {
    setError(null);
    setOk(false);
    startTransition(async () => {
      const res = await subirHojaVida(formData);
      if (res.ok) setOk(true);
      else setError(res.error);
    });
  }

  return (
    <div className="card p-5">
      <h2 className="font-display font-semibold text-secundario mb-1 flex items-center gap-1.5">
        <FileText size={16} /> Hoja de vida
      </h2>
      {urlActual ? (
        <a href={urlActual} target="_blank" rel="noopener noreferrer" className="text-sm text-flow-600 hover:underline">
          Ver archivo cargado
        </a>
      ) : (
        <p className="text-sm text-marmol-400">Sin hoja de vida cargada.</p>
      )}

      {puedeEditar && (
        <form action={subir} className="flex items-center gap-2 mt-3 pt-3 border-t border-marmol-100">
          <input type="hidden" name="colaboradorId" value={colaboradorId} />
          <input type="file" name="archivo" accept=".pdf,.doc,.docx" required className="text-sm flex-1" />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5 transition shrink-0"
          >
            <Upload size={14} /> {pending ? 'Subiendo…' : urlActual ? 'Reemplazar' : 'Subir'}
          </button>
        </form>
      )}
      {ok && <p className="text-xs text-alto mt-1.5 flex items-center gap-1"><Check size={12} /> Guardado</p>}
      {error && <p className="text-xs text-bajo mt-1.5">{error}</p>}
    </div>
  );
}

function BloqueContrato({
  colaboradorId,
  puedeEditar,
  urlActual,
  salarioInicial,
}: {
  colaboradorId: string;
  puedeEditar: boolean;
  urlActual: string | null;
  salarioInicial: number | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function guardar(formData: FormData) {
    setError(null);
    setOk(false);
    startTransition(async () => {
      const res = await guardarContrato(formData);
      if (res.ok) setOk(true);
      else setError(res.error);
    });
  }

  return (
    <div className="card p-5">
      <h2 className="font-display font-semibold text-secundario mb-1 flex items-center gap-1.5">
        <FileText size={16} /> Contrato
      </h2>
      <p className="text-xs text-marmol-400 mb-2">
        El salario registrado aquí es la fuente para el certificado laboral. Solo lo ven Talento Humano y el propio colaborador.
      </p>
      {urlActual ? (
        <a href={urlActual} target="_blank" rel="noopener noreferrer" className="text-sm text-flow-600 hover:underline">
          Ver archivo cargado
        </a>
      ) : (
        <p className="text-sm text-marmol-400">Sin contrato cargado.</p>
      )}
      <p className="text-sm text-marmol-700 mt-1">
        Salario: {salarioInicial != null ? `$ ${Number(salarioInicial).toLocaleString('es-CO')}` : '—'}
      </p>

      {puedeEditar && (
        <form action={guardar} className="space-y-2 mt-3 pt-3 border-t border-marmol-100">
          <input type="hidden" name="colaboradorId" value={colaboradorId} />
          <div className="flex gap-2">
            <input
              type="number"
              name="salario"
              defaultValue={salarioInicial ?? ''}
              placeholder="Salario mensual"
              min={0}
              className="flex-1 rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <input type="file" name="archivo" accept=".pdf,.doc,.docx" className="text-sm flex-1" />
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5 transition shrink-0"
            >
              <Upload size={14} /> {pending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
          <p className="text-xs text-marmol-400">El archivo es opcional si solo quieres actualizar el salario.</p>
        </form>
      )}
      {ok && <p className="text-xs text-alto mt-1.5 flex items-center gap-1"><Check size={12} /> Guardado</p>}
      {error && <p className="text-xs text-bajo mt-1.5">{error}</p>}
    </div>
  );
}

function BloqueCertificado({ colaboradorId }: { colaboradorId: string }) {
  const [incluirSalario, setIncluirSalario] = useState(false);

  return (
    <div className="card p-5">
      <h2 className="font-display font-semibold text-secundario mb-1 flex items-center gap-1.5">
        <FileDown size={16} /> Certificado laboral
      </h2>
      <p className="text-xs text-marmol-400 mb-3">Se genera al momento, con los datos actuales del colaborador y su contrato.</p>

      <label className="flex items-center gap-2 text-sm text-marmol-700 mb-3">
        <input type="checkbox" checked={incluirSalario} onChange={(e) => setIncluirSalario(e.target.checked)} />
        Incluir el salario en el certificado
      </label>

      <a
        href={`/api/colaboradores/certificado-laboral/pdf?colaboradorId=${colaboradorId}&incluirSalario=${incluirSalario}`}
        className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-4 py-2 transition"
      >
        <FileDown size={16} /> Descargar PDF
      </a>
    </div>
  );
}
