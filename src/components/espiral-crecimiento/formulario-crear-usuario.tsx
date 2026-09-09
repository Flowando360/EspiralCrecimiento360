'use client';

import { useState, useTransition } from 'react';
import { crearCuentaUsuario } from '@/app/(dashboard)/administracion/usuarios/actions';
import { etiquetaRol, cn, generarPassword, usuarioSugerido } from '@/lib/utils';
import { Check, Copy, UserPlus } from 'lucide-react';
import type { RolUsuario } from '@/types/colaborador';

const ROLES: RolUsuario[] = ['admin_th', 'lider', 'colaborador', 'gerencia', 'auditor_externo'];

export function FormularioCrearUsuario({
  colaboradoresSinCuenta,
}: {
  colaboradoresSinCuenta: { id: string; nombre_completo: string }[];
}) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [modo, setModo] = useState<'vincular' | 'nueva'>('vincular');
  const [colaboradorId, setColaboradorId] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [usuario, setUsuarioState] = useState('');
  const [usuarioTocado, setUsuarioTocado] = useState(false);
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<RolUsuario>('colaborador');
  const [password, setPassword] = useState(generarPassword());
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<{ ok: boolean; error?: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  // El usuario se sugiere solo a partir del nombre, siempre que admin_th no
  // lo haya editado a mano todavía (para no pisarle una corrección).
  function actualizarNombre(valor: string) {
    setNombreCompleto(valor);
    if (!usuarioTocado) setUsuarioState(usuarioSugerido(valor));
  }

  function actualizarUsuario(valor: string) {
    setUsuarioState(valor.toLowerCase());
    setUsuarioTocado(true);
  }

  function seleccionarColaborador(id: string) {
    setColaboradorId(id);
    const co = colaboradoresSinCuenta.find((c) => c.id === id);
    if (co) actualizarNombre(co.nombre_completo);
  }

  function limpiar() {
    setColaboradorId('');
    setNombreCompleto('');
    setUsuarioState('');
    setUsuarioTocado(false);
    setEmail('');
    setRol('colaborador');
    setPassword(generarPassword());
    setCopiado(false);
  }

  function crear() {
    setResultado(null);
    startTransition(async () => {
      const res = await crearCuentaUsuario({
        nombreCompleto,
        usuario,
        email,
        rol,
        password,
        colaboradorId: modo === 'vincular' && colaboradorId ? colaboradorId : undefined,
      });
      setResultado(res);
      if (res.ok) {
        // Deja la contraseña visible para copiarla; no reinicia el form todavía.
      }
    });
  }

  if (!mostrarForm) {
    return (
      <button
        type="button"
        onClick={() => setMostrarForm(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3.5 py-2 transition"
      >
        <UserPlus size={16} /> Crear cuenta
      </button>
    );
  }

  return (
    <div className="card p-5 space-y-4 max-w-lg">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-secundario">Crear cuenta</h2>
        <button
          type="button"
          onClick={() => {
            setMostrarForm(false);
            limpiar();
            setResultado(null);
          }}
          className="text-xs text-marmol-400 hover:text-marmol-600"
        >
          Cerrar
        </button>
      </div>

      {resultado?.ok ? (
        <div className="space-y-3">
          <p className="text-sm text-alto flex items-center gap-1.5">
            <Check size={14} /> Cuenta creada correctamente.
          </p>
          <div className="rounded-lg border border-flow-200 bg-flow-50 p-3">
            <p className="text-xs text-marmol-500 mb-1">
              Comparte esta contraseña temporal con {nombreCompleto} por un canal seguro — no volverá a
              mostrarse.
            </p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono bg-white border border-marmol-200 rounded px-2 py-1 flex-1">
                {password}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(password);
                  setCopiado(true);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-xs px-2 py-1.5 transition"
              >
                <Copy size={12} /> {copiado ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              limpiar();
              setResultado(null);
            }}
            className="text-sm text-flow-600 hover:underline"
          >
            Crear otra cuenta
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setModo('vincular')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition',
                modo === 'vincular' ? 'bg-flow-500 text-white' : 'text-marmol-600 hover:bg-marmol-100'
              )}
            >
              Vincular a colaborador existente
            </button>
            <button
              type="button"
              onClick={() => setModo('nueva')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition',
                modo === 'nueva' ? 'bg-flow-500 text-white' : 'text-marmol-600 hover:bg-marmol-100'
              )}
            >
              Cuenta sin ficha (ej. Gerencia)
            </button>
          </div>

          {modo === 'vincular' && (
            <div>
              <label className="block text-xs text-marmol-500 mb-1">Colaborador</label>
              <select
                value={colaboradorId}
                onChange={(e) => seleccionarColaborador(e.target.value)}
                className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
              >
                <option value="">Selecciona…</option>
                {colaboradoresSinCuenta.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre_completo}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs text-marmol-500 mb-1">Nombre completo</label>
            <input
              type="text"
              value={nombreCompleto}
              onChange={(e) => actualizarNombre(e.target.value)}
              className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-marmol-500 mb-1">Usuario (para iniciar sesión)</label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => actualizarUsuario(e.target.value)}
              placeholder="nombre.apellido"
              className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm font-mono"
            />
            <p className="text-[11px] text-marmol-400 mt-1">
              Se sugiere solo a partir del nombre — independiente del correo. Puedes corregirlo si hay un
              choque con otra persona o el nombre trae algún error.
            </p>
          </div>

          <div>
            <label className="block text-xs text-marmol-500 mb-1">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@marmolesyservicios.com"
              className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-marmol-500 mb-1">Rol</label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value as RolUsuario)}
              className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {etiquetaRol[r]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-marmol-500 mb-1">Contraseña temporal</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => setPassword(generarPassword())}
                className="text-xs text-flow-600 hover:underline shrink-0"
              >
                Generar otra
              </button>
            </div>
          </div>

          {resultado && !resultado.ok && <p className="text-sm text-bajo">{resultado.error}</p>}

          <button
            type="button"
            disabled={pending || !nombreCompleto || !usuario || !email || password.length < 8}
            onClick={crear}
            className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 transition"
          >
            {pending ? 'Creando…' : 'Crear cuenta'}
          </button>
        </>
      )}
    </div>
  );
}
