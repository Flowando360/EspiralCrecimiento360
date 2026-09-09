import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { formatearFecha } from '@/lib/utils';
import type { FilaHistorico } from './data';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: 'Helvetica' },
  titulo: { fontSize: 16, fontWeight: 700, marginBottom: 2, color: '#1B2A5B' },
  subtitulo: { fontSize: 9, color: '#6b7280', marginBottom: 16 },
  fila: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingVertical: 4 },
  filaEncabezado: { backgroundColor: '#f3f4f6', fontWeight: 700 },
  celdaCiclo: { width: '22%' },
  celdaFecha: { width: '15%' },
  celdaPersonas: { width: '13%' },
  celdaIndice: { width: '12%' },
  celdaTendencia: { width: '13%' },
  vacio: { color: '#9ca3af' },
});

function tendenciaTexto(actual: number | null, anterior: number | null | undefined): string {
  if (actual == null || anterior == null) return '—';
  const diferencia = Math.round((actual - anterior) * 100) / 100;
  if (diferencia > 0) return `+${diferencia}`;
  if (diferencia < 0) return `${diferencia}`;
  return 'sin cambio';
}

export function InformeHistoricoDocument({ filas }: { filas: FilaHistorico[] }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.titulo}>Histórico Comparativo entre Ciclos</Text>
        <Text style={styles.subtitulo}>Generado el {formatearFecha(new Date())}</Text>

        {filas.length === 0 ? (
          <Text style={styles.vacio}>Sin ciclos con resultados todavía.</Text>
        ) : (
          <>
            <View style={[styles.fila, styles.filaEncabezado]}>
              <Text style={styles.celdaCiclo}>Ciclo</Text>
              <Text style={styles.celdaFecha}>Apertura</Text>
              <Text style={styles.celdaPersonas}>Personas</Text>
              <Text style={styles.celdaIndice}>Hacer</Text>
              <Text style={styles.celdaTendencia}>vs. anterior</Text>
              <Text style={styles.celdaIndice}>Deber</Text>
              <Text style={styles.celdaTendencia}>vs. anterior</Text>
            </View>
            {filas.map((f, i) => (
              <View key={f.cicloId} style={styles.fila} wrap={false}>
                <Text style={styles.celdaCiclo}>{f.cicloNombre}</Text>
                <Text style={styles.celdaFecha}>{formatearFecha(f.fechaApertura)}</Text>
                <Text style={styles.celdaPersonas}>{f.personas}</Text>
                <Text style={styles.celdaIndice}>{f.promedioHacer ?? '—'}</Text>
                <Text style={styles.celdaTendencia}>{tendenciaTexto(f.promedioHacer, filas[i - 1]?.promedioHacer)}</Text>
                <Text style={styles.celdaIndice}>{f.promedioDeber ?? '—'}</Text>
                <Text style={styles.celdaTendencia}>{tendenciaTexto(f.promedioDeber, filas[i - 1]?.promedioDeber)}</Text>
              </View>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
}
