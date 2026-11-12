'use client';

import { useState, useTransition } from 'react';
import { crearColaborador } from '@/app/(dashboard)/espiral-crecimiento/colaboradores/nuevo/actions';
import { CargaHojaVidaIA } from '@/components/espiral-crecimiento/carga-hoja-vida-ia';
import type { EstadoColaborador, TipoContrato } from '@/types/colaborador';
import { TIPOS_CONTRATO, calcularFinPrueba } from '@/lib/contratos';

const ESTADOS: { value: EstadoColaborador; label: string }[] = [
  { value: 'periodo_prueba', label: 'Período de prueba' },
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'en_proceso_salida', label: 'En proceso de salida' },
];

export function FormularioNuevoColaborador({
  cargos,
  posiblesLideres,
  cuentasSinFicha,
  datosIniciales,
}: {
  cargos: { id: string; nombre: string; proceso_area: string | null }[];
  posiblesLideres: { id: string; nombre_completo: string }[];
  cuentasSinFicha: { id: string; nombre_completo: string; email: string | null }[];
  /** Prellenado al llegar desde Reclutamiento y Selección (candidato ya contratado) — evita recapturar los datos. */
  datosIniciales?: { nombreCompleto: string; correo: string; telefono: string; cargoId: string; documento?: string; candidatoId?: string };
}) {
  const [usuarioVinculadoId, setUsuarioVinculadoId] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState(datosIniciales?.nombreCompleto ?? '');
  const [numeroDocumento, setNumeroDocumento] = useState(datosIniciales?.documento ?? '');
  const [email, setEmail] = useState(datosIniciales?.correo ?? '');
  const [telefono, setTelefono] = useState(datosIniciales?.telefono ?? '');
  const [cargoId, setCargoId] = useState(datosIniciales?.cargoId ?? '');
  const [liderId, setLiderId] = useState('');
  const [sinLiderConfirmado, setSinLiderConfirmado] = useState(false);
  const [equipoIds, setEquipoIds] = useState<string[]>([]);
  const [filtroEquipo, setFiltroEquipo] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState(() => new Date().toISOString().slice(0, 10));
  const [tipoContrato, setTipoContrato] = useState<TipoContrato>('indefinido');
  const [estado, setEstado] = useState<EstadoColaborador>('periodo_prueba');
  const [salario, setSalario] = useState('');
  const [eps, setEps] = useState('');
  const [arl, setArl] = useState('');
  const [afp, setAfp] = useState('');
  const [cajaCompensacion, setCajaCompensacion] = useState('');

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Al vincular una cuenta ya existente (creada antes desde Usuarios y
  // roles, sin ficha), se sugiere su nombre y correo tal como quedaron
  // registrados ahí -- se puede corregir igual, por si tenían un error.
  function vincularCuenta(id: string) {
    setUsuarioVinculadoId(id);
    const cuenta = cuentasSinFicha.find((c) => c.id === id);
    if (cuenta) {
      setNombreCompleto(cuenta.nombre_completo);
      setEmail(cuenta.email ?? '');
    }
  }

  function alternarEquipo(id: string) {
    setEquipoIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function crear() {
    setError(null);
    if (!liderId && !sinLiderConfirmado) {
      setError('Elige el líder directo para que la persona quede en el organigrama, o marca que no tiene líder (gerencia / nivel 1).');
      return;
    }
    startTransition(async () => {
      const res = await crearColaborador({
        usuarioId: usuarioVinculadoId || undefined,
        candidatoId: datosIniciales?.candidatoId,
        nombreCompleto,
        numeroDocumento,
        email,
        telefono,
        cargoId,
        liderId,
        equipoIds,
        fechaIngreso,
        tipoContrato,
        estado,
        salario,
        eps,
        arl,
        afp,
        cajaCompensacion,
      });
      // Si la creación fue exitosa, la acción redirige a la ficha del
      // colaborador y este componente se desmonta antes de llegar aquí.
      if (res && !res.ok) setError(res.error);
    });
  }

  const campo = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';
  const label = 'block text-xs text-marmol-500 mb-1';

  return (
    <div className="card p-6 space-y-6 max-w-2xl">
      {datosIniciales && (
        <p className="text-xs text-flow-700 bg-flow-50 border border-flow-100 rounded-lg px-3 py-2">
          Datos prellenados desde Reclutamiento y Selección — puedes corregirlos antes de guardar.
        </p>
      )}
      {cuentasSinFicha.length > 0 && (
        <section className="space-y-2">
          <label className={label}>Vincular a una cuenta de acceso existente (opcional)</label>
          <select value={usuarioVinculadoId} onChange={(e) => vincularCuenta(e.target.value)} className={campo}>
            <option value="">No vincular — es una persona nueva sin cuenta todavía</option>
            {cuentasSinFicha.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre_completo}
                {c.email ? ` · ${c.email}` : ''}
              </option>
            ))}
          </select>
          <p className="text-[13px] text-marmol-400">
            Úsalo cuando ya le crearon el usuario para iniciar sesión desde Usuarios y roles, pero
            todavía no tiene su ficha de colaborador.
          </p>
        </section>
      )}

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
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@empresa.com" className={campo} />
            <p className="text-[13px] text-marmol-400 mt-1">
              Este es el correo de contacto de la persona. La cuenta para iniciar sesión se crea aparte, en Usuarios y roles.
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
          </div>
          <div>
            <label className={label}>Líder directo *</label>
            <select
              value={liderId}
              onChange={(e) => {
                setLiderId(e.target.value);
                if (e.target.value) setSinLiderConfirmado(false);
              }}
              className={campo}
            >
              <option value="">— Elige el líder —</option>
              {posiblesLideres.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre_completo}
                </option>
              ))}
            </select>
            {liderId ? (
              <p className="text-[12px] text-alto mt-1">Quedará en el organigrama bajo este líder apenas lo crees.</p>
            ) : (
              <label className="flex items-center gap-2 text-[12px] text-marmol-500 mt-1">
                <input type="checkbox" checked={sinLiderConfirmado} onChange={(e) => setSinLiderConfirmado(e.target.checked)} />
                Esta persona no tiene líder (gerencia / nivel 1)
              </label>
            )}
          </div>
        </div>

        <details className="rounded-lg border border-marmol-200 p-3">
          <summary className="cursor-pointer text-sm text-marmol-700 font-medium">
            Personas que tendrá a cargo (opcional){equipoIds.length > 0 ? ` · ${equipoIds.length} elegida(s)` : ''}
          </summary>
          <p className="text-[12px] text-marmol-400 mt-2">
            Si esta persona es líder, marca a quienes pasan a reportarle. Quien ya tenga otro líder cambiará a este.
            También lo puedes hacer después en Administración → Organigrama.
          </p>
          <input
            value={filtroEquipo}
            onChange={(e) => setFiltroEquipo(e.target.value)}
            placeholder="Buscar persona…"
            className={`${campo} mt-2`}
          />
          <ul className="mt-2 max-h-48 overflow-y-auto divide-y divide-marmol-100 rounded-lg border border-marmol-100">
            {posiblesLideres
              .filter((p) => p.id !== liderId && p.nombre_completo.toLowerCase().includes(filtroEquipo.trim().toLowerCase()))
              .map((p) => (
                <li key={p.id}>
                  <label className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-marmol-50">
                    <input type="checkbox" checked={equipoIds.includes(p.id)} onChange={() => alternarEquipo(p.id)} />
                    {p.nombre_completo}
                  </label>
                </li>
              ))}
          </ul>
        </details>
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
            {(() => {
              const prueba = calcularFinPrueba(tipoContrato, fechaIngreso);
              if (prueba) {
                return (
                  <p className="text-xs text-marmol-500 mt-1">
                    Período de prueba: hasta el <strong>{prueba.fecha}</strong> ({prueba.descripcion}).
                  </p>
                );
              }
              if (tipoContrato === 'fijo') {
                return (
                  <p className="text-xs text-marmol-500 mt-1">
                    En término fijo el período de prueba es la quinta parte de la duración pactada (máx. 2 meses).
                  </p>
                );
              }
              if (['prestacion_servicios', 'empleado_mision', 'externo'].includes(tipoContrato)) {
                return <p className="text-xs text-marmol-500 mt-1">Este tipo de vinculación no maneja período de prueba laboral.</p>;
              }
              return null;
            })()}
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
        <p className="text-[13px] text-marmol-400 -mt-2">
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
        onClick={crear}
        className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 transition"
      >
        {pending ? 'Creando…' : 'Crear colaborador'}
      </button>
    </div>
  );
}
