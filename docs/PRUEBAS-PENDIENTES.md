# Pruebas exhaustivas — estado y pendientes

Reglas: se prueba solo en **CONVERGIA**; todo registro de prueba lleva el prefijo **PRU**; Mármoles recibirá datos reales después de comprobar que todo está OK.

## Módulos
| Módulo | Estado |
|---|---|
| Espiral 360° (ficha, hoja de vida, Saber, Ser, ciclos, evaluaciones, PDI, organigrama, indicadores) | Probado y corregido (publicado en `main`) |
| Reclutamiento | Probado y corregido (publicado en `main`) |
| Nexa, Procesos y Cumplimiento, Informes, Administración, Dotación, Proveedor | Pendiente |

## Decisiones tuyas pendientes (dejar así por ahora)
1. **Registros PRU** creados en CONVERGIA (siguen en la base): cargo "PRU Analista de Nómina", colaboradores "PRU Laura Gómez", "PRU Líder Área Administrativa" y "PRU Carlos Pérez" (inactivo), ciclo "PRU 2026 - Semestre 2", PDI, historial, incapacidad y fecha especial de Laura. Usuarios de acceso: pru.admin, pru.lider, pru.colaborador, pru.gerencia, pru.auditor, pru.proveedor (contraseña de pruebas en la sesión). Mientras existan, la autoevaluación de Laura (notas altas) cuenta en los indicadores de CONVERGIA.
2. **Texto de Mármoles dentro de CONVERGIA:** 2 puntos de inducción (`induccion_items`) mencionan "piedra natural".
3. **Habilidades duplicadas:** el cargo no impide repetir una habilidad con el mismo nombre (mejora opcional).
4. **Migración 0107** (índice único de `respuestas_evaluacion`): ya aplicada en Supabase.

## Registros PRU adicionales (Reclutamiento)
Vacantes "PRU Analista de Nómina — convocatoria" (cubierta), "… segunda convocatoria" y "… tercera convocatoria"; candidata "PRU Rosa Rechazada" (descartada y luego repostulada), candidatos "PRU Ana Candidata" y "PRU Pedro Candidato" (ambos contratados y ya creados como colaboradores), entrevista, referencia "PRU Jefe Anterior" y una solicitud de supresión de datos (marcada atendida).

## Decisión tomada (Reclutamiento)
- **Supresión de datos del titular:** sigue siendo un paso **manual de TH**; "Marcar atendida" solo registra la respuesta.
- **Histórico de candidatos:** se conserva siempre. Una persona rechazada puede volver a postularse: el sistema la reconoce por documento o correo (sin duplicarla), muestra «Ya participó antes» en el tablero y deja todos sus procesos, motivos de descarte y apreciaciones del líder en su ficha. Nada se borra solo.

## Hallazgos corregidos en Reclutamiento
- Evaluadores: solo líderes con usuario de acceso (antes se ofrecía a cualquiera, que luego no veía al candidato).
- Aviso dentro del aplicativo al líder cuando se le envía un candidato.
- Selector "Mover a…" en cada tarjeta (el arrastre fallaba entre 7 columnas y en celular); no se puede pasar a "En evaluación del líder" sin asignar líder.
- Contratación: el alta del colaborador trae el documento y la hoja de vida del candidato.
- Enlace público: ya no queda en caché cuando la vacante se cubre o se cierra.
- Roles sin permiso vuelven al inicio en vez de ver una pantalla en blanco.

## Hallazgos corregidos en Espiral 360°
- Crear cargo desde cero; manual de funciones visible en la ficha.
- Guardado de evaluaciones (índice parcial) y aviso de errores.
- Índices/semáforo/brecha leídos como objeto (salían "Sin datos").
- Checklist de Saber generado desde cargo + hoja de vida.
- PDI manual con brechas sugeridas.
- Ingreso en historial e inducción asignada al dar de alta; la colaboradora ve a su líder.

## Cómo se prueba (para repetirlo)
Servidor local con puente a Supabase (el proxy de la nube no deja salir al servidor Next), Playwright con usuarios PRU por rol. Variables de entorno de Supabase configuradas en el entorno de la sesión.

