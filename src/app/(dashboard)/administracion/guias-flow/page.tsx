import { redirect } from 'next/navigation';

/** /administracion/guias-flow por sí sola no pinta nada — entra directo a la primera pestaña. */
export default function GuiasFlowPage() {
  redirect('/administracion/guias-flow/invitaciones');
}
