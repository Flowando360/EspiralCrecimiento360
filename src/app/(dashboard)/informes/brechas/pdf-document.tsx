import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { formatearFecha } from '@/lib/utils';
import type { FilaBrecha, Agrupacion } from './data';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica' },
  titulo: { fontSize: 16, fontWeight: 700, marginBottom: 2, color: '#1B2A5B' },
  subtitulo: { fontSize: 9, color: '#6b7280', marginBottom: 16 },
  fila: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingVertical: 5 },
  filaEncabezado: { backgroundColor: '#f3f4f6', fontWeight: 700 },
  celdaGrupo: { width: '30%' },
  celdaN: { width: '10%' },
  celdaDim: { width: '15%' },
  nota: { fontSize: 8, color: '#9ca3af', marginTop: 10 },
});

export function BrechasDocument({ filas, agrupacion }: { filas: FilaBrecha[]; agrupacion: Agrupacion }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.titulo}>Informe de brechas por dimensión</Text>
        <Text style={styles.subtitulo}>
          Comparativo {agrupacion === 'equipo' ? 'por equipo' : 'por área'} · Generado el {formatearFecha(new Date())}
        </Text>

        <View style={[styles.fila, styles.filaEncabezado]}>
          <Text style={styles.celdaGrupo}>{agrupacion === 'equipo' ? 'Equipo (líder)' : 'Área'}</Text>
          <Text style={styles.celdaN}>Personas</Text>
          <Text style={styles.celdaDim}>Ser</Text>
          <Text style={styles.celdaDim}>Saber</Text>
          <Text style={styles.celdaDim}>Hacer</Text>
          <Text style={styles.celdaDim}>Deber</Text>
        </View>

        {filas.map((f) => (
          <View key={f.grupo} style={styles.fila} wrap={false}>
            <Text style={styles.celdaGrupo}>{f.grupo}</Text>
            <Text style={styles.celdaN}>{f.tamano}</Text>
            <Text style={styles.celdaDim}>{f.ser.promedio ?? 'Sin dato'}</Text>
            <Text style={styles.celdaDim}>{f.saber.promedio != null ? `${f.saber.promedio}%` : 'Sin dato'}</Text>
            <Text style={styles.celdaDim}>{f.hacer.promedio ?? 'Sin dato'}</Text>
            <Text style={styles.celdaDim}>{f.deber.promedio ?? 'Sin dato'}</Text>
          </View>
        ))}

        <Text style={styles.nota}>
          Ser y Saber usan escalas distintas (Ser 1-5, Saber % de cumplimiento).
        </Text>
      </Page>
    </Document>
  );
}