## Migración Círculo → Espiral (Mármoles y Servicios)
- **Hecho (2026-11-01):** carga de Mármoles (43 colaboradores, 41 cargos, 26 competencias, 2 ciclos, 102 alertas, 41 perfiles) y de la Guía del Flow (75 perfiles, 37 cuestionarios, 30 resultados, 60 documentos, 66 archivos). CONVERGIA verificada sin cambios; aislamiento entre empresas comprobado; 68 pantallas recorridas como administrador de Mármoles sin errores.
- **Cuentas:** las 41 personas de Mármoles reutilizaron su cuenta (conservan contraseña); 33 cuentas nuevas de la Guía del Flow con contraseña aleatoria (deben usar "olvidé mi contraseña"); usuario de Diana en Mármoles: `diana.said.mys`.
- **Pendiente:** (1) habilitar `api.vercel.com` y guardar `VERCEL_TOKEN`; (2) en Supabase de Espiral, Authentication → URL Configuration: agregar `https://guia-del-flow.vercel.app`; (3) apuntar el proyecto GuiaDelFlow de Vercel a Espiral y prueba punta a punta con una invitación PRU; (4) copia final (delta) justo antes del cambio; (5) solo entonces borrar Círculo.
- **Nota:** el origen no tenía respuestas de evaluación (Hacer/Deber en blanco para Mármoles); el Ser sí migró completo.

## Estado de producción (2026-11-01, tarde)
- La Guía del Flow ya escribe en la base de Espiral (despliegue nuevo). El secreto compartido `GUIA_FLOW_PANEL_SECRET` se rotó en ambos proyectos y `NEXT_PUBLIC_SITE_URL` de la Guía quedó en `https://guia-del-flow.vercel.app`.
- `ANTHROPIC_API_KEY` configurada en Espiral (Vercel); el asistente de Nexa responde en producción. Límite de gasto en Anthropic: US$ 20.
- Correo de Supabase Auth por Resend (smtp.resend.com, remitente notificaciones@flowando.com): prueba de "restablecer contraseña" con un gmail externo OK.
- Rollback disponible: Espiral `dpl_FiuPqXUgcLxSe8GcoJy32zN6JJ5K`, Guía del Flow `dpl_8ptzUa6rWSzZXVjN99vc3CSw1eHc`. Círculo sigue desplegado y NO se ha tocado.
- Pendiente: límite de 60 s al generar Guía + Carta; prueba limpia de invitación; módulos sin probar (Nexa, Procesos, Informes, Administración, Dotación, Proveedor, auditor externo, cron); desactivar cuentas PRU antes de gente real; apagar Círculo (respaldo final antes); plan Pro de Supabase y Vercel.

## Actualización (2026-11-01, noche)
- **Manual en línea** (`src/content/ayuda/`) actualizado: Reclutamiento reescrito; páginas nuevas (resultado de evaluación, nuevo cargo, editar cargo, derechos del titular); preguntas frecuentes y glosario ampliados. **Guía pública del líder de TH** en `/guia-lider-th` (archivos en `public/guia-lider-th/`), con tarjeta en el Centro de Ayuda.
- **Usuario de pruebas para una persona de Talento Humano** (Luisa) en CONVERGIA, rol `admin_th`, usuario `luisa`. Su correo es provisional y debe cambiarse por el real en Administración → Usuarios y roles. En CONVERGIA no hace falta el prefijo PRU para personas.
- **Correo de Supabase Auth por Resend** configurado y probado con un correo externo.
- **Siguiente módulo a probar: Nexa**, luego Procesos y Cumplimiento, Informes, Administración, Dotación, Proveedor, auditor externo y cron. Trabajar con un tope de costo que fije Diana (leer `cost_usd` con `get_session`).
- **Memoria del proyecto:** `CLAUDE.md` en la raíz resume reglas, arquitectura y estado; se carga sola en cada sesión (nube o PowerShell).

