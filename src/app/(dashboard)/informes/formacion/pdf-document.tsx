import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { formatearFecha } from '@/lib/utils';
import type { FilaFormacion } from './data';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: 'Helvetica' },
  titulo: { fontSize: 16, fontWeight: 700, marginBottom: 2, color: '#1B2A5B' },
  subtitulo: { fontSize: 9, color: '#6b7280', marginBottom: 16 },
  resumen: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  resumenItem: { fontSize: 9 },
  resumenValor: { fontSize: 14, fontWeight: 700, color: '#1B2A5B' },
  fila: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingVertical: 4 },
  filaEncabezado: { backgroundColor: '#f3f4f6', fontWeight: 700 },
  celdaColaborador: { width: '22%' },
  celdaCurso: { width: '26%' },
  celdaCategoria: { width: '16%' },
  celdaAvance: { width: '12%' },
  celdaFecha: { width: '12%' },
  celdaEstado: { width: '12%' },
  vacio: { color: '#9ca3af' },
});

const CATEGORIA_LABEL: Record<string, string> = {
  induccion_sst: 'Inducción SST',
  alturas: 'Alturas',
  manejo_cargas: 'Manejo de cargas',
  epp: 'EPP',
  protocolos_emergencia: 'Protocolos de emergencia',
  cultura: 'Cultura',
  tecnico: 'Técnico',
  otro: 'Otro',
};

export function InformeFormacionDocument({ filas }: { filas: FilaFormacion[] }) {
  const completados = filas.filter((f) => f.estado === 'completado').length;
  const pctCompletado = filas.length > 0 ? Math.round((completados / filas.length) * 100) : 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.titulo}>Informe de Formación</Text>
        <Text style={styles.subtitulo}>Generado el {formatearFecha(new Date())}</Text>

        <View style={styles.resumen}>
          <View style={styles.resumenItem}>
            <Text style={styles.resumenValor}>{filas.length}</Text>
            <Text>Asignaciones totales</Text>
          </View>
          <View style={styles.resumenItem}>
            <Text style={styles.resumenValor}>{completados}</Text>
            <Text>Completadas</Text>
          </View>
          <View style={styles.resumenItem}>
            <Text style={styles.resumenValor}>{pctCompletado}%</Text>
            <Text>Cumplimiento</Text>
          </View>
        </View>

        {filas.length === 0 ? (
          <Text style={styles.vacio}>Sin cursos asignados.</Text>
        ) : (
          <>
            <View style={[styles.fila, styles.filaEncabezado]}>
              <Text style={styles.celdaColaborador}>Colaborador</Text>
              <Text style={styles.celdaCurso}>Curso</Text>
              <Text style={styles.celdaCategoria}>Categoría</Text>
              <Text style={styles.celdaAvance}>Avance</Text>
              <Text style={styles.celdaFecha}>Límite</Text>
              <Text style={styles.celdaEstado}>Estado</Text>
            </View>
            {filas.map((f) => (
              <View key={f.id} style={styles.fila} wrap={false}>
                <Text style={styles.celdaColaborador}>{f.colaborador_nombre}</Text>
                <Text style={styles.celdaCurso}>{f.curso_titulo}</Text>
                <Text style={styles.celdaCategoria}>{CATEGORIA_LABEL[f.categoria] ?? f.categoria}</Text>
                <Text style={styles.celdaAvance}>{f.progreso_pct}%</Text>
                <Text style={styles.celdaFecha}>{f.fecha_limite ? formatearFecha(f.fecha_limite) : '—'}</Text>
                <Text style={styles.celdaEstado}>{f.estado.replace(/_/g, ' ')}</Text>
              </View>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
}
