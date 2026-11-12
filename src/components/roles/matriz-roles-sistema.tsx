import { Fragment } from 'react';
import { Check, Minus, FileSpreadsheet } from 'lucide-react';
import { ROLES_SISTEMA, ALCANCE_POR_ROL, filasMatrizRoles } from '@/lib/permisos/matriz';

/** Qué pantallas ve cada rol de sistema. Sale del mismo menú de la aplicación, por lo que siempre está al día. */
export function MatrizRolesSistema() {
  const filas = filasMatrizRoles();
  const grupos = Array.from(new Set(filas.map((f) => f.grupo)));

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-marmol-200 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display font-semibold text-secundario">Matriz de roles del sistema</h2>
          <p className="text-xs text-marmol-500 mt-1 max-w-2xl">
            Qué pantallas ve cada rol. Es el acceso base: un rol personalizado solo puede quitar módulos, nunca dar más de lo que su rol de sistema permite.
          </p>
        </div>
        <a
          href="/api/administracion/matriz-roles"
          className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-sm font-medium px-3 py-1.5 transition"
        >
          <FileSpreadsheet size={15} /> Descargar en Excel
        </a>
      </div>

      <div className="px-5 py-3 border-b border-marmol-100 grid md:grid-cols-2 gap-x-6 gap-y-2">
        {ROLES_SISTEMA.map((r) => (
          <p key={r.value} className="text-xs text-marmol-600">
            <strong className="text-marmol-800">{r.label}:</strong> {ALCANCE_POR_ROL[r.value]}
          </p>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
              <th className="px-4 py-2 font-medium">Pantalla</th>
              {ROLES_SISTEMA.map((r) => (
                <th key={r.value} className="px-3 py-2 font-medium text-center whitespace-nowrap">
                  {r.label.replace('Administrador de ', 'Admin. ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grupos.map((g) => (
              <Fragment key={g}>
                <tr className="bg-marmol-50">
                  <td colSpan={ROLES_SISTEMA.length + 1} className="px-4 py-1.5 text-xs font-semibold text-secundario">
                    {g}
                  </td>
                </tr>
                {filas
                  .filter((f) => f.grupo === g)
                  .map((f) => (
                    <tr key={f.ruta} className="border-b border-marmol-100 last:border-0">
                      <td className="px-4 py-1.5 text-marmol-800">{f.pantalla}</td>
                      {ROLES_SISTEMA.map((r) => (
                        <td key={r.value} className="px-3 py-1.5 text-center">
                          {f.roles[r.value] ? <Check size={14} className="inline text-alto" aria-label="Sí" /> : <Minus size={14} className="inline text-marmol-300" aria-label="No" />}
                        </td>
                      ))}
                    </tr>
                  ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
