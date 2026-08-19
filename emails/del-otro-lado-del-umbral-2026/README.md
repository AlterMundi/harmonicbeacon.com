# Email · Del otro lado del umbral

Estado: `review_ready`. No enviado ni publicado como campaña.

## Piezas

- `index.html`: versión HTML compatible con clientes de correo, sin JavaScript, fuentes externas ni contenido esencial en imágenes.
- `email.txt`: alternativa de texto plano y referencia de asunto/preheader.

## Envío sugerido

- Asunto: `Del otro lado del umbral · cuatro sábados para una búsqueda de visión`
- Preheader: `Un ciclo gratuito y virtual de Proyección Armónica del Mito, con Harmonic Beacon.`
- CTA de horario: selector de país o zona horaria en `https://harmonicbeacon.com/ciclo/`.
- CTA primaria de participación: salas en `https://live.harmonicbeacon.com/`.
- CTA de comunidad: canal de WhatsApp para recordatorios y novedades.
- CTA secundaria: web de Harmonic Beacon.

Antes de un envío masivo, la plataforma elegida debe agregar su enlace real de baja/preferencias y la identificación postal requerida. Esos datos no se simulan dentro de esta maqueta.

## Gate horario

El correo implementa la instrucción de Sai del 18 de agosto de 2026: inicio a las `16:00 UTC`.

- Costa Rica / CDMX: 10:00
- EE. UU. ET / Bolivia / Venezuela: 12:00
- Argentina / Uruguay: 13:00
- España peninsular: 18:00
- Chile continental: 12:00 el 22/08, 29/08 y 05/09; 13:00 el 12/09 por el cambio de UTC−4 a UTC−3.

La landing `/ciclo/` está solo en localhost y excluida de `build.js`; su enlace público todavía no existe. La web pública y las salas de `live.harmonicbeacon.com` todavía anuncian `14:00 UTC`. No enviar este correo hasta publicar la landing y alinear las tres superficies o confirmar otro horario explícito.
