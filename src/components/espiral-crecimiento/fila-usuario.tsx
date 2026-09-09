'use client';

import { useState, useTransition } from 'react';
import {
  actualizarUsuario,
  cambiarEstadoUsuario,
  eliminarUsuarioDefinitivamente,
  restablecerPassword,
} from '@/app/(dashboard)/administracion/usuarios/actions';
import { etiquetaRol, generarPassword } from '@/lib/utils';
import { Pencil, Check, X, Trash2, KeyRound, Copy } from 'lucide-react';
import type { RolUsuario } from '@/types/colaborador';

const ROLES: RolUsuario[] = ['admin_th', 'lider', 'colaborador', 'gerencia', 'auditor_externo'];

export interface UsuarioFila {
  id: string;
  nombre_completo: string;
  nombre_preferido: string | null;
  usuario: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
}

export function FilaUsuario({ usuario, esUsuarioActual }: { usuario: UsuarioFila; esUsuarioActual: boolean }) {
  const [editando, setEditando] = useState(false);
  const [nombreCompleto, setNombreCompleto] = useState(usuario.nombre_completo);
  const [nombrePreferido, setNombrePreferido] = useState(usuario.nombre_preferido ?? '');
  const [usuarioLogin, setUsuarioLogin] = useState(usuario.usuario);
  const [email, setEmail] = useState(usuario.email);
  const [rol, setRol] = useState<RolUsuario>(usuario.rol);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [restableciendo, setRestableciendo] = useState(false);
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordRevelada, setPasswordRevelada] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  function guardar() {
    setError(null);
    startTransition(async () => {
      const res = await actualizarUsuario({
        usuarioId: usuario.id,
        nombreCompleto,
        nombrePreferido: nombrePreferido || undefined,
        usuario: usuarioLogin,
        email,
        rol,
      });
      if (res.ok) {
        setEditando(false);
      } else {
        setError(res.error);
      }
    });
  }

  function cancelar() {
    setNombreCompleto(usuario.nombre_completo);
    setNombrePreferido(usuario.nombre_preferido ?? '');
    setUsuarioLogin(usuario.usuario);
    setEmail(usuario.email);
    setRol(usuario.rol);
    setError(null);
    setEditando(false);
  }

  function retirarOReactivar() {
    const mensaje = usuario.activo
      ? `¿Retirar a ${usuario.nombre_completo}? Queda inactivo y no podrá iniciar sesión — se puede reactivar cuando quieras.`
      : `¿Reactivar a ${usuario.nombre_completo}?`;
    if (!confirm(mensaje)) return;
    setError(null);
    startTransition(async () => {
      const res = await cambiarEstadoUsuario(usuario.id, !usuario.activo);
      if (!res.ok) setError(res.error);
    });
  }

  function eliminarDefinitivamente() {
    const mensaje = `¿Eliminar definitivamente a ${usuario.nombre_completo}? Esto NO se puede deshacer — se borra la cuenta por completo, a diferencia de "Retirar" que solo la deja inactiva.`;
    if (!confirm(mensaje)) return;
    setError(null);
    startTransition(async () => {
      const res = await eliminarUsuarioDefinitivamente(usuario.id);
      if (!res.ok) setError(res.error);
    });
  }

  function iniciarRestablecer() {
    setError(null);
    setPasswordRevelada(null);
    setCopiado(false);
    setPasswordNueva(generarPassword());
    setRestableciendo(true);
  }

  function guardarPassword() {
    setError(null);
    startTransition(async () => {
      const res = await restablecerPassword({ usuarioId: usuario.id, password: passwordNueva });
      if (res.ok) {
        setRestableciendo(false);
        setPasswordRevelada(passwordNueva);
      } else {
        setError(res.error);
      }
    });
  }

  if (editando) {
    return (
      <tr className="border-b border-marmol-100 last:border-0 bg-flow-50/40">
        <td className="px-4 py-2.5 space-y-1">
          <input
            type="text"
            value={nombreCompleto}
            onChange={(e) => setNombreCompleto(e.target.value)}
            placeholder="Nombre completo"
            className="w-full rounded-lg border border-marmol-200 px-2 py-1 text-sm"
          />
          <input
            type="text"
            value={nombrePreferido}
            onChange={(e) => setNombrePreferido(e.target.value)}
            placeholder="Cómo le gusta que le llamen (opcional)"
            className="w-full rounded-lg border border-marmol-200 px-2 py-1 text-xs text-marmol-500"
          />
        </td>
        <td className="px-4 py-2.5">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-marmol-200 px-2 py-1 text-sm"
          />
        </td>
        <td className="px-4 py-2.5">
          <input
            type="text"
            value={usuarioLogin}
            onChange={(e) => setUsuarioLogin(e.target.value.toLowerCase())}
            placeholder="nombre.apellido"
            className="w-full rounded-lg border border-marmol-200 px-2 py-1 text-xs font-mono"
          />
        </td>
        <td className="px-4 py-2.5">
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value as RolUsuario)}
            className="rounded-lg border border-marmol-200 px-2 py-1 text-xs"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {etiquetaRol[r]}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-2.5 text-marmol-500">{usuario.activo ? 'Activo' : 'Inactivo'}</td>
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={guardar}
              disabled={pending || !nombreCompleto || !email || !usuarioLogin}
              className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-2.5 py-1.5"
            >
              <Check size={12} /> {pending ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={cancelar}
              disabled={pending}
              className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 text-marmol-600 hover:bg-marmol-100 text-xs font-medium px-2.5 py-1.5"
            >
              <X size={12} /> Cancelar
            </button>
          </div>
          {error && <p className="mt-1.5 text-xs text-bajo">{error}</p>}
        </td>
      </tr>
    );
  }

  if (restableciendo) {
    return (
      <tr className="border-b border-marmol-100 last:border-0 bg-flow-50/40">
        <td colSpan={6} className="px-4 py-3">
          <p className="text-xs text-marmol-500 mb-1.5">
            Nueva contraseña temporal para {usuario.nombre_completo}:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={passwordNueva}
              onChange={(e) => setPasswordNueva(e.target.value)}
              className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm font-mono w-44"
            />
            <button
              type="button"
              onClick={() => setPasswordNueva(generarPassword())}
              className="text-xs text-flow-600 hover:underline"
            >
              Generar otra
            </button>
            <button
              type="button"
              onClick={guardarPassword}
              disabled={pending || passwordNueva.length < 8}
              className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-2.5 py-1.5"
            >
              <Check size={12} /> {pending ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => {
                setRestableciendo(false);
                setError(null);
              }}
              disabled={pending}
              className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 text-marmol-600 hover:bg-marmol-100 text-xs font-medium px-2.5 py-1.5"
            >
              <X size={12} /> Cancelar
            </button>
          </div>
          {error && <p className="mt-1.5 text-xs text-bajo">{error}</p>}
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr className="border-b border-marmol-100 last:border-0">
        <td className="px-4 py-3">
          <p className="font-medium text-marmol-900">{usuario.nombre_completo}</p>
          {usuario.nombre_preferido && (
            <p className="text-xs text-marmol-400">se hace llamar "{usuario.nombre_preferido}"</p>
          )}
        </td>
        <td className="px-4 py-3 text-marmol-600">{usuario.email}</td>
        <td className="px-4 py-3 text-marmol-500 font-mono text-xs">{usuario.usuario}</td>
        <td className="px-4 py-3">
          <span className="text-xs rounded-full bg-flow-50 text-flow-700 px-2 py-0.5 font-medium">
            {etiquetaRol[usuario.rol] ?? usuario.rol}
          </span>
        </td>
        <td className="px-4 py-3 text-marmol-500">{usuario.activo ? 'Activo' : 'Inactivo'}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="inline-flex items-center gap-1 text-xs text-marmol-500 hover:text-flow-600"
            >
              <Pencil size={12} /> Editar
            </button>
            <button
              type="button"
              onClick={iniciarRestablecer}
              className="inline-flex items-center gap-1 text-xs text-marmol-500 hover:text-flow-600"
            >
              <KeyRound size={12} /> Restablecer contraseña
            </button>
            {!esUsuarioActual && (
              <>
                <button
                  type="button"
                  onClick={retirarOReactivar}
                  disabled={pending}
                  className={
                    usuario.activo
                      ? 'text-xs text-marmol-500 hover:text-bajo disabled:opacity-40'
                      : 'text-xs text-marmol-500 hover:text-alto disabled:opacity-40'
                  }
                >
                  {pending ? '…' : usuario.activo ? 'Retirar' : 'Reactivar'}
                </button>
                <button
                  type="button"
                  onClick={eliminarDefinitivamente}
                  disabled={pending}
                  title="Eliminar definitivamente — no se puede deshacer"
                  className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-bajo disabled:opacity-40"
                >
                  <Trash2 size={12} /> Eliminar
                </button>
              </>
            )}
          </div>
          {error && <p className="mt-1 text-xs text-bajo">{error}</p>}
        </td>
      </tr>
      {passwordRevelada && (
        <tr className="border-b border-marmol-100 last:border-0 bg-flow-50/40">
          <td colSpan={6} className="px-4 py-3">
            <p className="text-xs text-marmol-500 mb-1">
              Comparte esta contraseña con {usuario.nombre_completo} por un canal seguro — no volverá a
              mostrarse.
            </p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono bg-white border border-marmol-200 rounded px-2 py-1">
                {passwordRevelada}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(passwordRevelada);
                  setCopiado(true);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-xs px-2 py-1.5 transition"
              >
                <Copy size={12} /> {copiado ? 'Copiado' : 'Copiar'}
              </button>
              <button
                type="button"
                onClick={() => setPasswordRevelada(null)}
                className="text-xs text-marmol-400 hover:text-marmol-600"
              >
                Listo
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
