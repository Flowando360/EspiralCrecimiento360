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

## Actualización (2026-11-12, Modelo Integral completo y parte del informe de Luisa)
- **Modelo Integral de Gestión y Desarrollo del Talento (las 3 fases) está completo en `main`.** Migraciones aplicadas hasta la **0132**.
  - Fase 1: «No aplica» (0120), índice integral con pesos por nivel y mínimos críticos (0121), evidencias por ítem (0122), reabrir valoración con motivo y auditoría, criterios congelados por ciclo (0123), el Ser sin nota, umbral de anonimato configurable en informes agregados (0124, por defecto 5).
  - Fase 2: Saber con nivel de dominio y mapa dominado/parcial/brecha (0125), seguimiento del Ser (0126), consentimiento de la Guía del Flow (0127; el líder deja de ver el informe si la persona no lo comparte, aplicado en las políticas de la base).
  - Fase 3: objetivos concertados y su cumplimiento (0128), perfil integral con borrador automático o con IA (0129), movilidad interna y potencial subutilizado (sin migración), clientes internos como fuente de evaluación con peso por ciclo (0130), equidad de la valoración (sin migración), sedes (0131).
  - «Alineación talento-rol» se renombró «Con Guía y desempeño sin alerta».
- **Informe de Luisa, hecho hoy:** nombre convencional junto a «Encuentro de Crecimiento», Talento Humano vincula su cuenta a su ficha desde Mi Perfil, botones visibles en las tarjetas de la ficha, redacción de la oferta con o sin IA, campos de la vacante (0132), QR e imagen para redes de cada vacante.
- **Pendiente de probar con Playwright o a mano en CONVERGIA (nada de lo de hoy se vio en navegador):** reabrir valoración, consentimiento de la Guía, perfil integral con IA, Brechas con «Menos de N personas», clientes internos (peso 0 y con peso), objetivos concertados, movilidad interna, sedes, y **la imagen de vacante** (no se pudo previsualizar: `next/og` no corre en pruebas locales).
- **Sigue (plan acordado con Diana):** (1) del informe de Luisa: Clima (filtros por área, líder y sede; dimensiones desagregadas), informe de Cultura con brecha cultural, Revisión por la Dirección (fuente de cada bloque y corregir la eficacia de ACPM), Consolidado y Cuadro histórico con rotación, ausentismo, headcount y gráficas, Inducción, Dotación, Formación y los puntos parciales; (2) pasada final de ayuda y Gino, y agregar las pantallas nuevas al capítulo 9 de la guía pública `/guia-lider-th` y a «Mapa del menú»; (3) evaluar la app completa y decidir por dónde seguir.
- **Decisión a validar con Diana:** mientras una persona no decide sobre su Guía del Flow, su líder la ve (como antes); la alternativa estricta es que no la vea hasta que acepte.
- **Aplazado a propósito:** WhatsApp, ADRES/FOSYGA, ASEC, ERP de nómina, matriz legal generada por IA, avatar/gamificación, canje de puntos, clientes externos con enlace público.

## Actualización (2026-11-12, tarde: informe de Luisa, segunda tanda)
- **Migraciones aplicadas hasta la 0136:** 0133 clima (área, sede y 3 dimensiones nuevas en `clima_respuestas`) · 0134 brecha cultural (4 tablas `cultura_*`) · 0135 inducción (quiz con respuesta oculta en `induccion_item_clave`, confirmación de la persona) · 0136 categorías de cursos ampliadas.
- **Hecho y publicado en `main`:**
  - Clima: detalle por dimensión y por área, líder o sede con anonimato; alfa de Cronbach (`src/lib/clima/segmentos.ts`).
  - Brecha cultural (`/nexa/cultura`, `src/lib/cultura/brecha.ts`): encuesta «ocurre hoy / debería ocurrir» anónima, filtros área, líder y sede.
  - Revisión por la Dirección: fuente y enlace de cada bloque; eficacia de ACPM con denominadores y «cumplimiento global» (la incoherencia era de definición, no de cálculo).
  - Consolidado: indicadores de talento (rotación por causa, ausentismo, selección, headcount con período de prueba) y barras; Histórico: gráfica de línea.
  - Dotación abre desde la ficha en `/espiral-crecimiento/colaboradores/[id]/dotacion` (el rebote al Inicio era el bloqueo de módulo del middleware). Saber compara niveles de formación y distingue «supera el requisito» (`src/lib/saber/formacion.ts`).
  - Inducción: la persona confirma propósito, funciones y riesgos SST; preguntas de comprensión; exámenes de preingreso al inicio.
  - Feed: aviso por correo opcional a toda la empresa (solo admin_th).
  - Alertas por categoría; alerta «Evaluar período de prueba antes de confirmar» en el cron diario; filtros de área y líder en Indicadores; PDI con filtros y lista; Dimensiones con resumen por área y filtro de críticos; descriptores de la escala 1-5; explicación de la Guía del Flow.
  - Formación: categorías nuevas y certificado PDF (`/api/nexa/formacion/[rutaId]/certificado`); recorrido de bienvenida (`tour-bienvenida.tsx`); desempeño por aliado; cadena de evidencias SG-SST en el informe SST.
