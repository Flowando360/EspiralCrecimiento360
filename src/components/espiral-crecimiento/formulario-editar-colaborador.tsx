'use client';

import { useState, useTransition } from 'react';
import { actualizarColaborador } from '@/app/(dashboard)/espiral-crecimiento/colaboradores/actions';
import { CargaHojaVidaIA } from '@/components/espiral-crecimiento/carga-hoja-vida-ia';
import type { EstadoColaborador, TipoContrato } from '@/types/colaborador';

const TIPOS_CONTRATO: { value: TipoContrato; label: string }[] = [
  { value: 'indefinido', label: 'Indefinido' },
  { value: 'fijo', label: 'Término fijo' },
  { value: 'obra_labor', label: 'Obra o labor' },
  { value: 'prestacion_servicios', label: 'Prestación de servicios' },
  { value: 'aprendizaje', label: 'Contrato de aprendizaje' },
  { value: 'externo', label: 'Externo (no es empleado directo)' },
];

const ESTADOS: { value: EstadoColaborador; label: string }[] = [
  { value: 'periodo_prueba', label: 'Período de prueba' },
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'en_proceso_salida', label: 'En proceso de salida' },
];

export interface DatosIniciales {
  id: string;
  nombreCompleto: string;
  numeroDocumento: string;
  email: string;
  telefono: string;
  cargoId: string;
  liderId: string;
  fechaIngreso: string;
  tipoContrato: TipoContrato;
  estado: EstadoColaborador;
  salario: string;
  eps: string;
  arl: string;
  afp: string;
  cajaCompensacion: string;
}

export function FormularioEditarColaborador({
  cargos,
  posiblesLideres,
  datosIniciales: d,
}: {
  cargos: { id: string; nombre: string; proceso_area: string | null }[];
  posiblesLideres: { id: string; nombre_completo: string }[];
  datosIniciales: DatosIniciales;
}) {
  const [nombreCompleto, setNombreCompleto] = useState(d.nombreCompleto);
  const [numeroDocumento, setNumeroDocumento] = useState(d.numeroDocumento);
  const [email, setEmail] = useState(d.email);
  const [telefono, setTelefono] = useState(d.telefono);
  const [cargoId, setCargoId] = useState(d.cargoId);
  const [liderId, setLiderId] = useState(d.liderId);
  const [fechaIngreso, setFechaIngreso] = useState(d.fechaIngreso);
  const [tipoContrato, setTipoContrato] = useState<TipoContrato>(d.tipoContrato);
  const [estado, setEstado] = useState<EstadoColaborador>(d.estado);
  const [salario, setSalario] = useState(d.salario);
  const [eps, setEps] = useState(d.eps);
  const [arl, setArl] = useState(d.arl);
  const [afp, setAfp] = useState(d.afp);
  const [cajaCompensacion, setCajaCompensacion] = useState(d.cajaCompensacion);

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function guardar() {
    setError(null);
    startTransition(async () => {
      const res = await actualizarColaborador({
        colaboradorId: d.id,
        nombreCompleto,
        numeroDocumento,
        email,
        telefono,
        cargoId,
        liderId,
        fechaIngreso,
        tipoContrato,
        estado,
        salario,
        eps,
        arl,
        afp,
        cajaCompensacion,
      });
      // Si la actualización fue exitosa, la acción redirige a la ficha y
      // este componente se desmonta antes de llegar aquí.
      if (res && !res.ok) setError(res.error);
    });
  }

  const campo = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';
  const label = 'block text-xs text-marmol-500 mb-1';

  return (
    <div className="card p-6 space-y-6 max-w-2xl">
      <section className="space-y-4">
        <h2 className="font-display font-semibold text-secundario text-sm">Datos personales</h2>
        <CargaHojaVidaIA
          onDatos={(datos) => {
            if (datos.nombre_completo) setNombreCompleto(datos.nombre_completo);
            if (datos.numero_documento) setNumeroDocumento(datos.numero_documento);
            if (datos.email) setEmail(datos.email);
            if (datos.telefono) setTelefono(datos.telefono);
          }}
        />
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={label}>Nombre completo *</label>
            <input type="text" value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={label}>Número de documento</label>
            <input type="text" value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={label}>Teléfono</label>
            <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} className={campo} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Correo</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@marmolesyservicios.com" className={campo} />
            <p className="text-[11px] text-marmol-400 mt-1">
              Este es el correo de contacto de la persona. La cuenta para iniciar sesión se edita aparte, en Usuarios y roles.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4 pt-4 border-t border-marmol-100">
        <h2 className="font-display font-semibold text-secundario text-sm">Cargo y organigrama</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Cargo *</label>
            <select value={cargoId} onChange={(e) => setCargoId(e.target.value)} className={campo}>
              <option value="">Selecciona…</option>
              {cargos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                  {c.proceso_area ? ` · ${c.proceso_area}` : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-marmol-400 mt-1">
              Al cambiar el cargo, la tarjeta &quot;Perfil de cargo&quot; de la ficha se actualiza sola con los datos del cargo nuevo.
            </p>
          </div>
          <div>
            <label className={label}>Líder directo</label>
            <select value={liderId} onChange={(e) => setLiderId(e.target.value)} className={campo}>
              <option value="">Sin líder asignado (o es gerencia)</option>
              {posiblesLideres.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre_completo}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4 pt-4 border-t border-marmol-100">
        <h2 className="font-display font-semibold text-secundario text-sm">Contrato</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Fecha de ingreso *</label>
            <input type="date" value={fechaIngreso} onChange={(e) => setFechaIngreso(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={label}>Estado</label>
            <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoColaborador)} className={campo}>
              {ESTADOS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-marmol-400 mt-1">
              Para registrar una salida, usa &quot;Salida&quot; en el Historial de la persona en vez de cambiar el estado aquí — eso además retira su cuenta de acceso.
            </p>
          </div>
          <div>
            <label className={label}>Tipo de contrato</label>
            <select value={tipoContrato} onChange={(e) => setTipoContrato(e.target.value as TipoContrato)} className={campo}>
              {TIPOS_CONTRATO.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Salario</label>
            <input
              type="number"
              inputMode="numeric"
              value={salario}
              onChange={(e) => setSalario(e.target.value)}
              placeholder="ej: 1600000"
              className={campo}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 pt-4 border-t border-marmol-100">
        <h2 className="font-display font-semibold text-secundario text-sm">Afiliaciones (SG-SST)</h2>
        <p className="text-[11px] text-marmol-400 -mt-2">
          Son datos de referencia para el certificado laboral y trazabilidad — el sistema no los calcula ni los valida contra ninguna entidad.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>EPS</label>
            <input type="text" value={eps} onChange={(e) => setEps(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={label}>ARL</label>
            <input type="text" value={arl} onChange={(e) => setArl(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={label}>AFP (pensión)</label>
            <input type="text" value={afp} onChange={(e) => setAfp(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={label}>Caja de compensación</label>
            <input type="text" value={cajaCompensacion} onChange={(e) => setCajaCompensacion(e.target.value)} className={campo} />
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-bajo">{error}</p>}

      <button
        type="button"
        disabled={pending || !nombreCompleto.trim() || !cargoId || !fechaIngreso}
        onClick={guardar}
        className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 transition"
      >
        {pending ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </div>
  );
}
