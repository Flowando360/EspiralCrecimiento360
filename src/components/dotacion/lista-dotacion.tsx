'use client';

import { useRef, useState, useTransition } from 'react';
import { confirmarFirmaDotacion, actualizarEstadoDotacion, subirActaFirmada } from '@/app/(dashboard)/dotacion/actions';
import { CheckCircle2, Clock, ShieldCheck, Camera, FileImage } from 'lucide-react';
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
  const inputRef = useRef<HTMLInputElement>(null);
  const vencidaProximo = entrega.fecha_vencimiento && new Date(entrega.fecha_vencimiento) < new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
  const puedeAdjuntarActa = puedeAdministrar || esPropia;

  function archivoActaSeleccionado(file: File | undefined) {
    if (!file) return;
    setSubiendoActa(true);
    const formData = new FormData();
    formData.append('entregaId', entrega.id);
    formData.append('archivo', file);
    startTransition(async () => {
      const res = await subirActaFirmada(formData);
      setSubiendoActa(false);
      if (res.ok) setActaUrl('subido'); // el link real se ve al recargar la lista (revalidatePath); esto solo confirma en pantalla
      if (inputRef.current) inputRef.current.value = '';
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap">
      <div>
        <p className="font-medium text-marmol-800">
          {entrega.nombre_elemento} {entrega.talla ? `— talla ${entrega.talla}` : ''} {entrega.cantidad > 1 ? `× ${entrega.cantidad}` : ''}
        </p>
        <p className="text-xs text-marmol-400">
          {entrega.colaborador.nombre_completo} · {entrega.categoria === 'elemento_personal' ? 'Elemento personal' : 'Equipo de trabajo'} · Entregado{' '}
          {entrega.fecha_entrega}
          {entrega.fecha_vencimiento && (
            <span className={vencidaProximo ? 'text-medio font-medium' : ''}> · Renovar antes de {entrega.fecha_vencimiento}</span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {entrega.firma_confirmada ? (
          <span className="inline-flex items-center gap-1 text-xs text-alto font-medium">
            <ShieldCheck size={13} /> Firmado
          </span>
        ) : esPropia ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => { confirmarFirmaDotacion(entrega.id); })}
            className="inline-flex items-center gap-1 text-xs bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white font-medium rounded-lg px-2.5 py-1.5"
          >
            <CheckCircle2 size={13} /> Confirmar recibido
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-marmol-400">
            <Clock size={13} /> Sin firmar
          </span>
        )}

        {puedeAdjuntarActa && (
          <label className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-flow-600 cursor-pointer" title="Adjuntar foto del acta firmada en papel">
            {actaUrl ? <FileImage size={13} className="text-flow-600" /> : <Camera size={13} />}
            {subiendoActa ? 'Subiendo…' : actaUrl ? 'Acta adjunta' : 'Adjuntar acta'}
            <input ref={inputRef} type="file" accept="image/*,.pdf" disabled={subiendoActa} onChange={(e) => archivoActaSeleccionado(e.target.files?.[0])} className="hidden" />
          </label>
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