- **TODO LO ANTERIOR SOLO SE VERIFICÓ CON `tsc` Y PRUEBAS DE LÓGICA PURA; NADA SE VIO EN NAVEGADOR.** Siguiente paso acordado con Diana: prueba exhaustiva con Playwright en CONVERGIA (ella entrega las credenciales; no se pegan en el chat ni en archivos).
- **Riesgos a mirar en la prueba:** la alerta de período de prueba puede crear varias alertas la primera vez en Mármoles (ingresos de los últimos 3 meses); aviso por correo del Feed (tope diario de Resend gratuito); «Ver todas» y botones de catálogo dentro de Dotación abierta desde la ficha siguen pidiendo el módulo Dotaciones.
- **Falta de desarrollo:** inducción convertida en cursos, rutas de aprendizaje encadenadas, video en cursos (4.18.2-4.18.3); módulo de exámenes médicos preingreso/periódicos/egreso (4.10.3); unir Dotación y EPP (4.12); filtros de cargo, antigüedad y ciclo en informes (6.1); organigrama matricial (4.16); jerarquía visual del Inicio (2.1); certificados de selección (4.2, hoy solo viaja la hoja de vida).
- **Decisiones de Diana pendientes:** ¿3 afirmaciones por dimensión de clima (11.1)? · consentimiento de la Guía (líder la ve mientras no decide, o no) · el Ser en movilidad interna · clientes internos externos con enlace · roles de Luisa (Informes y Administración) · dónde guardar su `CLAUDE.local.md`.
- **Pasada final pendiente (obligatoria):** agregar todas las pantallas nuevas al capítulo 9 y 10 de `public/guia-lider-th/index.html` y a «Mapa del menú»; re-correr la auditoría de ayuda y la prueba de Gino.
- Archivo temporal `_t.ts` en la raíz del repo (no versionado): borrarlo.

## Actualización (2026-11-12, noche: punto 3 de desarrollo)
- **Migraciones aplicadas hasta la 0138:** 0137 (curso previo en `nexa_cursos`, `induccion_items.curso_id` y 4 disparadores: asegurar previo, exigir previo, completar inducción al completar curso) · 0138 (`examenes_medicos_colaborador` y alerta de renovación).
- **Hecho y publicado en `main`:** cursos encadenados e inducción ligada a cursos (4.18); módulo de Exámenes médicos en la ficha, solo TH y la propia persona (4.10.3), con cobertura SST calculada con el registro real; tarjetas del Inicio resaltadas (2.1); filtros por cargo y rango de antigüedad en informes, Indicadores y PDI (6.1; `RANGOS_ANTIGUEDAD` en `src/lib/informes/filtros-equipo.ts`).
- **Sigue sin verse en navegador:** todo lo anterior. Mirar en la prueba: el bloqueo del curso previo (mensaje al intentar avanzar), que completar un curso confirme el punto de inducción, el filtro de antigüedad con fichas sin fecha de ingreso (no coinciden con ningún rango), y que los selects de cargo en los informes no rompan por el TS2589 (compila, pero revisar consultas anidadas de `informes/formacion` y `informes/pdi`).
- **Decisiones/limitaciones:** exámenes médicos sin adjunto de soporte (requiere políticas de almacenamiento); el filtro por «ciclo» del punto 6.1 NO se hizo (cada informe ya usa el dato más reciente y el Histórico muestra todos); «Dotación + EPP» ya es una sola pantalla (Gestión de Dotaciones incluye EPP), no hay nada que unir salvo el checklist de inducción.
- **Falta de desarrollo (lo que queda):** video/presentaciones en cursos, organigrama matricial (4.16), certificados de selección (4.2), 3 afirmaciones por dimensión de clima (decisión de Diana).
- **Pasada final de ayuda** sigue pendiente (capítulos 9 y 10 de la guía pública, «Mapa del menú», auditoría de ayuda y Gino).
- **Organigrama matricial (4.16), publicado:** migración 0139 (`dependencias_funcionales`). Una persona conserva su único `lider_id` (valoración y acompañantes); además puede tener líderes funcionales o de proyecto, que se ven con línea punteada en el organigrama y como «También reporta a» en la ficha. Se administran en Administración → Organigrama. NO cambian pesos de la valoración ni permisos (un líder funcional que deba valorar se invita como cliente interno). Falta verlo en navegador.
- **Lo que queda de desarrollo:** certificados de selección (4.2), adjunto de soporte en exámenes médicos, video en cursos, 3 afirmaciones por dimensión de clima (decisión de Diana), y la pasada final de ayuda y guía pública.

