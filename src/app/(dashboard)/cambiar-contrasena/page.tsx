import { CambiarContrasenaForm } from '@/components/espiral-crecimiento/cambiar-contrasena-form';

export default function CambiarContrasenaPage() {
  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Cambiar mi contraseña</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Escribe la contraseña con la que entraste y luego la nueva que quieres usar de ahora en adelante.
        </p>
      </div>
      <CambiarContrasenaForm />
    </div>
  );
}
