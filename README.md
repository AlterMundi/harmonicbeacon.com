# Harmonic Beacon — sitio

Landing del **Harmonic Beacon** de [AlterMundi](https://altermundi.net).

Estática (HTML + Tailwind CDN + GSAP + Three.js). SPA por hash:
`#beacon` · `#experiencia` · `#hit` · `#altermundi` · `#mito`.

## Levantar local

```bash
python3 -m http.server 8768
```

Después abrir <http://localhost:8768>.

## Inscripción y pago

`/inscripcion/` usa el contrato `registration-v3` de PMP Myth Bot. El navegador conserva una
clave idempotente hasta recibir una respuesta válida, abre únicamente el checkout específico que
devuelve la API y consulta después un estado canónico con un token separado. Apps Script queda
como importador legacy `registration-v2`; no recibe el formulario actual ni envía emails.

Antes de publicar este flujo deben estar operativos `https://bot.harmonicbeacon.com`, el widget
específico bajo `https://tickets.harmonicbeacon.com` y el webhook de Ticket Tailor. La página de
confirmación no interpreta parámetros de retorno como prueba de pago.

El checkout debe ser el URL exacto generado por el embed de un widget específico de evento y
contener `/chk/<widget-token>/`. Un enlace directo `/checkout/view-event/id/<id>/` no puede
transportar la metadata opaca que vincula pago e inscripción y se rechaza antes de navegar.

La allowlist coordinada vive en `assets/hmp-commerce.js`. Actualmente sólo admite el evento
`hmp-2026-08-08` y sus dos widgets conocidos. Una fecha nueva debe agregarse junto con su
`event_code`, sesiones e IDs de widget después de que exista la misma entrada habilitada en el
catálogo del Bot; un parámetro `fecha` desconocido queda cerrado y nunca abre otro checkout por
defecto. Los requests de inscripción y estado tienen timeouts acotados. Un timeout de inscripción
conserva la misma clave idempotente para que reintentar sea seguro.

```bash
npm test
npm run build
```

## Deploy

GitHub Pages desde `main` / root.

## Documentos legales públicos

Los documentos consumidos por sistemas externos se publican con nombres versionados e inmutables.
La autorización vigente del bot de Harmonic Myth Projection está en
`legal/terms/bot-v7.pdf`; una nueva versión debe usar otro nombre y no sobrescribir ese archivo.
