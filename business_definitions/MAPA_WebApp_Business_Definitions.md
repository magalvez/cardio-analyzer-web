# MAPA Cardio — Web App: Definiciones de Negocio
> Documento de referencia para el desarrollo de la plataforma web de gestión de estudios MAPA cardiológicos.
> Destinado al equipo de desarrollo (Antigravity + Gemini 3.1).

> ⚠️ **IMPORTANTE PARA EL EQUIPO DE DESARROLLO:**
> Todas las tablas descritas en la Sección 5 (Modelo de datos) ya están creadas en Supabase y contienen datos reales de producción. **NO recrear ni modificar el schema** sin coordinación previa. Las tablas existentes son:
> , , , , , , , , , , , , , , .
> La conexión a la DB se hace via  (connection string de Supabase Postgres).

---

## 1. ¿Qué es el sistema?

MAPA Cardio es una plataforma SaaS para clínicas cardiológicas que automatiza la captura, análisis con IA y generación de informes de estudios de Monitoreo Ambulatorio de Presión Arterial (MAPA).

El flujo completo funciona así:
1. El médico envía imágenes del reporte MAPA por Telegram
2. Un sistema de automatización (n8n) procesa las imágenes con Gemini Vision
3. Un motor clínico clasifica los resultados según la guía clínica activa (ESC2024, ESH2023, etc.)
4. Se genera automáticamente un informe Word
5. El médico entra a la web app, revisa, edita si es necesario y aprueba el estudio

La web app es la interfaz de gestión y revisión — no captura estudios, los recibe del pipeline de automatización.

---

## 2. Stack tecnológico del backend existente

- **Base de datos**: PostgreSQL en Supabase (solo Postgres, no se usa Supabase Auth ni otros servicios)
- **Almacenamiento de archivos**: Cloudflare R2 (bucket: `mapa-estudios`)
- **Automatización**: n8n self-hosted
- **IA**: Google Gemini API (extracción de imágenes + resumen narrativo)
- **Bot**: Telegram Bot API

La web app se conecta directamente al Postgres de Supabase y a Cloudflare R2 vía Workers.

---

## 3. Actores del sistema

### Médico
- Usuario principal de la web app
- Ve únicamente sus propios estudios (filtrados por `medico_id`)
- Puede revisar, editar y aprobar estudios
- Puede descargar informes Word
- Pertenece a una sola clínica

### Administrador de clínica
- Ve y gestiona todos los estudios de su clínica
- Crea, edita y bloquea médicos/usuarios
- Configura la guía clínica activa
- Configura tarifas por tipo de estudio por médico
- Genera pre-cuentas de pago a médicos
- Accede al dashboard completo con filtros por médico

### Super administrador (futuro)
- Gestiona múltiples clínicas
- Por ahora no es necesario para el MVP

---

## 4. Autenticación

- **Mecanismo**: JWT propio — sin dependencia de Supabase Auth ni Auth0
- **Flujo**: usuario + contraseña encriptada con bcrypt almacenada en tabla `usuarios` de Postgres
- El backend genera y valida tokens JWT con expiración configurable
- Si Supabase se reemplaza por otro Postgres en el futuro, la autenticación no se ve afectada
- Soporte para refresh tokens

---

## 5. Modelo de datos principal

### Tabla: `usuarios`
```
id, clinica_id, medico_id, email, password_hash, rol ('medico' | 'admin'), activo, created_at
```
- Un usuario médico tiene un `medico_id` asociado
- Un usuario admin tiene `medico_id = null`
- Un usuario pertenece a una sola clínica

### Tabla: `clinicas`
```
id, nombre, guia_clinica, guia_clinica_id (FK → guias_clinicas), activa, created_at
```

### Tabla: `medicos`
```
id, clinica_id, telegram_user_id, telegram_username, nombre_completo, especialidad, registro_medico, created_at
```

### Tabla: `pacientes`
```
id, clinica_id, nombre_completo, cedula (única por clínica), fecha_nacimiento, edad, sexo, created_at
```

### Tabla: `estudios`
```
id, clinica_id, medico_id, paciente_id, sesion_id,
fecha_inicio, fecha_fin, software_dispositivo,
lecturas_totales, lecturas_validas, porcentaje_validas,
motivo_consulta, estado ('procesando' | 'completado' | 'revision' | 'aprobado' | 'cancelado'),
notas_medico (text),
aprobado_at, aprobado_por (FK → usuarios),
created_at
```