## Actualización (2026-11-12, cierre del punto 3 y clima en dos modalidades)
- **Migraciones aplicadas hasta la 0141:** 0140 (contenido propio de cursos en el bucket privado `cursos-contenido`, soporte adjunto de exámenes médicos) · 0141 (`clima_rondas.modalidad` pulso/completo y `clima_respuestas.respuestas_items`).
- **Hecho y publicado en `main`:** contenido de cursos (enlace y archivo propio de hasta 50 MB; visor de YouTube, Vimeo, video y PDF; ANTES el campo `contenido_url` no se mostraba en ninguna pantalla); soporte de exámenes médicos; botón «Leer con IA» en la hoja de vida (propone estudios y experiencia desde el PDF, TH confirma, se guardan sin verificar; `ANTHROPIC_MODEL_HOJA_VIDA` opcional); clima en dos modalidades (pulso de 1 afirmación por dimensión y diagnóstico completo de 3, con alfa por dimensión; afirmaciones en `src/lib/clima/items.ts`, borrador que Luisa y Diana deben revisar).
- **Para la prueba en navegador:** subir un video propio y un PDF a un curso y verlos como colaborador; adjuntar soporte a un examen y abrirlo como la propia persona (y comprobar que el líder no lo ve); «Leer con IA» con un PDF real (no se pudo probar sin el servicio); abrir una ronda completa, responder como varias personas y revisar el alfa por dimensión.
- **El punto 3 del plan de desarrollo queda completo en código.** Falta solo la prueba exhaustiva y la pasada final de ayuda y guía pública.

