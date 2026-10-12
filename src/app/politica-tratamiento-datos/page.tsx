import { createAdminClient } from '@/lib/supabase/server';
import { VERSION_POLITICA } from '@/lib/reclutamiento/politica';
import Link from 'next/link';

export default async function PoliticaTratamientoDatosPage({ searchParams }: { searchParams?: { vacanteId?: string } }) {
  const supabase = createAdminClient();
  const vacanteId = searchParams?.vacanteId;

  // La política identifica al responsable: la empresa de la vacante desde la que se llegó.
  const { data: vacante } = vacanteId
    ? await supabase
        .from('vacantes')
        .select('empresa:empresas(nombre, nit, direccion, telefono)')
        .eq('id', vacanteId)
        .maybeSingle()
    : { data: null };
  const empresa = (vacante?.empresa as any) ?? null;

  return (
    <div className="min-h-screen px-4 py-10">
      <article className="mx-auto max-w-2xl space-y-5 text-sm text-marmol-700 leading-relaxed">
        <header>
          <h1 className="font-display text-2xl font-semibold text-secundario">Política de tratamiento de datos personales</h1>
          <p className="text-xs text-marmol-400 mt-1">Versión {VERSION_POLITICA} · Ley 1581 de 2012 y decretos reglamentarios</p>
        </header>

        <section className="space-y-1">
          <h2 className="font-semibold text-marmol-800">1. Responsable del tratamiento</h2>
          <p>
            {empresa?.nombre ?? 'La empresa que realiza este proceso de selección'}
            {empresa?.nit ? `, NIT ${empresa.nit}` : ''}
            {empresa?.direccion ? `, dirección ${empresa.direccion}` : ''}
            {empresa?.telefono ? `, teléfono ${empresa.telefono}` : ''}.
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="font-semibold text-marmol-800">2. Datos que recolectamos</h2>
          <p>Nombre, número de documento, teléfono, correo, perfil profesional en LinkedIn y tu hoja de vida, incluida tu formación, experiencia y competencias.</p>
        </section>

        <section className="space-y-1">
          <h2 className="font-semibold text-marmol-800">3. Finalidad</h2>
          <p>
            Usamos tus datos únicamente para evaluar tu experiencia, formación y competencias frente al cargo al que te postulas. No usamos tus datos
            con fines publicitarios, no vendemos bases de datos y no los compartimos con otras empresas sin una base legal válida y tu autorización.
          </p>
          <p>Si autorizas el banco de talento, también podremos considerarte para futuras vacantes durante 12 meses.</p>
        </section>

        <section className="space-y-1">
          <h2 className="font-semibold text-marmol-800">4. Autorización</h2>
          <p>
            Tu autorización es previa, informada y queda registrada con la versión de esta política que leíste. Sin ella no recolectamos tu hoja de vida.
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="font-semibold text-marmol-800">5. Conservación</h2>
          <p>
            Conservamos tus datos durante el proceso de selección y hasta 6 meses después, salvo que autorices el banco de talento (12 meses). Al vencer
            el plazo, tus datos se revisan y se suprimen.
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="font-semibold text-marmol-800">6. Seguridad y acceso</h2>
          <p>
            Solo consulta tu hoja de vida el personal de Talento Humano y, cuando se le asigna tu proceso, el líder evaluador y por tiempo limitado.
            Los archivos se guardan en un repositorio privado con controles de acceso. Si ocurre un incidente de seguridad, lo gestionamos y te informamos
            cuando la ley lo exige.
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="font-semibold text-marmol-800">7. Tus derechos</h2>
          <p>
            Puedes conocer, actualizar y rectificar tus datos; pedir prueba de la autorización; ser informado sobre su uso; revocar la autorización o pedir
            la supresión de tus datos cuando proceda; y presentar quejas ante la Superintendencia de Industria y Comercio.
          </p>
          <p>
            Para ejercer tus derechos usa el{' '}
            <Link href={`/ejercer-derechos${vacanteId ? `?vacanteId=${vacanteId}` : ''}`} className="text-flow-700 underline">
              formulario de derechos del titular
            </Link>
            .
          </p>
        </section>
      </article>
    </div>
  );
}
