'use client';

import { useRef, useState, useTransition } from 'react';
import { actualizarEstadoDotacion, subirActaFirmada, registrarUsoDotacion } from '@/app/(dashboard)/dotacion/actions';
import { Clock, ShieldCheck, Camera, FileImage, Ticket } from 'lucide-react';
import { ConfirmarRecibido } from '@/components/dotacion/confirmar-recibido';
import { etiquetaPeriodo, type CorteDotacion } from '@/lib/dotacion/normativa';
import type { RolUsuario } from '@/types/colaborador';

type Entrega = {
  id: string;
  categoria: 'elemento_personal' | 'equipo_trabajo';
  nombre_elemento: string;
  talla: string | null;
  cantidad: number;
  fecha_entrega: string;
  fecha_vencimiento: string | null;
  estado: 'entregado' | 'devuelto' | 'perdido' | 'danado';
  firma_confirmada: boolean;
  firmado_en: string | null;
  acta_firmada_url: string | null;
  tipo_entrega: 'especie' | 'bono_vestuario';
  periodo_anio: number | null;
  periodo_corte: CorteDotacion | null;
  uso_verificado: boolean | null;
  uso_observacion: string | null;
  excepcion_motivo: string | null;
  colaborador: { id: string; nombre_completo: string };
};

const ESTADO_LABEL: Record<string, string> = { entregado: 'Entregado', devuelto: 'Devuelto', perdido: 'Perdido', danado: 'Dañado' };
const ESTADO_CLASE: Record<string, string> = {
  entregado: 'bg-flow-50 text-flow-700',
  devuelto: 'bg-alto/10 text-alto',
  perdido: 'bg-bajo/10 text-bajo',
  danado: 'bg-medio/10 text-medio',
};

export function ListaDotacion({ entregas, rol, miColaboradorId }: { entregas: Entrega[]; rol: RolUsuario; miColaboradorId: string | null }) {
  if (entregas.length === 0) {
    return <div className="card p-6 text-sm text-marmol-500">Todavía no hay entregas de dotación registradas.</div>;
  }

  const puedeAdministrar = rol === 'admin_th';

  return (
    <div className="card divide-y divide-marmol-100">
      {entregas.map((e) => (
        <FilaEntrega key={e.id} entrega={e} puedeAdministrar={puedeAdministrar} esPropia={e.colaborador.id === miColaboradorId} />
      ))}
    </div>
  );
}

