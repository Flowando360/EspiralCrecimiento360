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
- **Pendiente:** el aplicativo aún no tiene pantalla de «Cambiar mi contraseña» dentro de la sesión (solo «Olvidé mi contraseña» por correo). Falta decidir si se agrega, junto con obligar el cambio en el primer ingreso.
