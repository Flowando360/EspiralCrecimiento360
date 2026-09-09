import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { formatearFecha } from '@/lib/utils';
import type { FilaCultura } from './data';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: 'Helvetica' },
  titulo: { fontSize: 16, fontWeight: 700, marginBottom: 2, color: '#1B2A5B' },
  subtitulo: { fontSize: 9, color: '#6b7280', marginBottom: 16 },
  fila: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingVertical: 4 },
  filaEncabezado: { backgroundColor: '#f3f4f6', fontWeight: 700 },
  celdaColaborador: { width: '30%' },
  celdaNumero: { width: '17.5%' },
  vacio: { color: '#9ca3af' },
});

export function InformeCulturaDocument({ filas }: { filas: FilaCultura[] }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.titulo}>Cultura y Engagement</Text>
        <Text style={styles.subtitulo}>Generado el {formatearFecha(new Date())}</Text>

        {filas.length === 0 ? (
          <Text style={styles.vacio}>Sin datos todavía.</Text>
        ) : (
          <>
            <View style={[styles.fila, styles.filaEncabezado]}>
              <Text style={styles.celdaColaborador}>Colaborador</Text>
              <Text style={styles.celdaNumero}>Reconocimientos</Text>
              <Text style={styles.celdaNumero}>Puntos</Text>
              <Text style={styles.celdaNumero}>Reacciones dadas</Text>
              <Text style={styles.celdaNumero}>Formación de cultura</Text>
            </View>
            {filas.map((f) => (
              <View key={f.colaborador_id} style={styles.fila} wrap={false}>
                <Text style={styles.celdaColaborador}>{f.colaborador_nombre}</Text>
                <Text style={styles.celdaNumero}>{f.reconocimientos_recibidos}</Text>
                <Text style={styles.celdaNumero}>{f.puntos_totales}</Text>
                <Text style={styles.celdaNumero}>{f.reacciones_dadas}</Text>
                <Text style={styles.celdaNumero}>{f.cursos_cultura_completados}</Text>
              </View>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
}
