'use client';

import { useState, useTransition } from 'react';
import { actualizarCriterio, agregarCriterioVacante, eliminarCriterioVacante, generarCriteriosDesdePerfil } from '@/app/(dashboard)/reclutamiento/match-actions';
import { ETIQUETA_CATEGORIA, type CategoriaCriterio, type TipoCriterio } from '@/lib/reclutamiento/match';
import { ListChecks, Plus, Trash2, Wand2 } from 'lucide-react';

export type CriterioFila = {
  id: string;
  origen: 'perfil' | 'vacante';
  categoria: CategoriaCriterio;
  tipo: TipoCriterio;
  descripcion: string;
  valor_requerido: string | null;
  nivel_requerido: string | null;
  meses_requeridos: number | null;
  peso: number;
  activo: boolean;
};

const TIPO_TEXTO: Record<TipoCriterio, string> = {
  obligatorio: 'Obligatorio',
  deseable: 'Deseable',
  informativo: 'Informativo',
};

export function PanelCriterios({ vacanteId, criterios, puedeAdministrar }: { vacanteId: string; criterios: CriterioFila[]; puedeAdministrar: boolean }) {
  const [pending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  const ejecutar = (accion: () => Promise<{ ok: boolean; error?: string }>, okTexto?: string) => {
    setMensaje(null);
    startTransition(async () => {
      const r = await accion();
      setMensaje(r.ok ? (okTexto ? { tipo: 'ok', texto: okTexto } : null) : { tipo: 'error', texto: r.error ?? 'No se pudo guardar' });
    });
  };

  const pesoTotal = criterios.filter((c) => c.activo && c.tipo !== 'informativo').reduce((s, c) => s + Number(c.peso), 0);

  return (
    <section className="card p-4 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display font-semibold text-secundario text-sm flex items-center gap-1.5">
            <ListChecks size={15} /> Criterios de evaluación
          </h2>
          <p className="text-xs text-marmol-400 mt-0.5">
            Con qué se compara a cada candidato. Los pesos se normalizan al evaluar; la IA no los modifica.
            {criterios.length > 0 && ` Peso activo ponderable: ${pesoTotal.toFixed(0)}.`}
          </p>
        </div>
        {puedeAdministrar && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => ejecutar(() => generarCriteriosDesdePerfil(vacanteId), 'Criterios tomados del perfil de cargo.')}
              className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 hover:bg-marmol-50 text-marmol-700 text-xs font-medium px-3 py-1.5 disabled:opacity-50"
            >
              <Wand2 size={12} /> Tomar del perfil de cargo
            </button>
            {!mostrarForm && (
              <button type="button" onClick={() => setMostrarForm(true)} className="inline-flex items-center gap-1 text-xs text-flow-600 hover:text-flow-700 font-medium">
                <Plus size={12} /> Criterio propio
              </button>
            )}
          </div>
        )}
      </div>

      {criterios.length === 0 ? (
        <p className="text-sm text-marmol-500">Esta vacante aún no tiene criterios. Tómalos del perfil de cargo o agrega los propios.</p>
      ) : (
        <ul className="divide-y divide-marmol-100">
          {criterios.map((c) => (
            <FilaCriterio key={c.id} criterio={c} vacanteId={vacanteId} puedeAdministrar={puedeAdministrar} />
          ))}
        </ul>
      )}

      {mostrarForm && (
        <FormularioCriterio
          vacanteId={vacanteId}
          onListo={() => setMostrarForm(false)}
        />
      )}

      {mensaje && <p className={`text-xs ${mensaje.tipo === 'ok' ? 'text-alto' : 'text-bajo'}`}>{mensaje.texto}</p>}
    </section>
  );
}