## Decisión de Diana (2026-11-13): el Ser que ve la empresa es un ESQUEMA (reemplaza a la de abajo)
- **Decisión:** ni Talento Humano ni el líder ven nunca la Guía del Flow (ni la carta). Ven siempre el **esquema** de lo que tiene relevancia laboral. Por eso **no hay consentimiento dentro de Espiral**: la autorización se da en la Guía del Flow (casilla `autorizacion_circulo_en` al registrarse, revocable en su resultado); sin ella no se envía nada. Las dos preguntas abiertas de abajo (¿TH necesita consentimiento? ¿qué pasa con las 75 Guías migradas?) quedaron resueltas por esta decisión.
- **Hecho (en la rama `informe-luisa-tanda1`, SIN fusionar a `main`):** migración **`0142_ser_esquema_laboral.sql`** (por aplicar) y cambios en Espiral y en la app GuiaDelFlow (rama `esquema-ser`, SIN subir).
  - **Espiral:** pantalla «Ser · Esquema de la Guía del Flow» (`guia-flow/page.tsx`, `esquema-ser.tsx`, `src/lib/guia-flow/esquema.ts`) con 6 grupos que responden preguntas de un líder (Talento y esencia, Propósito y motivación, Liderazgo y comunicación, Trabajo con otros, Cambio/negociación/recursividad, Inteligencias). Cada aspecto: título, descripción laboral, «Cómo aprovecharlo», «Cómo acompañarle» y una etiqueta neutra (Para aprovechar / En equilibrio / Para acompañar; no es nota). Lo ven TH, el líder directo (solo lectura) y la propia persona (ve lo mismo que su empresa + su síntesis). Solo TH edita o completa a mano. Se eliminó la tarjeta de consentimiento y el puntaje 1-5 del Ser (`ser_puntajes.puntaje` ahora es opcional y obsoleto). Brief, borrador del perfil integral y la síntesis con IA usan el esquema (`ctx.ser.fortalezas/aAcompanar` ahora son `{nombre, titulo}`). Brechas cuenta «personas con Ser» por aspectos cargados (antes por promedio). Ayuda, glosario, plan de pruebas y guía pública `/guia-lider-th` actualizados.
  - **Migración 0142:** columnas `descripcion`, `aprovechar`, `acompanar`, `enfoque` en `ser_puntajes`; `fn_ser_comparte_con_lider` siempre true; el líder solo LEE `ser_puntajes`; catálogo completo de 37 aspectos sembrado por empresa (`fn_sembrar_ser_aspectos`) y **disparador en `empresas`** (antes una empresa nueva no tenía catálogo y la Guía no cargaba nada); 9 inteligencias con nombre propio (antes 3 casillas «musical, naturaleza, expresiva» que guardaban las 3 primeras sin importar cuáles eran: se reubican por título); nuevo aspecto «Talento único».
  - **GuiaDelFlow (`src/lib/circulo/esquema-ser.ts`, `sincronizar.ts`):** el texto de la Guía solo sirve de insumo; la IA redacta el esquema en tercera persona, sin vida personal, salud, religión ni emociones íntimas, y en lenguaje neutro de género (con saneador automático). 3 lotes en paralelo (~22 s); si un lote falla queda solo título y lectura; si pasan 40 s se omiten las síntesis y las hace el cron de Espiral. La «lectura» de Comunicación, Negociación y Liderazgo transformacional sale por ESTILO (no por posición); las demás escalas por nivel. Ya no se inventan puntajes (antes 4 fijo, o 2/3/5).
  - **Verificado:** `tsc` limpio en ambas apps; Espiral compila (el `npm run build` local solo falla al pre-generar una página pública por falta de variables de Supabase en este equipo); lógica del esquema probada con el knowledge_base (9 inteligencias bien ubicadas, ningún aspecto íntimo); redacción por IA probada con datos ficticios (privacidad y neutralidad OK). **No visto en navegador** (falta aplicar 0142).
- **Orden para publicar:** (1) Diana aplica `0142` en Supabase (SQL Editor); (2) fusionar Espiral a `main`; (3) subir GuiaDelFlow (`esquema-ser`) a `main` — NUNCA antes de la migración, porque la Guía escribe columnas nuevas; (4) probar en CONVERGIA con una invitación PRU; (5) relleno de las Guías ya migradas con `npx tsx scripts/rellenar-esquema-ser.ts` en GuiaDelFlow (por defecto SOLO SIMULA; `--aplicar --empresa=<uuid> --limite=2` para probar primero en CONVERGIA; solo toca a quien autorizó; vacía las síntesis viejas para que Espiral las rehaga desde el esquema). **Mármoles es empresa real: pedir permiso a Diana antes de aplicar.**
- **A confirmar con Diana:** «Talento único» entra como aspecto visible (antes se excluía del catálogo); el líder ya no puede cargar puntajes (ya no existen) ni editar el esquema.

## (Reemplazada por la decisión del 2026-11-13) Decisión de Diana (2026-11-12, noche): consentimiento de la Guía del Flow
- **Rutina:** Espiral genera un enlace de invitación → la persona resuelve el cuestionario en la aplicación de la Guía del Flow (aplicación aparte, una sola para todas las empresas) → esa aplicación le envía A ELLA, a su correo, su Guía del Flow completa con la carta de Flowi (eso NO llega a la empresa) → a Espiral le llega una descripción formal de cada aspecto obtenido con la guía (el **esquema**).
- **Principio:** la empresa no conoce la Guía tal cual; solo el esquema de lo que refleja y le sirve a la empresa. Ese esquema es la valoración del Ser (descriptiva, sin nota). Aun así la persona **debe dar su consentimiento** para que la empresa lo vea (consentimiento previo, expreso e informado, revocable: Ley 1581).
- **Estado:** lógica, coherente y posible. NO implementado todavía; hoy, mientras la persona no decide, su líder la ve (0127). Esperan respuesta de Diana a: (1) ¿Talento Humano también necesita el consentimiento?; (2) ¿las 75 Guías ya migradas de Mármoles quedan ocultas hasta que cada persona decida (recomendado) o visibles unos días mientras se las invita?
- **Cuando confirme, implementar:** valor por defecto opt-in en `fn_ser_comparte_con_lider`; vista previa del esquema en la tarjeta de consentimiento; retirar el consentimiento con fecha; marca «Pendiente de consentimiento» en la ficha; que el Brief, el 360, el perfil integral y las Brechas omitan el Ser sin consentimiento; invitar primero a las personas migradas. Probar antes en CONVERGIA.

