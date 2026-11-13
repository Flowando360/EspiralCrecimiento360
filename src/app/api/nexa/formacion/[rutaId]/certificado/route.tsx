import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer, Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const s = StyleSheet.create({
  page: { padding: 48, fontFamily: 'Helvetica', justifyContent: 'center' },
  marco: { borderWidth: 3, borderColor: '#1B2A5B', padding: 36 },
  empresa: { fontSize: 11, color: '#6b7280', textAlign: 'center', marginBottom: 18 },
  titulo: { fontSize: 26, fontWeight: 700, color: '#1B2A5B', textAlign: 'center', marginBottom: 20 },
  texto: { fontSize: 12, textAlign: 'center', color: '#374151', marginBottom: 6 },
  nombre: { fontSize: 22, fontWeight: 700, textAlign: 'center', marginVertical: 10, color: '#111827' },
  curso: { fontSize: 16, fontWeight: 700, textAlign: 'center', marginVertical: 10, color: '#1B2A5B' },
  pie: { marginTop: 28, fontSize: 9, color: '#9ca3af', textAlign: 'center' },
});

function fechaLarga(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Certificado de completitud de un curso (informe de Luisa 4.18.3). Solo la propia persona, su líder o Talento Humano. */
export async function GET(_req: NextRequest, { params }: { params: { rutaId: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const supabase = createClient() as any;
  // La RLS de nexa_rutas_formacion ya limita quién puede leer la fila.
  const { data: ruta } = await supabase
    .from('nexa_rutas_formacion')
    .select('id, estado, completado_en, quiz_puntaje_pct, colaborador:colaborador_id(nombre_completo, empresa_id), curso:curso_id(titulo, duracion_minutos)')
    .eq('id', params.rutaId)
    .maybeSingle();
  if (!ruta || ruta.colaborador?.empresa_id !== perfil.empresa_id) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  if (ruta.estado !== 'completado' || !ruta.completado_en) return NextResponse.json({ error: 'El curso aún no está completado' }, { status: 409 });

  const { data: empresa } = await supabase.from('empresas').select('nombre').eq('id', perfil.empresa_id).maybeSingle();

  const doc = (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.marco}>
          <Text style={s.empresa}>{empresa?.nombre ?? ''}</Text>
          <Text style={s.titulo}>Certificado de completitud</Text>
          <Text style={s.texto}>Se certifica que</Text>
          <Text style={s.nombre}>{ruta.colaborador?.nombre_completo}</Text>
          <Text style={s.texto}>completó satisfactoriamente el curso</Text>
          <Text style={s.curso}>{ruta.curso?.titulo}</Text>
          <Text style={s.texto}>
            {ruta.curso?.duracion_minutos ? `Duración: ${ruta.curso.duracion_minutos} minutos. ` : ''}
            {ruta.quiz_puntaje_pct != null ? `Calificación de la prueba: ${ruta.quiz_puntaje_pct}%. ` : ''}
            Fecha de finalización: {fechaLarga(ruta.completado_en)}.
          </Text>
          <Text style={s.pie}>Emitido por Espiral de Crecimiento 360° · Código {String(ruta.id).slice(0, 8).toUpperCase()}</Text>
        </View>
      </Page>
    </Document>
  );
  const buffer = await renderToBuffer(doc);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificado-${String(ruta.id).slice(0, 8)}.pdf"`,
    },
  });
}
