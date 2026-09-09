import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { CertificadoLaboralDocument } from '../pdf-document';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const perfil = await getPerfilActual();
  if (!perfil || perfil.rol !== 'admin_th') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const colaboradorId = req.nextUrl.searchParams.get('colaboradorId');
  const incluirSalario = req.nextUrl.searchParams.get('incluirSalario') === 'true';
  if (!colaboradorId) return NextResponse.json({ error: 'Falta colaboradorId' }, { status: 400 });

  const supabase = createClient();

  const [{ data: colaborador }, { data: empresa }] = await Promise.all([
    supabase
      .from('colaboradores')
      .select(
        'nombre_completo, numero_documento, tipo_contrato, fecha_ingreso, salario, empresa_id, cargo:cargos(nombre)'
      )
      .eq('id', colaboradorId)
      .maybeSingle(),
    supabase
      .from('empresas')
      .select('nombre, nit, direccion, telefono, ciudad, firmante_nombre, firmante_cargo')
      .eq('id', perfil.empresa_id)
      .maybeSingle(),
  ]);

  if (!colaborador || colaborador.empresa_id !== perfil.empresa_id || !empresa) {
    return NextResponse.json({ error: 'Colaborador no encontrado' }, { status: 404 });
  }

  // Esta copia de demostración no tiene un logo propio cargado todavía;
  // el certificado se ve completo igual porque el nombre de la empresa ya
  // se imprime como texto justo debajo (ver pdf-document.tsx).
  const logoPath = path.join(process.cwd(), 'public', 'marca', 'LogoEmpresa.png');
  const logoBase64 = await readFile(logoPath)
    .then((buf) => `data:image/png;base64,${buf.toString('base64')}`)
    .catch(() => undefined);

  const cargo = colaborador.cargo as any;

  const buffer = await renderToBuffer(
    <CertificadoLaboralDocument
      logoBase64={logoBase64}
      fechaEmision={new Date()}
      empresaNombre={empresa.nombre}
      empresaNit={empresa.nit}
      empresaDireccion={empresa.direccion}
      empresaTelefono={empresa.telefono}
      empresaCiudad={empresa.ciudad}
      firmanteNombre={empresa.firmante_nombre}
      firmanteCargo={empresa.firmante_cargo}
      colaboradorNombre={colaborador.nombre_completo}
      colaboradorDocumento={colaborador.numero_documento}
      cargoNombre={cargo?.nombre ?? '—'}
      tipoContrato={colaborador.tipo_contrato}
      fechaIngreso={colaborador.fecha_ingreso}
      salario={colaborador.salario}
      incluirSalario={incluirSalario}
    />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificado-laboral-${colaborador.nombre_completo.replace(/\s+/g, '-').toLowerCase()}.pdf"`,
    },
  });
}
