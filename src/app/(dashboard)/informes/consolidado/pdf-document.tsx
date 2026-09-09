import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { formatearFecha } from '@/lib/utils';
import type { InformeConsolidado } from './data';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: 'Helvetica' },
  titulo: { fontSize: 16, fontWeight: 700, marginBottom: 2, color: '#1B2A5B' },
  subtitulo: { fontSize: 9, color: '#6b7280', marginBottom: 16 },
  seccion: { marginTop: 14 },
  seccionTitulo: { fontSize: 12, fontWeight: 700, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 4 },
  indicadores: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  indicador: { width: '22%', marginBottom: 10 },
  indicadorValor: { fontSize: 14, fontWeight: 700, color: '#1B2A5B' },
  indicadorEtiqueta: { fontSize: 8, color: '#6b7280' },
  fila: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingVertical: 4 },
  filaEncabezado: { backgroundColor: '#f3f4f6', fontWeight: 700 },
  celdaArea: { width: '40%' },
  celdaNumero: { width: '20%' },
  vacio: { color: '#9ca3af' },
});

function Indicador({ etiqueta, valor }: { etiqueta: string; valor: string | number }) {
  return (
    <View style={styles.indicador}>
      <Text style={styles.indicadorValor}>{valor}</Text>
      <Text style={styles.indicadorEtiqueta}>{etiqueta}</Text>
    </View>
  );
}

export function InformeConsolidadoDocument({ informe }: { informe: InformeConsolidado }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.titulo}>Informe Consolidado Gerencial</Text>
        <Text style={styles.subtitulo}>Generado el {formatearFecha(new Date())}</Text>

        <View style={styles.indicadores}>
          <Indicador etiqueta="Colaboradores activos" valor={informe.totalActivos} />
          <Indicador etiqueta="En proceso de salida" valor={informe.enProcesoSalida} />
          <Indicador
            etiqueta="Alineación talento-rol"
            valor={informe.pctAlineacionTalentoRol != null ? `${informe.pctAlineacionTalentoRol}%` : '—'}
          />
          <Indicador etiqueta="Alertas críticas abiertas" valor={informe.alertasCriticas} />
          <Indicador etiqueta="Alertas abiertas (total)" valor={informe.alertasAbiertas} />
          <Indicador etiqueta="Índice de Hacer (promedio)" valor={informe.promedioHacerEmpresa ?? '—'} />
          <Indicador etiqueta="Índice de Deber (promedio)" valor={informe.promedioDeberEmpresa ?? '—'} />
          <Indicador
            etiqueta="Cumplimiento de Saber"
            valor={informe.promedioSaberEmpresa != null ? `${informe.promedioSaberEmpresa}%` : '—'}
          />
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Desempeño por área</Text>
          {informe.porArea.length === 0 ? (
            <Text style={styles.vacio}>Sin áreas con datos todavía.</Text>
          ) : (
            <>
              <View style={[styles.fila, styles.filaEncabezado]}>
                <Text style={styles.celdaArea}>Área</Text>
                <Text style={styles.celdaNumero}>Personas</Text>
                <Text style={styles.celdaNumero}>Hacer (promedio)</Text>
                <Text style={styles.celdaNumero}>Deber (promedio)</Text>
              </View>
              {informe.porArea.map((a) => (
                <View key={a.area} style={styles.fila} wrap={false}>
                  <Text style={styles.celdaArea}>{a.area}</Text>
                  <Text style={styles.celdaNumero}>{a.tamano}</Text>
                  <Text style={styles.celdaNumero}>{a.promedioHacer ?? '—'}</Text>
                  <Text style={styles.celdaNumero}>{a.promedioDeber ?? '—'}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      </Page>
    </Document>
  );
}
