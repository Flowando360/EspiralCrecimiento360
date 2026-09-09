import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { formatearFecha } from '@/lib/utils';

const TIPO_CONTRATO_TEXTO: Record<string, string> = {
  indefinido: 'a término indefinido',
  fijo: 'a término fijo',
  obra_labor: 'por obra o labor',
  prestacion_servicios: 'de prestación de servicios',
  aprendizaje: 'de aprendizaje',
  externo: 'externo',
};

function formatearDocumento(numero: string | null): string {
  if (!numero) return '—';
  const soloDigitos = numero.replace(/\D/g, '');
  if (soloDigitos.length !== numero.length) return numero; // no era puramente numérico, se deja tal cual
  return soloDigitos.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatearSalario(salario: number): string {
  return `$ ${Math.round(salario).toLocaleString('es-CO')}`;
}

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: 'Helvetica', color: '#1f2937' },
  logo: { width: 140, marginBottom: 24 },
  fecha: { marginBottom: 24 },
  empresaNombre: { fontSize: 12, fontWeight: 700, textAlign: 'center' },
  empresaNit: { fontSize: 10, textAlign: 'center', marginBottom: 20 },
  certificaQue: { fontSize: 14, fontWeight: 700, textAlign: 'center', marginBottom: 20 },
  parrafo: { lineHeight: 1.6, textAlign: 'justify', marginBottom: 20 },
  negrita: { fontWeight: 700 },
  notaContacto: { fontSize: 9, color: '#6b7280', marginBottom: 60 },
  firmaNombre: { fontWeight: 700, marginTop: 40 },
  firmaCargo: { fontSize: 10 },
  firmaEmpresa: { fontSize: 10 },
  footer: { position: 'absolute', bottom: 32, left: 48, right: 48, fontSize: 8, color: '#9ca3af', textAlign: 'center', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8 },
});

export interface DatosCertificadoLaboral {
  logoBase64?: string;
  fechaEmision: Date;
  empresaNombre: string;
  empresaNit: string | null;
  empresaDireccion: string | null;
  empresaTelefono: string | null;
  empresaCiudad: string | null;
  firmanteNombre: string | null;
  firmanteCargo: string | null;
  colaboradorNombre: string;
  colaboradorDocumento: string | null;
  cargoNombre: string;
  tipoContrato: string;
  fechaIngreso: string;
  salario: number | null;
  incluirSalario: boolean;
}

export function CertificadoLaboralDocument(d: DatosCertificadoLaboral) {
  const ciudad = d.empresaCiudad ?? 'Medellín';
  const tipoContratoTexto = TIPO_CONTRATO_TEXTO[d.tipoContrato] ?? d.tipoContrato;
  const mostrarSalario = d.incluirSalario && d.salario != null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {d.logoBase64 && <Image src={d.logoBase64} style={styles.logo} />}

        <Text style={styles.fecha}>
          {ciudad}, {formatearFecha(d.fechaEmision)}
        </Text>

        <Text style={styles.empresaNombre}>{d.empresaNombre.toUpperCase()}</Text>
        {d.empresaNit && <Text style={styles.empresaNit}>NIT. {d.empresaNit}</Text>}

        <Text style={styles.certificaQue}>CERTIFICA QUE</Text>

        <Text style={styles.parrafo}>
          El/La señor(a) <Text style={styles.negrita}>{d.colaboradorNombre.toUpperCase()}</Text>, identificado(a) con
          CC {formatearDocumento(d.colaboradorDocumento)}, está vinculado(a) a esta empresa en el cargo de{' '}
          <Text style={styles.negrita}>{d.cargoNombre.toUpperCase()}</Text>, mediante un contrato {tipoContratoTexto},
          desde el {formatearFecha(d.fechaIngreso)}
          {mostrarSalario ? `, devengando un salario mensual de ${formatearSalario(d.salario!)}.` : '.'}
        </Text>

        {d.empresaTelefono && (
          <Text style={styles.notaContacto}>
            En caso de información adicional no dude en comunicarse con nosotros al tel. {d.empresaTelefono}
          </Text>
        )}

        {d.firmanteNombre && (
          <View>
            <Text style={styles.firmaNombre}>{d.firmanteNombre}</Text>
            {d.firmanteCargo && <Text style={styles.firmaCargo}>{d.firmanteCargo}</Text>}
            <Text style={styles.firmaEmpresa}>{d.empresaNombre}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          {[d.empresaDireccion, d.empresaTelefono ? `Tel: ${d.empresaTelefono}` : null, ciudad ? `${ciudad} – Colombia` : null]
            .filter(Boolean)
            .join('  |  ')}
        </Text>
      </Page>
    </Document>
  );
}