function FilaCriterio({ criterio, vacanteId, puedeAdministrar }: { criterio: CriterioFila; vacanteId: string; puedeAdministrar: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const cambiar = (cambios: { tipo?: TipoCriterio; peso?: number; activo?: boolean }) => {
    setError(null);
    startTransition(async () => {
      const r = await actualizarCriterio(criterio.id, vacanteId, cambios);
      if (!r.ok) setError(r.error);
    });
  };

  return (
    <li className={`py-2 flex items-center gap-3 flex-wrap text-sm ${criterio.activo ? '' : 'opacity-50'}`}>
      <div className="flex-1 min-w-[12rem]">
        <p className="text-marmol-800">{criterio.descripcion}</p>
        <p className="text-[11px] text-marmol-400">
          {ETIQUETA_CATEGORIA[criterio.categoria]} · {criterio.origen === 'perfil' ? 'Del perfil de cargo' : 'Propio de la vacante'}
        </p>
      </div>

      {puedeAdministrar ? (
        <>
          <select
            value={criterio.tipo}
            disabled={pending}
            onChange={(e) => cambiar({ tipo: e.target.value as TipoCriterio })}
            className="rounded-lg border border-marmol-200 px-2 py-1 text-xs"
          >
            {(Object.keys(TIPO_TEXTO) as TipoCriterio[]).map((t) => (
              <option key={t} value={t}>
                {TIPO_TEXTO[t]}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-xs text-marmol-500">
            Peso
            <input
              type="number"
              min={0}
              max={100}
              defaultValue={Number(criterio.peso)}
              disabled={pending}
              onBlur={(e) => {
                const valor = Number(e.target.value);
                if (valor !== Number(criterio.peso)) cambiar({ peso: valor });
              }}
              className="w-16 rounded-lg border border-marmol-200 px-2 py-1 text-xs"
            />
          </label>
          <label className="flex items-center gap-1 text-xs text-marmol-500">
            <input type="checkbox" checked={criterio.activo} disabled={pending} onChange={(e) => cambiar({ activo: e.target.checked })} />
            Cuenta
          </label>
          {criterio.origen === 'vacante' && (
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(async () => { await eliminarCriterioVacante(criterio.id, vacanteId); })}
              className="text-marmol-400 hover:text-bajo disabled:opacity-50"
              aria-label="Eliminar criterio"
            >
              <Trash2 size={14} />
            </button>
          )}
        </>
      ) : (
        <span className="text-xs text-marmol-500">
          {TIPO_TEXTO[criterio.tipo]} · peso {Number(criterio.peso)}
        </span>
      )}
      {error && <p className="w-full text-xs text-bajo">{error}</p>}
    </li>
  );
}

function FormularioCriterio({ vacanteId, onListo }: { vacanteId: string; onListo: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<CategoriaCriterio>('competencia_tecnica');
  const [form, setForm] = useState({ descripcion: '', tipo: 'deseable' as TipoCriterio, valorRequerido: '', nivelRequerido: '', meses: '', peso: '5' });

  const enviar = () => {
    setError(null);
    startTransition(async () => {
      const r = await agregarCriterioVacante({
        vacanteId,
        categoria,
        tipo: form.tipo,
        descripcion: form.descripcion,
        valorRequerido: form.valorRequerido || undefined,
        nivelRequerido: (form.nivelRequerido || '') as 'basico' | 'intermedio' | 'avanzado' | 'nativo' | '',
        mesesRequeridos: form.meses ? Number(form.meses) : undefined,
        peso: Number(form.peso),
      });
      if (!r.ok) setError(r.error);
      else onListo();
    });
  };

  return (
    <div className="rounded-lg bg-marmol-50 p-3 grid gap-2 sm:grid-cols-2 text-sm">
      <input className="rounded-lg border border-marmol-200 px-2 py-1.5 sm:col-span-2" placeholder="Descripción del criterio (ej. Experiencia con clientes de retail)" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
      <select className="rounded-lg border border-marmol-200 px-2 py-1.5" value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaCriterio)}>
        {(Object.keys(ETIQUETA_CATEGORIA) as CategoriaCriterio[]).map((c) => (
          <option key={c} value={c}>
            {ETIQUETA_CATEGORIA[c]}
          </option>
        ))}
      </select>
      <select className="rounded-lg border border-marmol-200 px-2 py-1.5" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoCriterio })}>
        {(Object.keys(TIPO_TEXTO) as TipoCriterio[]).map((t) => (
          <option key={t} value={t}>
            {TIPO_TEXTO[t]}
          </option>
        ))}
      </select>
      <input className="rounded-lg border border-marmol-200 px-2 py-1.5" placeholder="Palabras clave separadas por coma (ej. SAP, Excel)" value={form.valorRequerido} onChange={(e) => setForm({ ...form, valorRequerido: e.target.value })} />
      {categoria === 'certificacion_idioma' && (
        <select className="rounded-lg border border-marmol-200 px-2 py-1.5" value={form.nivelRequerido} onChange={(e) => setForm({ ...form, nivelRequerido: e.target.value })}>
          <option value="">Certificación (sin nivel de idioma)</option>
          <option value="basico">Idioma: básico</option>
          <option value="intermedio">Idioma: intermedio</option>
          <option value="avanzado">Idioma: avanzado</option>
          <option value="nativo">Idioma: nativo</option>
        </select>
      )}
      {categoria === 'experiencia' && (
        <input type="number" min={0} className="rounded-lg border border-marmol-200 px-2 py-1.5" placeholder="Meses de experiencia requeridos" value={form.meses} onChange={(e) => setForm({ ...form, meses: e.target.value })} />
      )}
      <label className="flex items-center gap-2 text-xs text-marmol-500">
        Peso
        <input type="number" min={0} max={100} className="w-20 rounded-lg border border-marmol-200 px-2 py-1" value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} />
      </label>
      <div className="flex items-center gap-3 justify-end">
        <button type="button" onClick={onListo} className="text-xs text-marmol-500 hover:underline">
          Cancelar
        </button>
        <button type="button" disabled={pending || form.descripcion.trim().length < 3} onClick={enviar} className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-xs font-medium px-3 py-1.5 disabled:opacity-50">
          {pending ? 'Guardando…' : 'Agregar criterio'}
        </button>
      </div>
      {error && <p className="sm:col-span-2 text-xs text-bajo">{error}</p>}
    </div>
  );
}
