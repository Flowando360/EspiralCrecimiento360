import { createAdminClient } from '@/lib/supabase/server';
import { FormularioDerechos } from '@/components/reclutamiento/formulario-derechos';

export default async function EjercerDerechosPage({ searchParams }: { searchParams?: { vacanteId?: string } }) {
  const vacanteId = searchParams?.vacanteId;
  const valido = vacanteId
    ? !!(await createAdminClient().from('vacantes').select('id').eq('id', vacanteId).maybeSingle()).data
    : false;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg card p-6 space-y-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-secundario">Ejercer mis derechos</h1>
          <p className="text-sm text-marmol-500 mt-1">
            Puedes consultar, corregir, revocar la autorización o pedir la supresión de tus datos. Revisaremos tu solicitud y te responderemos al correo que indiques.
          </p>
        </div>
        {valido ? (
          <FormularioDerechos vacanteId={vacanteId!} />
        ) : (
          <p className="text-sm text-marmol-500">Este enlace no es válido. Pide a la empresa el enlace correcto.</p>
        )}
      </div>
    </div>
  );
}