## Actualización (2026-11-04)
- **Generar Encuentros de Crecimiento:** ahora muestra aviso de espera con indicador animado; el servidor lee el catálogo una sola vez y guarda ítems/tareas por lotes (mucho más rápido, tope de 60 s declarado). En «Un colaborador» hay un filtro previo por líder que reduce la lista a su equipo; en «Un equipo» se muestra cuántas personas lo componen.
- **CONVERGIA:** las 39 cuentas ligadas a colaboradores recibieron una clave inicial común (se la dio Diana por el chat; no se guarda aquí). Quedaron sin tocar 10 cuentas que no son colaboradores (p. ej. proveedor, auditores).
- **Cambiar mi contraseña** (`/cambiar-contrasena`, icono de llave en la barra superior, para todo usuario): pide la actual, valida y guarda la nueva. Probado con Playwright (actual incorrecta, no coinciden, éxito). Falta decidir si se obliga el cambio en el primer ingreso.
- **Colaboradores:** filtros por nombre, por cargo y «Solo líderes de área» (cargo con personal a cargo o alguien lo tiene como líder), con etiqueta «Líder de área». Probado como administrador de CONVERGIA.
- Nota: las cuentas `pru.*` no están ligadas a colaboradores, por eso NO recibieron la clave inicial común.

## Actualización (2026-11-04, valoración con borrador y envío)
- La pantalla de valoración tiene «Guardar avance» y «Enviar valoración» en la barra fija de arriba. Mientras no se envía se puede cambiar; enviada queda en solo lectura (candado también en la base). Los resultados solo cuentan valoraciones enviadas.
- **Requiere aplicar `supabase/migrations/0109_valoracion_borrador_y_envio.sql` en Supabase (SQL Editor)** ANTES de fusionar a `main`: sin ella el disparador antiguo marca la valoración como enviada al responder el último ítem.
- Las valoraciones que ya estaban completas antes del cambio quedan como enviadas (bloqueadas).
- La clave inicial no se obliga a cambiar: cada quien la cambia cuando quiera.

## Actualización (2026-11-04, búsqueda y filtros)
- Valoración con borrador/envío: migración 0109 aplicada por Diana; probado con Playwright en CONVERGIA (guardar, recargar, enviar, solo lectura, candado en la base); valoración de prueba devuelta a pendiente.
- Búsqueda y filtros nuevos: Usuarios (texto, rol, estado, ficha), Roles (roles y módulos), Banco de candidatos, y un componente reutilizable `FiltroTabla` (`src/components/ui/filtro-tabla.tsx`) aplicado a Cargos, Organigrama, Dimensiones, Informes PDI/Formación/SST/Cultura, Nexa Directorio/Formación, Seguimiento de Guías del Flow, Sincronizaciones y detalle de ciclo.
- Para agregar el filtro a otra tabla servida desde el servidor: envolverla en `<FiltroTabla columnas={['Estado']}>`; los nombres deben coincidir con los `<th>`.

## Actualización (2026-11-04, documentación)
- **Manual en línea** (`src/content/ayuda/`): páginas nuevas en «Inicio y Mi Perfil» (Mapa del menú con todas las opciones, ¿Dónde hago…?, Cómo evalúa un líder paso a paso, Cómo se combinan varias valoraciones), detalle de ciclo (generar, equipo, ya generados, aviso de espera), valoración con borrador/envío, ficha (Editar y que NO deja historial), Usuarios (vincular ficha), preguntas frecuentes y glosario ampliados.
- **Guía pública** `/guia-lider-th`: pasos 5-2/5-3 ampliados, paso nuevo 5-7 (varias valoraciones), capítulos nuevos 9 «Todas las opciones del menú» y 10 «¿Dónde hago…?», y 8 preguntas frecuentes nuevas.
- Corregido: la página «Buscar y filtrar» del manual tapaba la ayuda contextual de Colaboradores (las páginas informativas ahora usan rutas `/ayuda-general/...`, que no existen en la app).
- **Pendiente decidido por Diana:** que «Editar» colaborador deje registro automático en el Historial (cambio de cargo/líder/salario). Propuesto, sin hacer.
- Al agregar menús o pantallas nuevas, actualizar también el capítulo 9 de la guía y la página «Mapa del menú» del manual.