### Tabla: `resultados_ia`
```
id, estudio_id,
promedio_pas_general, promedio_pad_general, promedio_pam_general, promedio_fc_general,
promedio_pas_dia, promedio_pad_dia, promedio_pas_noche, promedio_pad_noche,
carga_pas_dia_pct, carga_pad_dia_pct, carga_pas_noche_pct, carga_pad_noche_pct,
caida_nocturna_pas_pct, caida_nocturna_pad_pct,
patron_dipper ('dipper' | 'non-dipper' | 'extreme-dipper' | 'riser'),
morning_surge_detectado (boolean), morning_surge_pas,
aasi, msi,
hipotension_diurna_detectada (boolean), hipotension_nocturna_detectada (boolean),
clasificacion ('normal' | 'elevada' | 'anormal'),
guia_usada,
resumen_motor (text),
resumen_gemini (text),
confianza_global,
modelo_usado,
raw_extraccion (jsonb),
created_at
```

### Tabla: `estudio_imagenes`
```
id, estudio_id, r2_key_original, orden, created_at
```
Las URLs se generan bajo demanda vía presigned URLs del Worker de Cloudflare (no se almacenan URLs permanentes — el bucket es privado por seguridad de datos del paciente).

### Tabla: `estudio_reportes`
```
id, estudio_id, tipo ('word' | 'pdf'),
r2_key (reporte original generado por IA),
r2_url,
r2_key_editado (versión editada por el médico),
r2_url_editado,
nombre_archivo,
tamanio_bytes,
editado_at, editado_por (FK → usuarios),
generado_at, created_at
```

### Tabla: `guias_clinicas`
```
id, codigo ('ESC2024' | 'ESH2023' | 'ACC_AHA2017'),
nombre_completo, anio,
referencias (jsonb),
umbrales (jsonb) — contiene HTA, elevada, hipotensión, dipper, morning surge, AASI, etc.
activa (boolean), created_at
```

### Tabla: `tarifas_medico` (nueva)
```
id, clinica_id, medico_id,
tipo_estudio ('MAPA' | 'ECO' | ...),
tarifa_por_estudio (decimal),
moneda ('COP' | 'USD'),
activa (boolean),
vigente_desde, vigente_hasta,
created_at
```

### Tabla: `liquidaciones` (nueva)
```
id, clinica_id, medico_id,
periodo_inicio, periodo_fin,
total_estudios (integer),
total_bruto (decimal),
porcentaje_iva (decimal, default 0),
valor_iva (decimal),
total_neto (decimal),
estado ('borrador' | 'enviado' | 'pagado'),
notas (text),
generado_por (FK → usuarios),
generado_at, created_at
```

### Tabla: `liquidacion_detalle` (nueva)
```
id, liquidacion_id, estudio_id,
tipo_estudio, tarifa_aplicada,
fecha_estudio, paciente_nombre,
created_at
```

---

## 6. Módulos de la web app

### 6.1 Dashboard
Vista principal al iniciar sesión. Diseño de alto impacto visual — el administrador o médico debe entender su negocio en una sola pantalla.

**Métricas principales (KPIs):**
- Total estudios del período seleccionado
- Comparación vs período anterior (% de cambio con indicador visual ↑↓)
- Distribución por clasificación: normal / elevada / anormal (gráfico donut o barras)
- Estudios pendientes de aprobación
- Top pacientes con HTA confirmada
- Tasa de calidad (% estudios con >70% lecturas válidas)

**Gráficos:**
- Línea temporal de estudios por día/semana del período
- Forecast del siguiente mes (regresión lineal calculada en el backend, sin IA externa)
- Distribución por patrón dipper (dipper / non-dipper / extreme-dipper / riser)
- Distribución por motivo de consulta
- Heatmap de actividad por día de la semana y hora

**Filtros del dashboard:**
- Período: Mes actual (default) | Últimos 7 días | Últimos 30 días | Último trimestre | Año actual | Personalizado (fecha inicio - fecha fin)
- Clínica (solo admin)
- Médico (solo admin, dropdown con todos los médicos de la clínica)

**Sección "Cómo va tu negocio":**
- Comparación de ingresos estimados vs mes anterior
- Tendencia de crecimiento de estudios (últimos 6 meses)
- Estudio más frecuente por motivo de consulta
- Día y hora de mayor actividad

### 6.2 Estudios
Lista paginada de todos los estudios del médico (o de la clínica si es admin).

**Columnas:** Paciente, Cédula, Fecha, Motivo, Clasificación (badge color), Guía usada, Estado, Acciones.

**Filtros:** Estado, Clasificación, Fecha, Médico (solo admin), Motivo de consulta.

**Búsqueda:** Por nombre de paciente o cédula.

**Acciones por estudio:** Ver detalle, Descargar Word, Aprobar.

### 6.3 Detalle de estudio
Vista completa de un estudio individual.

