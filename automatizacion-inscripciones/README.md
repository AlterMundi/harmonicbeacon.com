# Inscripciones en Google Sheets

Esta automatización guarda cada inscripción de la landing en una hoja de Google
Sheets, avisa a `info@harmonicbeacon.com` y envía una confirmación al participante.

## Activación desde info@harmonicbeacon.com

1. Crear una hoja llamada **Inscripciones Harmonic Myth Projection**.
2. En la hoja, abrir **Extensiones > Apps Script**.
3. Borrar el ejemplo que aparece, pegar el contenido de `Code.gs` y guardar.
4. Elegir la función `setup` en la barra superior y presionar **Ejecutar**. Google
   solicitará autorización y el script creará la pestaña y los encabezados.
5. Presionar **Implementar > Nueva implementación > Aplicación web**.
6. Configurar **Ejecutar como: Yo** y **Quién tiene acceso: Cualquier persona**.
7. Presionar **Implementar** y copiar la URL terminada en `/exec`.

La URL `/exec` debe colocarse como `action` del formulario en
`inscripcion/index.html`. Hasta realizar ese último cambio, el formulario público
continúa enviando inscripciones por FormSubmit y no se interrumpe.

Nunca hay que compartir la contraseña de la cuenta de Google. Para descargar la
tabla como Excel: **Archivo > Descargar > Microsoft Excel (.xlsx)**.