## Actualización (2026-11-04, inducción con Mármoles: organigrama, ciclos e histórico)
- **Círculo de Crecimiento DESACTIVADO** (no borrado): proyecto `circulo-crecimiento` en Vercel pausado (responde 503). Su Supabase sigue activo con los datos. Reactivar: Vercel → proyecto → Settings → Resume Service. Se borra solo cuando Diana lo confirme y tras un último respaldo.
- **Causa raíz de «no aparece en el organigrama» (Dilson y los nuevos):** el formulario crea a todos en «período de prueba» y las pantallas/vistas solo contaban `activo`. Ahora «vigente» = activo + período de prueba (`src/lib/colaboradores/estados.ts`) en organigrama (ambos), detalle de ciclo y generación de encuentros; migración 0110 hace lo mismo en las vistas `v_organigrama_*`. Quedan aún con filtro solo `activo` (a propósito, son métricas): informes, dotación y selectores de Procesos.
- **Borrar ciclos** (admin_th): «Eliminar ciclo» en la tarjeta y en el detalle; avisa cuántas evaluaciones se pierden y exige escribir ELIMINAR. Los PDI y verificaciones del Saber se desvinculan, no se borran.
- **Equipo a cargo de un líder:** Administración → Organigrama ahora tiene «Para revisar» (líderes sin equipo, personas sin líder), «Por líder» (marcar su equipo; evita ciclos) y «Por persona». Botón «Equipo a cargo» en la ficha.
- **Nuevo colaborador → organigrama al instante:** líder obligatorio (o casilla «sin líder / nivel 1») y lista opcional «Personas que tendrá a cargo».
- **Regenerar un ciclo** ahora retira las tareas de acompañantes que ya no corresponden (solo las no enviadas y sin respuestas).
- **Eliminar colaborador deja histórico** (`colaboradores_historico`, página `/espiral-crecimiento/colaboradores/historico`). Si la tabla no existe (migración sin aplicar) NO borra nada y lo explica.
- **⚠️ Requiere aplicar `supabase/migrations/0110_organigrama_periodo_prueba_y_historico.sql` en Supabase (SQL Editor) ANTES de fusionar a `main`.** Probado con Playwright en CONVERGIA (datos PRU): ciclos (lista, detalle, con evaluaciones), editor de equipo, alta con líder, organigrama, y el rechazo seguro de eliminar sin la migración. Falta probar el histórico completo y las vistas nuevas después de aplicar la 0110.
- **Decisiones de Diana sobre los pendientes de la reunión (2026-11-04):**
  1. Matriz de permisos por usuario y 2. terceros/freelance: **nada por ahora**.
  3. Cambio de líder (saliente y entrante): **no hacer nada**.
  4. Limitar procesos y simulacros por área: será una **opción adicional**, definida según los roles del líder dentro del SG-SST de la empresa (no por área del organigrama). Sin hacer.
  5. Histórico de colaboradores eliminados con opción de consultarlo: **ya hecho** (Colaboradores → «Histórico de eliminados»); queda por probar tras aplicar la 0110.
  - Sigue propuesto de antes: «Editar» colaborador deja registro automático en el Historial.
  - Alexandra (TH de Mármoles) debe revisar que cada líder tenga su equipo (Dilson Restrepo y los nuevos de producción) y luego abrir el ciclo oct–dic **por equipo** (no «todos») para no dejar vacíos.
- **Lección de pruebas locales:** con `BYPASS_AUTH=true` el servidor no lee cookies y Next cachea las lecturas de Supabase (se ven datos viejos). Para probar, enviar `cache: 'no-store'` en el cliente de ese modo (solo local, no subirlo).

