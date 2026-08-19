# Landing · Del otro lado del umbral

Estado: `review_ready`. Solo disponible en localhost y excluida del build público.

## Decisiones

- Ruta futura: `https://harmonicbeacon.com/ciclo/`.
- El selector usa zonas horarias IANA y convierte cuatro inicios fijados a `16:00 UTC`.
- Detecta la zona del navegador, permite elegir otra y conserva la elección en `?tz=` para compartirla.
- La etiqueta dice “País o zona horaria” porque algunos países tienen más de un huso.
- Las salas están en `https://live.harmonicbeacon.com/`.
- El canal de WhatsApp queda como vía para recordatorios y novedades del ciclo.

## Gate de publicación

`build.js` no copia `ciclo/` a `dist/`. No agregarla al build ni enviar el correo hasta que Sai apruebe la página y se alinee el horario con la web pública y las salas de `live.harmonicbeacon.com`, que todavía anuncian `14:00 UTC`.