function FilaEntrega({ entrega, puedeAdministrar, esPropia }: { entrega: Entrega; puedeAdministrar: boolean; esPropia: boolean }) {
  const [pending, startTransition] = useTransition();
  const [subiendoActa, setSubiendoActa] = useState(false);
  const [actaUrl, setActaUrl] = useState(entrega.acta_firmada_url);
  const [errorUso, setErrorUso] = useState<string | null>(null);
  const [buenas, setBuenas] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const vencidaProximo = entrega.fecha_vencimiento && new Date(entrega.fecha_vencimiento) < new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
  const puedeAdjuntarActa = puedeAdministrar || esPropia;
  const esDotacion = entrega.categoria === 'elemento_personal';

  function archivoActaSeleccionado(file: File | undefined) {
    if (!file) return;
    setSubiendoActa(true);
    const formData = new FormData();
    formData.append('entregaId', entrega.id);
    formData.append('archivo', file);
    formData.append('buenasCondiciones', String(buenas));
    startTransition(async () => {
      const res = await subirActaFirmada(formData);
      setSubiendoActa(false);
      if (res.ok) setActaUrl('subido'); // el link real se ve al recargar la lista (revalidatePath); esto solo confirma en pantalla
      if (inputRef.current) inputRef.current.value = '';
    });
  }

  function cambiarUso(valor: string) {
    const usoVerificado = valor === 'si' ? true : valor === 'no' ? false : null;
    setErrorUso(null);
    startTransition(async () => {
      const res = await registrarUsoDotacion(entrega.id, usoVerificado);
      if (!res.ok) setErrorUso(res.error);
    });
  }

  const valorUso = entrega.uso_verificado === true ? 'si' : entrega.uso_verificado === false ? 'no' : 'pendiente';

  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3 flex-wrap">
      <div className="min-w-0">
        <p className="font-medium text-marmol-800 flex items-center gap-2 flex-wrap">
          {entrega.nombre_elemento} {entrega.talla ? `— talla ${entrega.talla}` : ''} {entrega.cantidad > 1 ? `× ${entrega.cantidad}` : ''}
          {entrega.tipo_entrega === 'bono_vestuario' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 bg-flow-50 text-flow-700">
              <Ticket size={11} /> Bono de vestuario
            </span>
          )}
        </p>
        <p className="text-xs text-marmol-400">
          {entrega.colaborador.nombre_completo} · {esDotacion ? 'Dotación' : 'Equipo de trabajo'} · Entregado {entrega.fecha_entrega}
          {esDotacion && entrega.periodo_anio && entrega.periodo_corte && <span> · {etiquetaPeriodo(entrega.periodo_anio, entrega.periodo_corte)}</span>}
          {entrega.fecha_vencimiento && (
            <span className={vencidaProximo ? 'text-medio font-medium' : ''}> · Renovar antes de {entrega.fecha_vencimiento}</span>
          )}
        </p>
        {entrega.excepcion_motivo && <p className="text-xs text-medio mt-0.5">Entregada con excepción: {entrega.excepcion_motivo}</p>}
        {esDotacion && entrega.uso_verificado === false && (
          <p className="text-xs text-marmol-500 mt-0.5">No se usó: el empleador queda eximido de entregarla en el periodo siguiente.{entrega.uso_observacion ? ` ${entrega.uso_observacion}` : ''}</p>
        )}
        {errorUso && <p className="text-xs text-bajo mt-0.5">{errorUso}</p>}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {entrega.firma_confirmada ? (
          <span className="inline-flex items-center gap-1 text-xs text-alto font-medium">
            <ShieldCheck size={13} /> Firmado
          </span>
        ) : esPropia ? (
          <ConfirmarRecibido entregaId={entrega.id} />
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-marmol-400">
            <Clock size={13} /> Sin firmar
          </span>
        )}

        {puedeAdjuntarActa && (
          <div className="flex flex-col items-end gap-1">
            <label className="inline-flex items-center gap-1.5 text-xs text-marmol-600">
              <input type="checkbox" checked={buenas} onChange={(e) => setBuenas(e.target.checked)} disabled={subiendoActa} />
              En buenas condiciones
            </label>
            <label
              className={`inline-flex items-center gap-1 text-xs ${buenas ? 'text-marmol-400 hover:text-flow-600 cursor-pointer' : 'text-marmol-300 cursor-not-allowed'}`}
              title="Adjuntar foto del acta firmada en papel"
            >
              {actaUrl ? <FileImage size={13} className="text-flow-600" /> : <Camera size={13} />}
              {subiendoActa ? 'Subiendo…' : actaUrl ? 'Acta adjunta' : 'Adjuntar acta'}
              <input ref={inputRef} type="file" accept="image/*,.pdf" disabled={!buenas || subiendoActa} onChange={(e) => archivoActaSeleccionado(e.target.files?.[0])} className="hidden" />
            </label>
          </div>
        )}

        {puedeAdministrar && esDotacion && (
          <select
            className="rounded-lg border border-marmol-200 px-2 py-1.5 text-xs bg-white"
            value={valorUso}
            disabled={pending}
            title="Uso de la dotación: si no se usó, el empleador queda eximido de entregarla en el periodo siguiente"
            onChange={(e) => cambiarUso(e.target.value)}
          >
            <option value="pendiente">Uso: pendiente</option>
            <option value="si">Uso: verificado</option>
            <option value="no">Uso: no usó</option>
          </select>
        )}

        {puedeAdministrar ? (
          <select
            className="rounded-lg border border-marmol-200 px-2 py-1.5 text-xs bg-white"
            defaultValue={entrega.estado}
            disabled={pending}
            onChange={(e) => startTransition(() => { actualizarEstadoDotacion(entrega.id, e.target.value as any); })}
          >
            <option value="entregado">Entregado</option>
            <option value="devuelto">Devuelto</option>
            <option value="perdido">Perdido</option>
            <option value="danado">Dañado</option>
          </select>
        ) : (
          <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${ESTADO_CLASE[entrega.estado]}`}>{ESTADO_LABEL[entrega.estado]}</span>
        )}
      </div>
    </div>
  );
}
