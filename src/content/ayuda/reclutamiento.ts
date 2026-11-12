import type { ModuloAyuda } from '@/types/ayuda';

export const moduloReclutamiento: ModuloAyuda = {
  slug: 'reclutamiento',
  titulo: 'Reclutamiento y Selección',
  descripcion:
    'Vacantes, formulario público de postulación con autorización de datos, tablero de selección por etapas con evaluación del líder, entrevistas, referencias, contratación y un banco de candidatos que conserva todo el histórico.',
  paginas: [
    {
      slug: 'index',
      ruta: '/reclutamiento',
      titulo: 'Reclutamiento y Selección',
      resumen:
        'Listado de las vacantes de la empresa, con su estado y cuántos candidatos tiene cada una. Si eres líder, aquí también ves los candidatos que Talento Humano te envió para evaluar.',
      camposYBotones: [
        { nombre: 'Tarjeta de vacante', explicacion: 'Título, cargo vinculado, líder solicitante, fecha de apertura (y de cierre si ya cerró), número de candidatos y estado (Abierta, En pausa, Cancelada o Cubierto).' },
        { nombre: 'Banco de candidatos', explicacion: 'Lleva al listado de todas las personas que se han postulado alguna vez, sin importar a qué vacante.' },
        { nombre: 'Nueva vacante (admin_th)', explicacion: 'Abre el formulario para crear una vacante nueva, vinculada a un cargo ya existente.' },
        { nombre: 'Candidatos para evaluar (líder)', explicacion: 'Solo aparece para líderes con candidatos asignados. Cada tarjeta trae un cuadro para escribir tus apreciaciones (experiencia, competencias, recomendación) y el botón "Devolver a Talento Humano".' },
      ],
      proceso: [
        'Si eres líder y Talento Humano te envió un candidato, te llega un aviso en Notificaciones (la campana).',
        'Entra a Reclutamiento y selección, busca "Candidatos para evaluar" y escribe tus apreciaciones.',
        'Pulsa "Devolver a Talento Humano". Solo puedes ver al candidato durante los días que Talento Humano definió.',
      ],
      notas: [
        'Pueden ver esta pantalla: admin_th y líder. Crear vacantes es exclusivo de admin_th.',
        'Si no eres admin_th ni líder, al abrir esta pantalla el aplicativo te lleva a Inicio.',
      ],
    },
    {
      slug: 'nueva-vacante',
      ruta: '/reclutamiento/vacantes/nueva',
      titulo: 'Nueva vacante',
      proceso: [
        'Entra a Reclutamiento y selección → "Nueva vacante".',
        'Elige el cargo (el perfil creado en Administración → Cargos y perfiles).',
        'Escribe el título de la vacante (puede ser distinto al nombre del cargo) y elige el líder solicitante, si aplica.',
        'Pulsa "Crear vacante". Quedas dentro de la vacante, con su tablero y su enlace público de postulación.',
      ],
      resumen:
        'Formulario para abrir una vacante. Se vincula a un cargo ya creado, así el formulario público toma el título y la información del cargo automáticamente.',
      camposYBotones: [
        { nombre: 'Cargo', explicacion: 'El cargo al que pertenece la vacante. Si todavía no hay ninguno, créalo antes en Administración → Cargos y perfiles → "+ Nuevo cargo".' },
        { nombre: 'Título de la vacante', explicacion: 'Puede ser distinto al nombre del cargo (ej. "Auxiliar de logística — turno mañana").' },
        { nombre: 'Líder solicitante', explicacion: 'Opcional: quién pidió abrir la vacante.' },
        { nombre: 'Presupuesto salarial', explicacion: 'Opcional. Solo es visible internamente; nunca se muestra en el formulario público.' },
        { nombre: 'Modalidad, ciudad, horario y tipo de contrato', explicacion: 'Opcionales. Aparecen en el formulario público y en la imagen para redes, para que quien la vea decida si le conviene postularse.' },
        { nombre: 'Redactar desde el perfil del cargo', explicacion: 'Arma un borrador de la descripción y de los requisitos con lo que ya tiene el cargo (objetivo, funciones, habilidades, formación y experiencia). Sin IA, con reglas claras. Reemplaza lo que hayas escrito (te pregunta antes).' },
        { nombre: 'Redactar con IA', explicacion: 'Igual, pero la IA redacta mejor el borrador. Usa solo lo que está en el perfil del cargo y en los datos que escribiste: no inventa salario, beneficios, horarios ni requisitos. Si no responde, queda el borrador automático. Siempre puedes editarlo antes de publicar.' },
        { nombre: 'Descripción, requisitos y beneficios', explicacion: 'Textos de la oferta. Aparecen en el formulario público. Los beneficios los escribes tú: ni la IA ni el sistema los inventan. El presupuesto salarial sigue siendo interno.' },
      ],
      notas: ['Exclusivo de admin_th.'],
    },
    {
      slug: 'detalle-vacante',
      ruta: '/reclutamiento/vacantes/*',
      titulo: 'Detalle de una vacante — tablero de postulaciones',
      resumen:
        'El proceso de selección de una vacante: un tablero con los candidatos moviéndose por etapas, desde que se postulan hasta que se contratan o se descartan, con la evaluación del líder, entrevistas y referencias.',
      camposYBotones: [
        { nombre: 'Enlace público de postulación (admin_th)', explicacion: 'Un enlace (/postular/…) que puedes copiar y compartir por redes, WhatsApp o correo. Cualquiera puede postularse sin cuenta. Deja de recibir postulaciones apenas la vacante deja de estar "Abierta".' },
        { nombre: 'Difusión de la vacante (admin_th, vacante abierta)', explicacion: 'Botones para descargar el código QR del formulario público (PNG o SVG para imprimir) y una imagen lista para redes con la marca de tu empresa (logo y color de Administración → Datos de la empresa), el título, los datos de la oferta, los requisitos principales y el QR: cuadrada para Instagram, Facebook y LinkedIn, y vertical para historias y WhatsApp. Completa antes modalidad, ciudad, horario y requisitos para que quede útil.' },
        { nombre: 'Editar vacante / Cambiar estado (admin_th)', explicacion: 'Edita los datos o cambia el estado: Abierta, En pausa, Cancelada o Cubierto. Al cubrirla o cancelarla se guarda la fecha de cierre.' },
        {
          nombre: 'Tablero de 7 columnas',
          explicacion:
            'Postulados → Filtrados/Preseleccionados → En evaluación del líder → Devueltos por el líder → En entrevista → En pruebas → Oferta. Arrastra la tarjeta o usa el selector "Mover a…" que trae cada una (útil en celular y cuando el tablero no cabe en la pantalla). "Contratado" y "Descartado" no son columnas: son botones de la tarjeta, y esos candidatos quedan en la lista "Contratados y descartados" debajo del tablero.',
        },
        { nombre: 'Ya participó antes', explicacion: 'Recuadro amarillo en la tarjeta cuando la persona ya estuvo en otro proceso. Muestra el resultado y el motivo del último descarte, y "Ver histórico" abre su ficha con todos sus procesos.' },
        { nombre: 'Agregar candidato (admin_th)', explicacion: 'Postula a esta vacante a alguien que ya está en el banco, o registra uno nuevo. Si la persona ya existe (mismo documento o correo), se reutiliza su registro y no se duplica.' },
        { nombre: 'Calificación por estrellas', explicacion: 'Calificación rápida de cada candidato, visible en su tarjeta, para compararlos entre sí.' },
        { nombre: 'Evaluación por el líder (admin_th)', explicacion: 'Debajo del tablero: elige un líder evaluador, por cuántos días podrá ver al candidato y pulsa "Enviar al líder". Solo aparecen líderes que tienen usuario con rol Líder vinculado a su ficha.' },
        { nombre: 'Apreciaciones del líder', explicacion: 'Cuando el líder devuelve al candidato, el texto que escribió aparece en su tarjeta, que pasa a "Devueltos por el líder". Desde ahí puedes volver a enviarlo.' },
        { nombre: 'Agendar entrevista', explicacion: 'Disponible cuando el candidato está en "En entrevista": entrevistador, fecha y hora y modalidad (presencial, virtual o telefónica). Se marca Programada, Realizada o Cancelada.' },
        { nombre: 'Contratar', explicacion: 'Marca al candidato como Contratado y muestra el enlace "Contratado — crear colaborador". Ese enlace abre el alta con nombre, correo, teléfono, documento y cargo ya llenos, y pasa su hoja de vida a los documentos del colaborador.' },
        { nombre: 'Descartar', explicacion: 'Marca al candidato como Descartado, con un motivo opcional de texto libre. El motivo queda guardado en su histórico.' },
      ],
      proceso: [
        'Comparte el enlace público y espera las postulaciones, que llegan a "Postulados".',
        'Revisa, califica con estrellas y pasa a "Filtrados" a quienes avanzan.',
        'Si quieres la opinión del líder del área, usa "Evaluación por el líder": elige al líder y pulsa "Enviar al líder". El candidato pasa solo a "En evaluación del líder".',
        'Cuando el líder devuelve su evaluación, lee sus apreciaciones y continúa: entrevista, pruebas y oferta.',
        'Pulsa "Contratar" o "Descartar" (con motivo) y, si contratas, sigue el enlace para crear al colaborador.',
        'Cambia el estado de la vacante a "Cubierto".',
      ],
      notas: [
        'Pueden ver este tablero: admin_th y líder (el líder solo ve a los candidatos que le asignaron, durante el plazo definido). Mover tarjetas, calificar, enviar al líder, contratar y descartar es exclusivo de admin_th.',
        'A "En evaluación del líder" solo se llega con "Enviar al líder": así el candidato queda asignado y el líder recibe su aviso. Arrastrar una tarjeta directamente a esa columna no está permitido.',
      ],
    },
    {
      slug: 'postulacion-publica',
      ruta: '/postular/*',
      titulo: 'Formulario público de postulación',
      resumen:
        'Pantalla pública, fuera de la plataforma (no requiere cuenta ni inicio de sesión), a la que llega cualquier persona desde el enlace que se comparte en el detalle de una vacante. Funciona bien desde el celular.',
      camposYBotones: [
        { nombre: 'Nombre completo (obligatorio)', explicacion: 'Único dato personal requerido.' },
        { nombre: 'Documento, teléfono, correo, LinkedIn', explicacion: 'Opcionales. El documento y el correo sirven para reconocer a la persona si se postula otra vez.' },
        { nombre: 'Hoja de vida', explicacion: 'Adjunta el archivo (PDF o Word, máximo 8 MB). Opcional, pero recomendable.' },
        { nombre: 'Autorización de tratamiento de datos (obligatoria)', explicacion: 'La persona debe aceptarla para poder enviar. Queda registrada como evidencia (Ley 1581 de 2012), junto con la versión de la política.' },
        { nombre: 'Autorización del banco de talento (opcional)', explicacion: 'Si la acepta, sus datos se conservan 12 meses para futuras vacantes; si no, 6 meses.' },
        { nombre: 'Enlace para ejercer sus derechos', explicacion: 'Lleva al formulario donde puede pedir conocer, corregir, revocar o suprimir sus datos.' },
      ],
      notas: [
        'Si la vacante ya no está "Abierta" (cubierta, cancelada o en pausa), la pantalla lo dice y no deja enviar. Esto se comprueba cada vez que alguien abre el enlace.',
        'Si la persona ya existe en el banco (mismo documento o mismo correo, sin importar mayúsculas), se reutiliza su registro: se le suma el proceso nuevo y no se duplica. Si reenvía el formulario para la misma vacante, el aplicativo le avisa "Ya tenemos tu postulación para esta vacante".',
        'Nunca se acorta el plazo de conservación de una persona: si ya había autorizado el banco, se mantiene.',
      ],
    },
    {
      slug: 'derechos-titular',
      ruta: '/ejercer-derechos',
      titulo: 'Ejercer derechos sobre los datos',
      resumen:
        'Formulario público donde un candidato pide conocer qué datos tienen de él, corregirlos, revocar su autorización o pedir que se supriman.',
      camposYBotones: [
        { nombre: '¿Qué quieres hacer?', explicacion: 'Consultar, corregir, revocar la autorización o suprimir los datos.' },
        { nombre: 'Nombre, documento y correo', explicacion: 'Para identificar a la persona y responderle.' },
        { nombre: 'Detalle de la solicitud', explicacion: 'Obligatorio, mínimo 10 caracteres.' },
      ],
      notas: [
        'La solicitud llega al Banco de candidatos, en "Solicitudes de titulares de datos". Talento Humano la responde y la marca como atendida.',
        'Marcar la solicitud como atendida solo registra tu respuesta. Suprimir los datos es una decisión manual de Talento Humano: el aplicativo nunca borra nada por su cuenta.',
      ],
    },
    {
      slug: 'candidatos',
      ruta: '/reclutamiento/candidatos',
      titulo: 'Banco de candidatos',
      resumen:
        'Todas las personas que se han postulado (por el formulario público) o se han registrado manualmente, sin importar a cuántas vacantes hayan aplicado. Es el histórico de candidatos de la empresa: nada se borra solo.',
      camposYBotones: [
        { nombre: 'Fila de candidato', explicacion: 'Nombre, datos de contacto, cuántas postulaciones tiene y su origen (Formulario público o Manual). Clic para abrir su ficha.' },
        { nombre: 'Solicitudes de titulares de datos', explicacion: 'Pedidos de consulta, corrección, revocatoria o supresión que llegaron por el formulario público. Cada una tiene el botón "Marcar atendida".' },
        { nombre: 'Disponibilidad para otros cargos', explicacion: 'Marca a quienes autorizaron el banco de talento y siguen disponibles para otra vacante. Incluye la fecha desde la cual conviene revisar la conservación de sus datos.' },
      ],
      notas: [
        'Pueden ver esta pantalla: admin_th y líder.',
        'La columna "Revisar conservación desde" es una fecha de revisión, no de borrado: ningún dato se elimina automáticamente.',
      ],
    },
    {
      slug: 'ficha-candidato',
      ruta: '/reclutamiento/candidatos/*',
      titulo: 'Ficha de un candidato',
      resumen:
        'Hoja de vida, datos de contacto, histórico de todos sus procesos de selección y verificación de referencias.',
      camposYBotones: [
        { nombre: 'Hoja de vida', explicacion: 'Ver o descargar el archivo cargado, o subir uno nuevo (admin_th).' },
        { nombre: 'Editar candidato (admin_th)', explicacion: 'Nombre, correo, teléfono, LinkedIn y notas internas.' },
        { nombre: 'Histórico de procesos de selección', explicacion: 'Una tarjeta por cada vacante a la que se postuló: fecha de postulación, etapa final, calificación, motivo del descarte, apreciación del líder y notas. Clic en el título lleva al tablero de esa vacante.' },
        { nombre: 'Verificación de referencias (admin_th)', explicacion: 'Agrega referencias (nombre, relación, teléfono) y márcalas "Verificada" cuando las confirmes fuera de la plataforma (llamada, correo, etc.).' },
      ],
      notas: [
        'Pueden ver esta ficha: admin_th y líder. Editar, subir la hoja de vida y administrar referencias es exclusivo de admin_th.',
        'Si la persona se vuelve a postular, sus procesos nuevos se suman aquí: no se crea otra ficha.',
      ],
    },
  ],
};
