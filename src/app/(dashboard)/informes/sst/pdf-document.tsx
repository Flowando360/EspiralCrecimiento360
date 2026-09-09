import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { formatearFecha } from '@/lib/utils';
import type { InformeSST, EstadoCertificacion } from './data';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: 'Helvetica' },
  titulo: { fontSize: 16, fontWeight: 700, marginBottom: 2, color: '#1B2A5B' },
  subtitulo: { fontSize: 9, color: '#6b7280', marginBottom: 16 },
  seccion: { marginTop: 14 },
  seccionTitulo: { fontSize: 12, fontWeight: 700, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 4 },
  fila: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingVertical: 4 },
  filaEncabezado: { backgroundColor: '#f3f4f6', fontWeight: 700 },
  celdaColaborador: { width: '22%' },
  celdaTitulo: { width: '28%' },
  celdaFecha: { width: '16%' },
  celdaVerificado: { width: '14%' },
  celdaEstado: { width: '20%' },
  celdaCargo: { width: '18%' },
  celdaTipo: { width: '14%' },
  celdaRequisito: { width: '28%' },
  vacio: { color: '#9ca3af' },
});

const ETIQUETA_ESTADO: Record<EstadoCertificacion, string> = {
  vigente: 'Vigente',
  por_vencer: 'Por vencer',
  vencido: 'Vencido',
  sin_vencimiento: 'Sin vencimiento',
};

export function InformeSSTDocument({ informe }: { informe: InformeSST }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.titulo}>Informe de cumplimiento SST</Text>
        <Text style={styles.subtitulo}>Generado el {formatearFecha(new Date())}</Text>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Certificaciones</Text>
          {informe.certificaciones.length === 0 ? (
            <Text style={styles.vacio}>Sin certificaciones registradas.</Text>
          ) : (
            <>
              <View style={[styles.fila, styles.filaEncabezado]}>
                <Text style={styles.celdaColaborador}>Colaborador</Text>
                <Text style={styles.celdaTitulo}>Certificación</Text>
                <Text style={styles.celdaFecha}>Vencimiento</Text>
                <Text style={styles.celdaVerificado}>Verificado</Text>
                <Text style={styles.celdaEstado}>Estado</Text>
              </View>
              {informe.certificaciones.map((c) => (
                <View key={c.id} style={styles.fila} wrap={false}>
                  <Text style={styles.celdaColaborador}>{c.colaborador_nombre}</Text>
                  <Text style={styles.celdaTitulo}>{c.titulo}</Text>
                  <Text style={styles.celdaFecha}>{c.fecha_vencimiento ? formatearFecha(c.fecha_vencimiento) : '—'}</Text>
                  <Text style={styles.celdaVerificado}>{c.verificado ? 'Sí' : 'No'}</Text>
                  <Text style={styles.celdaEstado}>{ETIQUETA_ESTADO[c.estado]}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Alertas SST abiertas</Text>
          {informe.alertas.length === 0 ? (
            <Text style={styles.vacio}>Sin alertas SST abiertas.</Text>
          ) : (
            informe.alertas.map((a) => (
              <View key={a.id} style={styles.fila} wrap={false}>
                <Text style={styles.celdaColaborador}>{a.colaborador_nombre}</Text>
                <Text style={styles.celdaTitulo}>{a.titulo}</Text>
                <Text style={styles.celdaFecha}>{formatearFecha(a.fecha_objetivo)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Exámenes médicos y EPP exigidos por cargo</Text>
          <Text style={[styles.vacio, { marginBottom: 6 }]}>
            Sin pantalla de captura todavía: el estado siempre aparece como "Sin dato registrado".
          </Text>
          {informe.requisitosSinDato.length === 0 ? (
            <Text style={styles.vacio}>Sin requisitos SST definidos por cargo.</Text>
          ) : (
            <>
              <View style={[styles.fila, styles.filaEncabezado]}>
                <Text style={styles.celdaColaborador}>Colaborador</Text>
                <Text style={styles.celdaCargo}>Cargo</Text>
                <Text style={styles.celdaTipo}>Tipo</Text>
                <Text style={styles.celdaRequisito}>Requisito</Text>
                <Text style={styles.celdaEstado}>Estado</Text>
              </View>
              {informe.requisitosSinDato.map((r, i) => (
                <View key={i} style={styles.fila} wrap={false}>
                  <Text style={styles.celdaColaborador}>{r.colaborador_nombre}</Text>
                  <Text style={styles.celdaCargo}>{r.cargo_nombre}</Text>
                  <Text style={styles.celdaTipo}>{r.tipo}</Text>
                  <Text style={styles.celdaRequisito}>
                    {r.requisito}
                    {r.detalle ? ` (${r.detalle})` : ''}
                  </Text>
                  <Text style={styles.celdaEstado}>Sin dato registrado</Text>
                </View>
              ))}
            </>
          )}
        </View>
      </Page>
    </Document>
  );
}
