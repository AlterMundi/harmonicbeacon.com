# Inscripciones en Google Sheets

Esta automatización guarda cada inscripción de la landing en una hoja de Google
Sheets, avisa a `info@harmonicbeacon.com` y envía una confirmación al participante.

## Activación desde info@harmonicbeacon.com

1. Crear una hoja llamada **Inscripciones Harmonic Myth Projection**.
2. En la hoja, abrir **Extensiones > Apps Script**.
3. Borrar el ejemplo que aparece, pegar el contenido de `Code.gs` y guardar.
   El identificador de la hoja ya está configurado en el archivo.
4. Elegir la función `setup` en la barra superior y presionar **Ejecutar**. Google
   solicitará autorización y el script creará la pestaña y los encabezados.
5. Presionar **Implementar > Nueva implementación > Aplicación web**.
6. Configurar **Ejecutar como: Yo** y **Quién tiene acceso: Cualquier persona**.
7. Presionar **Implementar** y copiar la URL terminada en `/exec`.

La URL `/exec` debe colocarse como `action` del formulario en
`inscripcion/index.html`. Hasta realizar ese último cambio, el formulario público
continúa enviando inscripciones por FormSubmit y no se interrumpe.

Después de modificar `Code.gs`, crear una nueva versión de la implementación web; guardar el
editor no actualiza una implementación versionada. Ejecutar nuevamente `setup()` antes de probar
para ampliar los encabezados sin perder las siete columnas históricas.

Cada fila nueva incluye un `Registration ID` UUID, códigos estables de evento y sesión, locale,
versión de términos, momento de aceptación y última actualización. Esos campos forman el contrato
de importación idempotente de PMP Myth Bot.

Nunca hay que compartir la contraseña de la cuenta de Google. Para descargar la
tabla como Excel: **Archivo > Descargar > Microsoft Excel (.xlsx)**.
