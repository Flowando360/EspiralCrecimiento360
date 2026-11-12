import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ScrollText, FileSpreadsheet } from 'lucide-react';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { puedeAdministrar } from '@/lib/permisos/administracion';
import { obtenerAuditoria, MODULOS_AUDITORIA, leerFiltrosAuditoria } from './data';

type Params = { modulo?: string; usuario?: string; desde?: string; hasta?: string };

const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', { timeZone: 'America/Bogota', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default async function AuditoriaPage({ searchParams }: { searchParams: Params }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!puedeAdministrar(perfil)) redirect('/inicio');

  const filtros = leerFiltrosAuditoria(searchParams as Record<string, string | undefined>);
  const { filas, truncado, usuarios } = await obtenerAuditoria(perfil.empresa_id, filtros);
  const hayFiltro = Boolean(filtros.modulo || filtros.usuario || filtros.desde || filtros.hasta);
  const qs = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
            <ScrollText size={22} className="text-flow-600" /> Auditoría de cambios
          </h1>
          <p className="text-sm text-marmol-500 mt-1 max-w-3xl">
            Quién cambió qué y cuándo en la configuración de la empresa: usuarios, roles y permisos, datos de la empresa, ponderaciones, parámetros legales, competencias y cargos.
            El registro es de solo lectura: nadie puede editarlo ni borrarlo desde la aplicación.
          </p>
        </div>
        <a
          href={`/api/administracion/auditoria${qs ? `?${qs}` : ''}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-sm font-medium px-3.5 py-2 transition"
        >
          <FileSpreadsheet size={16} /> Exportar a Excel
        </a>
      </div>

      <form method="get" className="card p-3 flex flex-wrap items-end gap-3">
        <label className="text-xs text-marmol-500 flex flex-col gap-1">
          Módulo
          <select name="modulo" defaultValue={filtros.modulo ?? ''} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
            <option value="">Todos</option>
            {MODULOS_AUDITORIA.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-marmol-500 flex flex-col gap-1">
          Quién lo hizo
          <select name="usuario" defaultValue={filtros.usuario ?? ''} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
            <option value="">Cualquiera</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-marmol-500 flex flex-col gap-1">
          Desde
          <input type="date" name="desde" defaultValue={filtros.desde ?? ''} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
        </label>
        <label className="text-xs text-marmol-500 flex flex-col gap-1">
          Hasta
          <input type="date" name="hasta" defaultValue={filtros.hasta ?? ''} className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
        </label>
        <button type="submit" className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3.5 py-1.5 transition">
          Aplicar
        </button>
        {hayFiltro && (
          <Link href="/administracion/auditoria" className="text-xs text-flow-600 hover:underline pb-2">
            Quitar filtros
          </Link>
        )}
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
              <th className="px-4 py-2 font-medium whitespace-nowrap">Fecha</th>
              <th className="px-4 py-2 font-medium">Quién</th>
              <th className="px-4 py-2 font-medium">Módulo</th>
              <th className="px-4 py-2 font-medium">Qué cambió</th>
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-marmol-400">
                  No hay cambios registrados con estos filtros.
                </td>
              </tr>
            ) : (
              filas.map((f) => (
                <tr key={f.id} className="border-b border-marmol-100 last:border-0 align-top">
                  <td className="px-4 py-2 text-marmol-500 whitespace-nowrap">{fechaHora(f.creado_en)}</td>
                  <td className="px-4 py-2 text-marmol-800">{f.usuario_nombre ?? '—'}</td>
                  <td className="px-4 py-2 text-marmol-600">{MODULOS_AUDITORIA.find((m) => m.value === f.modulo)?.label ?? f.modulo}</td>
                  <td className="px-4 py-2 text-marmol-800">
                    {f.resumen}
                    {f.detalle && Object.keys(f.detalle).length > 0 && (
                      <details className="mt-1">
                        <summary className="text-xs text-flow-600 cursor-pointer">Ver detalle</summary>
                        <pre className="text-[11px] text-marmol-500 bg-marmol-50 rounded p-2 mt-1 whitespace-pre-wrap break-words">{JSON.stringify(f.detalle, null, 2)}</pre>
                      </details>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {truncado && <p className="text-xs text-marmol-400">Se muestran los 300 cambios más recientes. Usa los filtros o exporta a Excel para ver más.</p>}
    </div>
  );
}