**Secciones:**
1. **Datos del paciente** — nombre, cédula, edad, sexo
2. **Datos del estudio** — fecha inicio/fin, software, lecturas válidas, motivo de consulta, guía clínica usada
3. **Imágenes originales** — galería con las imágenes del reporte MAPA subidas desde Telegram (URLs presignadas con expiración de 60 minutos generadas por el Worker)
4. **Resultados numéricos** — tabla con todos los promedios (24h, despierto, sueño), cargas, patrón dipper, AASI, MSI, morning surge, hipotensión detectada
5. **Clasificación** — badge visual prominente: 🟢 Normal / 🟡 PA Elevada / 🔴 HTA Confirmada
6. **Resumen técnico** — texto generado por el motor de análisis clínico
7. **Resumen narrativo IA** — texto generado por Gemini, editable inline
8. **Editor de informe Word** — editor de texto enriquecido que respeta el formato exacto del .docx (negritas, estilos, estructura INFORME/CONCLUSIÓN/NOTA/Referencias). Al guardar genera una nueva versión en R2 y actualiza `r2_key_editado` en `estudio_reportes`
9. **Notas del médico** — campo de texto libre para agregar observaciones
10. **Botones de acción** — Descargar Word (original o editado), Aprobar estudio, Marcar para revisión

### 6.4 Pacientes
Lista de todos los pacientes de la clínica.

**Columnas:** Nombre, Cédula, Edad, Sexo, Total estudios, Último estudio, Clasificación más reciente.

**Al hacer clic:** Ver historial completo de estudios del paciente con evolución temporal de sus valores de PA.

### 6.5 Configuración de clínica (solo admin)
- Nombre de la clínica
- Guía clínica activa (selector: ESC2024, ESH2023, ACC_AHA2017)
- Configuración de IVA (porcentaje, modificable, default 0%)

### 6.6 Gestión de médicos/usuarios (solo admin)
- Lista de médicos con su estado (activo/bloqueado)
- Crear nuevo médico/usuario (nombre, email, contraseña temporal, especialidad, registro médico)
- Editar datos de un médico
- Bloquear/desbloquear acceso
- Ver estudios de un médico específico

### 6.7 Tarifas por médico (solo admin)
- Configurar tarifa por tipo de estudio por médico (MAPA, ECO, etc.)
- Historial de cambios de tarifa (vigente_desde / vigente_hasta)
- Vista de tarifa activa por médico

### 6.8 Liquidaciones (solo admin)
- Seleccionar médico + período (fecha inicio - fecha fin)
- Sistema calcula automáticamente: total estudios completados × tarifa del período
- Vista previa de la pre-cuenta con detalle estudio por estudio
- Aplicar IVA configurado (si es > 0%)
- Exportar como PDF o Excel (el usuario elige con botones de icono)
- Cambiar estado: borrador → enviado → pagado
- Historial de liquidaciones anteriores por médico

---

## 7. Flujo de aprobación de un estudio

1. El pipeline de n8n completa el procesamiento → estado: `completado` (o `revision` si confianza baja)
2. El médico entra a la web y ve el estudio en su lista
3. Abre el detalle → revisa imágenes originales, resultados numéricos, resumen narrativo
4. Opcionalmente edita el informe Word y/o agrega notas
5. Hace clic en "Aprobar" → estado cambia a `aprobado`, se registra `aprobado_at` y `aprobado_por`
6. Descarga el Word (versión editada si hizo cambios, original si no)

---

## 8. Seguridad y privacidad de datos

- Las imágenes de los pacientes están en un bucket R2 **privado**
- Las URLs de imágenes se generan como presigned URLs con expiración de 60 minutos
- Las URLs presignadas las genera el Worker `mapa-r2-presigner` existente
- Todos los endpoints de la API requieren JWT válido
- Los médicos solo pueden acceder a sus propios estudios (validación en backend por `medico_id`)
- Los administradores solo acceden a estudios de su clínica (validación por `clinica_id`)
- Las contraseñas se almacenan con bcrypt (mínimo 12 rounds)

---

## 9. Forecast (sin IA externa)

El forecast del dashboard se calcula en el backend con regresión lineal simple sobre los datos históricos de estudios:

- Toma los últimos 90 días de datos como base
- Calcula la tendencia (pendiente de la regresión)
- Proyecta los próximos 30 días
- Se muestra como línea punteada en el gráfico temporal
- Se exporta junto con el resto del dashboard como imagen o PDF

No se usa Gemini ni ninguna IA externa para el forecast — costo cero.

---

## 10. Tipos de estudio (extensible)

Actualmente el sistema procesa estudios MAPA. La arquitectura está preparada para agregar nuevos tipos:

- **MAPA** — Monitoreo Ambulatorio de Presión Arterial (activo)
- **ECO** — Ecocardiograma (futuro)