## Actualización (2026-11-04, organigrama 2026 de Mármoles y publicación)
- **Migración 0110 aplicada por Diana** y probada: vistas (una persona en período de prueba ya tiene evaluadores), eliminar colaborador + «Histórico de eliminados» (motivo y trayectoria). Publicado en `main`.
- **Organigrama 2026 actualizado (PowerPoint de Mármoles) aplicado a la base:** líder de Operaciones pasa a tener a su cargo directo a Coordinación Logística, Supervisión de Calidad, Auxiliar de Logística, Operario Integral, Auxiliar de Inventarios y Operario de Montacargas (antes colgaban del coordinador logístico o de nadie); la persona de Operación Internacional pasa a depender de la Dirección de TH. Las demás 27 personas coincidentes ya estaban igual. Copia de los líderes anteriores en el respaldo local de la sesión (no está en el repositorio).
- **Pendiente de decidir con Diana/Alexandra (no se tocó):** (a) el operario logístico e inventarios que sigue bajo el coordinador logístico mientras el cuadro del organigrama está sin nombre (¿vacante o la misma persona?); (b) la persona de Operación Internacional aparece con línea punteada (tercerización) pero figura como colaboradora vinculada: ¿se marca externa?; (c) personas en la base que no salen en el organigrama (2 de servicios generales, 3 operarios/cortadores, 1 operario en período de prueba, 1 inactiva y un registro «PRU» dentro de Mármoles); (d) nombres de cargo distintos al cuadro (asistente vs. auxiliar de producción; operario integral «logística e inventarios» vs. «logística y producción»; «Auxiliar Lógistico»); (e) un operario cuyo nombre en la base parece mal escrito; (f) terceros del cuadro (13 contratistas instaladores, 2 transportadores, asesores informáticos, contables, revisor fiscal y 1 freelance) no son colaboradores: no se crearon.

## Actualización (2026-11-04, módulo Externos)
- **Pedido de Diana:** poder crear y gestionar externos (contratistas, transportadores, asesores, freelance, proveedores): no son empleados, pero deben estar registrados y tener acciones. Diseño elegido: reutilizar `colaboradores` con `es_externo = true` (heredan Documentos y Guía del Flow; ya se excluyen de evaluaciones, indicadores, dotación e inducción en muchos módulos).
- **Qué hay:** Espiral 360° → **Externos** (lista con resumen, filtros y vigencia; alta individual o «varias a la vez» pegando líneas; detalle con documentos, Guía del Flow, seguimiento con calificación 1–5, editar/inactivar, «pasar a colaborador vinculado», eliminar con histórico). Responsable interno = `lider_id`; salen con línea punteada en el organigrama. Alerta `contrato_vencimiento` 30 días antes de `fecha_fin_vinculo`. Los externos no generan alertas de período de prueba ni aniversario.
- **Migración 0111 aplicada por Diana** y módulo probado con Playwright en CONVERGIA (datos PRU, ya limpiados): alta individual, carga masiva (con omitidas), seguimiento con calificación, aviso de vencimiento, lista, organigrama, inactivar, eliminar con histórico y «pasar a colaborador vinculado». Publicado en `main` junto con Gino.
- Hecho: el externo de Mármoles (Operación internacional) quedó con servicio y tipo «otro». Pendiente: registrar los terceros del organigrama 2026 (13 contratistas instaladores, 2 transportadores, freelance) cuando Diana confirme los datos.

## Actualización (2026-11-04, Gino)
- **Gino** es el asistente amigo de la plataforma (ícono robot subido por Diana, `public/marca/gino.png` y `gino-128.png`, recortado en círculo con fondo transparente). Botón flotante abajo a la derecha en todas las pantallas (`src/components/ayuda/gino-ayuda.tsx`, montado en `AppShell`), con saludo por nombre una vez por sesión; reemplaza el botón de ayuda de la barra superior. Su panel muestra la ayuda de la pantalla, busca en el manual, recibe requerimientos y enlaza al chat con IA (`/nexa/asistente`, menú «Gino · Asistente IA», prompt de la API con su voz).
- **Ayuda:** páginas nuevas «Qué es Espiral de Crecimiento 360°» y «Conoce a Gino» (módulo Inicio y Mi Perfil), tarjeta «¿Qué es Espiral?» en el Centro de Ayuda, FAQ y glosario (Gino, Espiral, Externo). **Guía pública del líder de TH:** pasos 0-2 y 0-3, fila del asistente renombrada y 2 preguntas nuevas.
- **Eliminar ciclo** ahora es un botón rojo visible (antes un texto gris que pasaba desapercibido) con una frase de aviso en la cabecera de Ciclos.
- Probado con Playwright en CONVERGIA (escritorio y móvil). La rama también incluye el módulo Externos: **no fusionar a `main` hasta aplicar `0111_externos.sql`**.