## Plan para la próxima sesión (cuando Diana diga «Continúa»; guardado 2026-11-12 noche)
**Preguntas que se le hacen primero (juntas):** (1) cómo entrega las credenciales de CONVERGIA sin pegarlas en el chat y contra qué entorno; (2) qué roles puede dar: admin_th, líder, colaborador, gerencia y, si se puede, Luisa; (3) un PDF de hoja de vida ficticio para «Leer con IA»; (4) si la alerta de período de prueba se prueba primero solo en CONVERGIA; (5) ¿Talento Humano también necesita el consentimiento de la Guía del Flow?; (6) las 75 Guías migradas: ¿ocultas hasta que decidan (recomendado) o visibles unos días?; (7) revisión de las 18 afirmaciones del clima; (8) el Ser en la movilidad interna; (9) roles de Luisa (Informes y Administración); (10) dónde guardar su `CLAUDE.local.md`; (11) clientes internos externos con enlace; (12) borrar `_t.ts`.
**Orden de ejecución:** (1) prueba exhaustiva con Playwright en CONVERGIA de todo lo del 2026-11-12, arreglando en el mismo turno; (2) implementar el consentimiento opt-in de la Guía del Flow y probarlo; (3) pasada final de ayuda y guía pública (capítulos 9 y 10, Mapa del menú, auditoría de ayuda, ~50 preguntas a Gino); (4) cerrar notas y decidir por dónde seguir. El guion completo con la lista de pantallas a probar está en la memoria local de la sesión y en las secciones de 2026-11-12 de este archivo.

## Actualización (2026-11-13, prueba en navegador: primera tanda, INCOMPLETA por límite de uso)
- **0142 aplicada y verificada**; Espiral y GuiaDelFlow publicados en `main` (despliegues OK).
- **Probado en producción con Talento Humano de CONVERGIA (sesión de Luisa):** las 60 pantallas del menú responden sin error de servidor; pantalla «Ser · Esquema» (ver, completar un aspecto a mano, generar invitación); ficha; Brief (tarjetas, «Rehacer borrador»).
- **Corregido en esta tanda:** clase `btn-primary` que no existía (11 botones se veían como texto: Movilidad, Equidad, Sedes, Objetivos, Perfil integral, Reabrir valoración, Seguimiento del Ser, Vincular ficha, Cliente interno, Esquema); síntesis del Ser con formato (`TextoInforme`), sin puntajes, lenguaje neutro, sin truncarse y leyendo el bloque de texto correcto de la IA; no se genera síntesis con el esquema vacío; ficha y Brief cuentan solo aspectos con título o descripción.
- **⚠️ Falta aplicar `0143_ser_conteo_aspectos_descritos.sql`** (`supabase db push`): corrige el conteo «N aspectos descritos» de la ficha y de Brechas.
- **Pendiente de probar/corregir (seguir aquí):** «Mejorar la redacción con IA» del Brief (a los 40 s no había cambiado el texto: revisar si falla o tarda); fecha en formato crudo «2026-11-01» en el resumen del Ser del Brief (`src/lib/brief/borrador.ts`); página 404 en inglés y sin marca (crear `src/app/not-found.tsx`); Dimensiones (10 s) y Brechas (11 s) lentas; 27 archivos usan `confirm()` nativo; Luisa ve Nexa y Procesos en el menú (su rol personalizado no los debía mostrar: verificar); vistas como líder y colaborador (cuenta `vanesa.hernandez` entregada por Diana, sin usar aún); registro real en la Guía del Flow (exige confirmar correo en una bandeja real); relleno de Guías migradas; y todo lo del 2026-11-12 (reabrir valoración, perfil integral, objetivos, clientes internos, movilidad, sedes, clima, cultura, inducción, exámenes médicos, cursos, imagen de vacante, alertas).
- En CONVERGIA quedó un aspecto de prueba «PRU Constancia y criterio propio» (Carácter de PRU Laura Gómez) y una invitación nueva a la Guía para ella.