El campo `tipo_estudio` en `tarifas_medico` y `liquidacion_detalle` soporta cualquier tipo de estudio nuevo sin cambios de schema.

---

## 11. Consideraciones de UX/UI

### Estándar de calidad: AMAZING y ESPECTACULAR
La UX/UI de esta plataforma debe ser de primer nivel mundial. No es un sistema interno genérico — es el producto que el cliente vende a las clínicas cardiológicas. La interfaz debe vender sola. Cada pantalla debe causar impresión.

### Principios de diseño
- **Impacto visual inmediato** — el dashboard es lo primero que ve el médico/admin. Debe generar una reacción de "wow" en los primeros 3 segundos
- **Claridad clínica** — la plataforma es usada por cardiólogos. El lenguaje debe ser médico y preciso. Los datos deben ser fáciles de leer y comparar
- **Jerarquía visual clara** — lo más importante siempre debe ser lo más visible
- **Microinteracciones** — animaciones sutiles y fluidas en transiciones, hover states, carga de datos, aprobación de estudios
- **Dark mode nativo** — los médicos frecuentemente trabajan en ambientes de poca luz. El dark mode no es opcional, es necesario
- **Mobile-first** — los médicos consultan desde el teléfono. Cada pantalla debe ser perfecta en móvil

### Sistema de colores de clasificación (no negociable)
Los colores de clasificación deben ser inmediatamente reconocibles y consistentes en toda la plataforma:
- 🟢 **Normal** — verde (#16A34A o similar)
- 🟡 **PA Elevada** — amarillo/ámbar (#D97706 o similar)
- 🔴 **HTA Confirmada** — rojo (#DC2626 o similar)
- ⚪ **Procesando** — gris neutro

### Tipografía
- Fuente principal: elegante, médica/profesional, no genérica (evitar Inter, Roboto, Arial)
- Fuente de datos: monoespaciada o con cifras tabulares para los valores numéricos de PA

### Componentes clave que deben ser excepcionales
1. **Dashboard** — gráficos animados, KPIs con counters animados, forecast visual impactante
2. **Badge de clasificación** — debe ser visualmente prominente en toda la plataforma
3. **Detalle de estudio** — comparación visual de valores del paciente vs umbrales de la guía
4. **Editor de Word** — debe sentirse como un editor profesional, no un textarea simple
5. **Liquidaciones** — tablas financieras limpias, exportación con un clic

### Responsividad
- Desktop: experiencia completa con sidebar y múltiples columnas
- Tablet: layout adaptado, sidebar colapsable
- Móvil: navegación bottom bar, cards en lugar de tablas, gestos nativos

---

## 12. Infraestructura y stack tecnológico

### Framework
**Next.js (React)** — frontend y backend en un solo proyecto. Las API Routes / Route Handlers de Next.js actúan como backend serverless sin necesidad de un servidor separado.

### Deploy
**Vercel (plan Free)** — todo el proyecto (frontend + API) se despliega en Vercel sin costo adicional. Las API Routes corren como funciones serverless bajo demanda.

Limitaciones del plan Free de Vercel a tener en cuenta:
- 100GB de bandwidth al mes
- 100 horas de ejecución de funciones serverless al mes
- Timeout máximo de 10 segundos por función

Para el volumen de una clínica cardiológica esto es más que suficiente.

### Conexiones externas
- **Base de datos**: PostgreSQL en Supabase (connection string directo, sin Supabase Auth ni otros servicios)
- **Archivos**: Cloudflare R2 (bucket `mapa-estudios`) vía Worker `mapa-r2-presigner`
- **Autenticación**: JWT propio con bcrypt — sin dependencia de Supabase Auth ni Auth0

### Variables de entorno necesarias en Vercel
```
DATABASE_URL=postgresql://...supabase.com:5432/postgres
JWT_SECRET=...
CLOUDFLARE_WORKER_URL=https://mapa-r2-presigner.galvez-alejo.workers.dev
CLOUDFLARE_WORKER_API_KEY=...
```

---

## 13. Pendientes del pipeline que impactan la web app

Los siguientes cambios en el pipeline de n8n están en progreso y la web app debe soportarlos:

1. **Motivo de consulta estandarizado** — 5 opciones fijas + "Otro": Evaluación de HTA, Descartar HTA, HTA enmascarada, Fenómeno de bata blanca, Otro
2. **Detección de hipotensión** — el resultado IA incluirá `hipotension_diurna_detectada` y `hipotension_nocturna_detectada`
3. **Conclusión según motivo** — el resumen narrativo de Gemini se adapta al motivo de consulta
4. **Generación de Word automática** — el pipeline genera el .docx y lo sube a R2, referenciado en `estudio_reportes`
