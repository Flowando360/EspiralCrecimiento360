import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { formatearFecha } from '@/lib/utils';
import type { PlanInforme } from './data';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: 'Helvetica' },
  titulo: { fontSize: 16, fontWeight: 700, marginBottom: 2, color: '#1B2A5B' },
  subtitulo: { fontSize: 9, color: '#6b7280', marginBottom: 16 },
  fila: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingVertical: 6 },
  filaEncabezado: { backgroundColor: '#f3f4f6', fontWeight: 700 },
  celdaColaborador: { width: '18%', paddingRight: 4 },
  celdaBrecha: { width: '24%', paddingRight: 4 },
  celdaAccion: { width: '28%', paddingRight: 4 },
  celdaFecha: { width: '12%', paddingRight: 4 },
  celdaEstado: { width: '18%' },
});

export function PdiDocument({ planes, generadoPor }: { planes: PlanInforme[]; generadoPor: string }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.titulo}>Informe de Plan de Desarrollo Individual</Text>
        <Text style={styles.subtitulo}>
          Generado por {generadoPor} el {formatearFecha(new Date())} · {planes.length} registro
          {planes.length === 1 ? '' : 's'}
        </Text>

        <View style={[styles.fila, styles.filaEncabezado]}>
          <Text style={styles.celdaColaborador}>Colaborador</Text>
          <Text style={styles.celdaBrecha}>Brecha detectada</Text>
          <Text style={styles.celdaAccion}>Acción</Text>
          <Text style={styles.celdaFecha}>Compromiso</Text>
          <Text style={styles.celdaEstado}>Estado</Text>
        </View>

        {planes.map((p) => (
          <View key={p.id} style={styles.fila} wrap={false}>
            <Text style={styles.celdaColaborador}>{p.colaborador_nombre}</Text>
            <Text style={styles.celdaBrecha}>{p.brecha_detectada}</Text>
            <Text style={styles.celdaAccion}>{p.accion}</Text>
            <Text style={styles.celdaFecha}>{p.fecha_compromiso ? formatearFecha(p.fecha_compromiso) : '—'}</Text>
            <Text style={styles.celdaEstado}>{p.estado.replace(/_/g, ' ')}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
