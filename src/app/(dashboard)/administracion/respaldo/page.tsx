import { redirect } from 'next/navigation';
import { DatabaseBackup, Download } from 'lucide-react';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';

export default async function RespaldoPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/inicio');

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <DatabaseBackup size={22} className="text-flow-600" /> Respaldo de datos
        </h1>
        <p className="text-sm text-marmol-500 mt-1">
          Descarga todos los datos de tu empresa en un archivo ZIP con un CSV por tabla. Sirve para
          tener copia fuera de la plataforma o para migrar la información.
        </p>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-marmol-800">Qué incluye</h2>
        <ul className="list-disc pl-5 text-sm text-marmol-600 space-y-1">
          <li>Datos de la empresa, colaboradores, cargos, usuarios y roles.</li>
          <li>Reclutamiento (vacantes, candidatos, postulaciones, entrevistas, autorizaciones de datos).</li>
          <li>Espiral 360, procesos, indicadores, ACPM, documentos, auditorías y dotaciones.</li>
          <li>Nexa, clima, guías del Flow y alertas.</li>
          <li>Un archivo LEEME.txt con el conteo de filas por tabla y la fecha del respaldo.</li>
        </ul>
        <p className="text-xs text-marmol-500">
          Los archivos están en UTF-8 con BOM, para que Excel abra bien las tildes. Las celdas con listas u
          objetos van en JSON. El respaldo contiene datos personales: guárdalo en un lugar seguro y con acceso
          restringido.
        </p>
        <a
          href="/api/respaldo"
          className="inline-flex items-center gap-2 rounded-lg bg-flow-600 hover:bg-flow-700 text-white text-sm font-medium px-4 py-2.5 transition"
        >
          <Download size={16} /> Descargar respaldo completo (.zip)
        </a>
      </div>
    </div>
  );
}