- **Igual para toda empresa (pedido de Diana):** Gino, Externos, ciclos y organigrama no tienen nada atado a una empresa (todo por `empresa_id`; el ícono de Gino es de la plataforma y se ve igual en todas; solo su prompt de IA usa el nombre de la empresa). Una empresa nueva los tiene desde el primer día, sin datos de ejemplo.

## Actualización (2026-11-04, Brief que cruza Ser, Saber, Hacer y Deber)
- **Pedido de la reunión:** el Brief debe llenarse con el cruce de Guía del Flow (Ser), hoja de vida y cursos (Saber) y valoración (Hacer y Deber). Antes era 4 cuadros vacíos y manuales.
- **Qué hay:** al abrir el Brief (`/espiral-crecimiento/evaluaciones/[id]/brief`) salen cuatro tarjetas «Lo que dicen los datos» y seis secciones ya escritas (talento central, Ser, Saber, Hacer, Deber, sugerencias). Borrador automático sin costo (`src/lib/brief/contexto.ts` + `borrador.ts`), «Rehacer borrador con los datos» y «Mejorar la redacción con IA» (`src/lib/brief/ia.ts`, usa `ANTHROPIC_API_KEY`, 60 s de tope; si falla deja el automático). Editor `brief-editor.tsx` con cajas que crecen y aviso de cambios sin guardar. El resultado de la evaluación también muestra Ser y Saber del Brief.
- **Privacidad:** del Ser solo los 18 aspectos no sensibles y `informe_lider`; de pares y colaboradores a cargo solo el promedio agrupado; el colaborador evaluado no ve el Brief.
- **Migración 0112 aplicada por Diana** (columnas `resumen_ser`, `resumen_saber`, `fuente_borrador`). Publicado en `main`.
- **Probado** con Playwright en CONVERGIA (evaluación de PRU Laura Gómez): tarjetas, borrador automático con datos reales, «Mejorar con IA» (corregido: la API devuelve un bloque de pensamiento antes del texto). «Guardar» y recargar probados tras la 0112 (las seis secciones persisten; la fuente pasa de automático a manual al editar). Ayuda, glosario, FAQ y guía del líder de TH ya actualizados (paso 5-5).

## Actualización (2026-11-04, acceso de Luisa y bloqueo de rutas por rol personalizado)
- **Pedido de Diana:** el usuario de Luisa (`luisa@convergia.demo`, CONVERGIA) debe ver solo lo del manual de Talento Humano: lo habitual de cualquier usuario, Espiral 360° y Reclutamiento; sin Nexa ni Procesos.
- **Hecho:** rol personalizado «Talento Humano (manual)» en CONVERGIA, asignado a Luisa (sigue siendo `admin_th`). Con lectura/escritura/borrado: Inicio, Mi perfil, Espiral 360°, Reclutamiento, **Informes y Administración** (los cubre la guía del líder de TH y los necesita para organigrama, cargos y usuarios); sin: Nexa, Procesos y Dotaciones. **Decisión mía a confirmar con Diana:** si prefiere quitar también Informes y Administración, se desmarcan en Administración → Roles y permisos.
- **Bloqueo real de rutas:** antes un rol personalizado solo ocultaba el menú. Ahora el middleware (`src/middleware.ts` + `src/lib/permisos/rutas.ts`) redirige a Inicio si la ruta pertenece a un módulo sin lectura. El mapa ruta→módulo sigue al menú (probado contra las 53 entradas). Gino (`/nexa/asistente`), ayuda, alertas, mensajes y cambiar contraseña son libres. Server actions y rutas `/api` no se bloquean por módulo (las protege el rol y RLS).
- **Sin probar con sesión real de Luisa** (no tengo su contraseña): probado el menú con su cuenta en modo local y el mapa de rutas con pruebas automáticas contra su matriz real; falta que Diana entre como Luisa y pruebe abrir `/nexa/feed` o `/procesos-gestion` (debe volver al Inicio).