## Actualización (2026-11-13, tarde: prueba en navegador de lo del 12 de noviembre, sesión de Talento Humano)
- **Probado en producción (CONVERGIA, TH) y funcionando:** objetivos concertados (proponer), Sedes (crear + asignar), Brecha cultural (agregar comportamiento, abrir encuesta, responder, anonimato con <5), Exámenes médicos (registrar; alerta «Renovar examen médico periódico» generada), imagen cuadrada y QR de vacante (cuatro descargas 200 y la imagen se ve bien), Equidad (respeta el mínimo de 5), Revisión por la Dirección, Consolidado (PDF y Excel 200), Índice integral (pesos por nivel), organigrama matricial (líder funcional guardado y visible en la ficha como «También reporta a»), Brechas y perfil integral, Brief con IA (10-40 s), Inducción.
- **Corregido hoy:** el formulario de editar colaborador no ofrecía «Sede» (la página no pasaba la lista); inducción: no había forma de asignar el plan a una persona ya creada (nuevo botón para TH: «Asignar la inducción de su cargo») y la lista no se refrescaba; cursos: sin aviso al guardar el enlace de contenido y campo de puntos sin etiqueta.
- **Registros PRU que quedaron en CONVERGIA:** sede «PRU Sede Central» (asignada a PRU Laura), líder funcional (PRU Laura → Daniela Ríos), examen médico periódico de PRU Laura (vence 5-dic-2026), 25 puntos de inducción asignados a PRU Laura, curso «PRU Curso de prueba con video» (con enlace de YouTube), comportamiento y encuesta de cultura «PRU Cultura prueba» (con 1 respuesta), objetivo concertado de PRU Laura (pendiente de aceptación).
- **Aún sin probar (necesitan otra sesión/rol o una persona real):** vista como líder y como colaborador (cuenta `vanesa.hernandez`: iniciar sesión lo hace Diana), aceptar y cerrar objetivos (los hace la persona), reabrir valoración, clientes internos, clima (crear ronda y responder con varias personas, alfa por dimensión), «Leer con IA» de la hoja de vida (falta PDF ficticio), contenido propio de cursos (subir archivo), soporte adjunto del examen médico, movilidad interna (ejecutar una búsqueda), registro real en la Guía del Flow y relleno de Guías migradas, y que el líder NO vea los exámenes médicos de su equipo.
- **Observaciones:** CONVERGIA tiene 500 puntos de inducción activos (23 comunes) y el texto común menciona «piedra natural» (contenido de Mármoles; ya anotado antes). La ronda de clima de prueba se llama «Roda de Prueba» (typo en el dato).

## Actualización (2026-11-13, noche: más pruebas en navegador, sesión de Talento Humano)
- **Funcionan en producción (CONVERGIA):** Clima (ronda de pulso abierta, formulario, resultados con anonimato «menos de 5 respuestas», detalle por dimensión y por área/líder/sede, comentarios solo TH); Movilidad interna (búsqueda de candidatos para un cargo con % de cobertura; «Potencial subutilizado» vacío sin datos); Clientes internos (invitar a PRU Pedro Candidato a valorar a Lucía Londoño; queda en el registro de envíos).
- **Observación menor:** al invitar a un cliente interno, el botón queda en «Invitando…» unos 10 s sin otro aviso.
- **Registro PRU nuevo:** invitación de cliente interno (PRU Pedro Candidato) en la valoración de Lucía Londoño.
- **Siguen sin probar:** reabrir valoración (necesita una valoración ya enviada), alfa por dimensión con la ronda completa (necesita varias personas), vistas de líder y colaborador (inicia sesión Diana), «Leer con IA» (PDF ficticio), archivo propio de curso, soporte adjunto de examen, registro real en la Guía del Flow y relleno de Guías migradas.

## Actualización (2026-11-13, noche: tres hallazgos del recorrido corregidos)
- **Oferta de vacante:** el borrador ya no copia frases internas del manual de funciones («las demás funciones que le sean asignadas…») ni habilidades de mando en cargos sin personal a cargo (`limpiarPerfilParaOferta`).
- **Índice integral:** con solo el Saber (sin Hacer ni Deber) ya no se da semáforo «Bajo»; la tarjeta dice «Sin semáforo todavía».
- **Habilidades de mando** («Liderazgo», «Capacidad de supervisión», «Estrategia») ya no se exigen en el Saber ni salen en la oferta de cargos operativos o técnico-administrativos (`habilidadAplicaAlCargo` en `nivel-cargo.ts`). El dato sembrado sigue en los cargos; solo se omite donde no aplica.
- Falta verlo en navegador (oferta de «PRU Auxiliar de servicios generales», Saber de PRU Marta, índice de PRU Camila).
