'use client';

import { useEffect, useState, useTransition } from 'react';
import { consultarElegibilidadDotacion, crearEntrega, crearEntregaDesdeCatalogo } from '@/app/(dashboard)/dotacion/actions';
import { etiquetaPeriodo, periodoDeFecha, proximoCorte } from '@/lib/dotacion/normativa';
import { Plus, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface TallaCatalogo {
  id: string;
  talla: string;
  stock_disponible: number;
}
interface ArticuloCatalogo {
  id: string;
  categoria: string;
  nombre: string;
  requiere_talla: boolean;
  es_vestuario_calzado: boolean;
  tallas: TallaCatalogo[];
}

type Elegibilidad =
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'ok'; elegible: boolean; exentoPorNoUso: boolean; motivos: string[]; antiguedadMeses: number };

export function FormularioEntrega({
  colaboradores,
  articulosCatalogo,
}: {
  colaboradores: { id: string; nombre_completo: string }[];
  articulosCatalogo: ArticuloCatalogo[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [modo, setModo] = useState<'catalogo' | 'libre'>(articulosCatalogo.length > 0 ? 'catalogo' : 'libre');
  const [colaboradorId, setColaboradorId] = useState('');
  const [categoria, setCategoria] = useState<'elemento_personal' | 'equipo_trabajo'>('elemento_personal');
  const [cantidad, setCantidad] = useState('1');
  const [fechaEntrega, setFechaEntrega] = useState(() => new Date().toISOString().slice(0, 10));
  // Solo equipos de trabajo: en dotación el vencimiento lo fija el próximo corte obligatorio.
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [excepcionMotivo, setExcepcionMotivo] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [elegibilidad, setElegibilidad] = useState<Elegibilidad | null>(null);

  // Modo catálogo
  const [articuloId, setArticuloId] = useState('');
  const [tallaId, setTallaId] = useState('');
  const [tipo, setTipo] = useState<'especie' | 'bono_vestuario'>('especie');
  const articuloSeleccionado = articulosCatalogo.find((a) => a.id === articuloId);
  const tallaSeleccionada = articuloSeleccionado?.tallas.find((t) => t.id === tallaId);

  // Modo libre (texto)
  const [nombreElemento, setNombreElemento] = useState('');
  const [talla, setTalla] = useState('');

  const esDotacion = categoria === 'elemento_personal';
  const periodo = esDotacion && fechaEntrega ? periodoDeFecha(fechaEntrega) : null;
  const vencimiento = esDotacion && fechaEntrega ? proximoCorte(fechaEntrega) : null;
  const puedeBono = modo === 'catalogo' && esDotacion && !!articuloSeleccionado?.es_vestuario_calzado;

  // Consulta de elegibilidad cada vez que cambian colaborador, fecha o categoría de dotación
  useEffect(() => {
    if (!abierto || !esDotacion || !colaboradorId || !fechaEntrega) {
      setElegibilidad(null);
      return;
    }
    let vigente = true;
    setElegibilidad({ estado: 'cargando' });
    consultarElegibilidadDotacion(colaboradorId, fechaEntrega).then((res) => {
      if (!vigente) return;
      if (res.ok) setElegibilidad({ estado: 'ok', elegible: res.elegible, exentoPorNoUso: res.exentoPorNoUso, motivos: res.motivos, antiguedadMeses: res.antiguedadMeses });
      else setElegibilidad({ estado: 'error', mensaje: res.error });
    });
    return () => {
      vigente = false;
    };
  }, [abierto, esDotacion, colaboradorId, fechaEntrega]);

  const noElegible = elegibilidad?.estado === 'ok' && !elegibilidad.elegible;
  const sinJustificacion = noElegible && !excepcionMotivo.trim();

  function limpiar() {
    setColaboradorId('');
    setArticuloId('');
    setTallaId('');
    setTipo('especie');
    setNombreElemento('');
    setTalla('');
    setCantidad('1');
    setFechaVencimiento('');
    setExcepcionMotivo('');
    setAbierto(false);
  }

  function guardar() {
    setError(null);
    startTransition(async () => {
      const excepcion = noElegible ? excepcionMotivo.trim() : undefined;
      if (modo === 'catalogo') {
        if (!tallaSeleccionada) {
          setError('Selecciona un artículo y talla del catálogo');
          return;
        }
        const res = await crearEntregaDesdeCatalogo({
          articuloTallaId: tallaSeleccionada.id,
          colaboradorId,
          categoria,
          cantidad: Number(cantidad) || 1,
          fechaEntrega,
          tipo: puedeBono ? tipo : 'especie',
          excepcionMotivo: excepcion,
        });
        if (res.ok) limpiar();
        else setError(res.error);
      } else {
        const res = await crearEntrega({
          colaboradorId,
          categoria,
          nombreElemento,
          talla,
          cantidad: Number(cantidad) || 1,
          fechaEntrega,
          fechaVencimiento: esDotacion ? undefined : fechaVencimiento,
          excepcionMotivo: excepcion,
        });
        if (res.ok) limpiar();
        else setError(res.error);
      }
    });
  }

  const campo = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';
  const label = 'block text-xs text-marmol-500 mb-1';

  const cantidadExcedeStock = modo === 'catalogo' && tallaSeleccionada != null && Number(cantidad) > tallaSeleccionada.stock_disponible;

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3 py-2 transition"
      >
        <Plus size={15} /> Registrar entrega
      </button>
    );
  }

  return (
    <div className="card p-4 space-y-3">
      {articulosCatalogo.length > 0 && (
        <div className="flex text-xs rounded-lg border border-marmol-200 overflow-hidden w-fit">
          <button type="button" onClick={() => setModo('catalogo')} className={`px-2.5 py-1 ${modo === 'catalogo' ? 'bg-flow-500 text-white' : 'text-marmol-500'}`}>
            Del catálogo
          </button>
          <button type="button" onClick={() => setModo('libre')} className={`px-2.5 py-1 ${modo === 'libre' ? 'bg-flow-500 text-white' : 'text-marmol-500'}`}>
            Texto libre
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Colaborador</label>
          <select className={campo} value={colaboradorId} onChange={(e) => setColaboradorId(e.target.value)}>
            <option value="">Selecciona…</option>
            {colaboradores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre_completo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Categoría</label>
          <select className={campo} value={categoria} onChange={(e) => setCategoria(e.target.value as any)}>
            <option value="elemento_personal">Dotación: elemento personal (uniforme, botas, EPP)</option>
            <option value="equipo_trabajo">Equipo de trabajo (herramienta, cómputo, celular)</option>
          </select>
        </div>
      </div>

      {modo === 'catalogo' ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="col-span-2">
            <label className={label}>Artículo</label>
            <select
              className={campo}
              value={articuloId}
              onChange={(e) => {
                setArticuloId(e.target.value);
                setTallaId('');
                setTipo('especie');
              }}
            >
              <option value="">Selecciona…</option>
              {articulosCatalogo.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.categoria} — {a.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Talla</label>
            <select className={campo} value={tallaId} onChange={(e) => setTallaId(e.target.value)} disabled={!articuloSeleccionado}>
              <option value="">—</option>
              {articuloSeleccionado?.tallas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.talla} ({t.stock_disponible} disp.)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Cantidad</label>
            <input className={campo} type="number" min={1} value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          </div>
          {puedeBono && (
            <div className="col-span-2">
              <label className={label}>Forma de entrega</label>
              <select className={campo} value={tipo} onChange={(e) => setTipo(e.target.value as any)}>
                <option value="especie">En especie (el elemento físico)</option>
                <option value="bono_vestuario">Bono canjeable solo por vestuario o calzado</option>
              </select>
            </div>
          )}
          {cantidadExcedeStock && <p className="col-span-full text-xs text-bajo">No hay suficiente stock disponible ({tallaSeleccionada?.stock_disponible} en bodega).</p>}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="col-span-2">
            <label className={label}>Elemento</label>
            <input className={campo} value={nombreElemento} onChange={(e) => setNombreElemento(e.target.value)} placeholder="Ej. Botas de seguridad" />
          </div>
          <div>
            <label className={label}>Talla (si aplica)</label>
            <input className={campo} value={talla} onChange={(e) => setTalla(e.target.value)} />
          </div>
          <div>
            <label className={label}>Cantidad</label>
            <input className={campo} type="number" min={1} value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Fecha de entrega</label>
          <input className={campo} type="date" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} />
        </div>
        {esDotacion ? (
          <div>
            <label className={label}>Periodo y renovación</label>
            <div className="rounded-lg border border-marmol-200 bg-marmol-50 px-2.5 py-1.5 text-sm text-marmol-700">
              {periodo ? etiquetaPeriodo(periodo.anio, periodo.corte) : '—'}
              {vencimiento && <span className="text-marmol-400"> · renovar antes del {vencimiento}</span>}
            </div>
            <p className="text-[13px] text-marmol-400 mt-0.5">Corte obligatorio según la fecha de entrega (30 abr, 31 ago, 20 dic).</p>
          </div>
        ) : (
          <div>
            <label className={label}>Vencimiento / renovación</label>
            <input className={campo} type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} />
          </div>
        )}
      </div>

      {puedeBono && tipo === 'bono_vestuario' && (
        <p className="text-xs text-marmol-500 flex items-start gap-1.5">
          <Info size={13} className="mt-0.5 shrink-0" /> El bono solo puede canjearse por vestuario o calzado. No puede pagarse en dinero.
        </p>
      )}

      {esDotacion && elegibilidad?.estado === 'cargando' && <p className="text-xs text-marmol-400">Verificando elegibilidad…</p>}

      {esDotacion && elegibilidad?.estado === 'error' && <p className="text-xs text-bajo">No se pudo verificar la elegibilidad: {elegibilidad.mensaje}</p>}

      {esDotacion && elegibilidad?.estado === 'ok' && elegibilidad.elegible && (
        <p className="text-xs text-alto flex items-center gap-1.5">
          <CheckCircle2 size={13} /> Elegible para dotación ({elegibilidad.antiguedadMeses} meses de antigüedad).
          {elegibilidad.exentoPorNoUso && (
            <span className="text-marmol-600">
              {' '}
              · No es obligatoria: no usó la dotación del periodo anterior, así que el empleador queda eximido de entregarla. Puedes registrarla por decisión propia.
            </span>
          )}
        </p>
      )}

      {noElegible && (
        <div className="rounded-lg border border-bajo/30 bg-bajo/5 p-3 space-y-2">
          <p className="text-xs text-bajo font-medium flex items-center gap-1.5">
            <AlertTriangle size={13} /> Esta entrega no cumple la normativa:
          </p>
          <ul className="list-disc pl-5 text-xs text-marmol-700 space-y-0.5">
            {elegibilidad.motivos.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <div>
            <label className={label}>Justificación para entregarla de todos modos (queda registrada)</label>
            <textarea className={campo} rows={2} value={excepcionMotivo} onChange={(e) => setExcepcionMotivo(e.target.value)} placeholder="Ej. Acuerdo aprobado por gerencia" />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={guardar}
          disabled={
            pending ||
            !colaboradorId ||
            (modo === 'catalogo' ? !tallaSeleccionada || cantidadExcedeStock : !nombreElemento.trim()) ||
            sinJustificacion ||
            elegibilidad?.estado === 'cargando'
          }
          className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 transition"
        >
          {pending ? 'Guardando…' : noElegible ? 'Entregar con justificación' : 'Guardar entrega'}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="text-sm text-marmol-400 hover:text-marmol-600">
          Cancelar
        </button>
      </div>
      {error && <p className="text-xs text-bajo">{error}</p>}
    </div>
  );
}
