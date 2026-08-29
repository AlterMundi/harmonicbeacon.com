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

`/inscripcion/` usa el contrato legal `registration-v4` con PMP Myth Bot. El navegador conserva una
clave idempotente hasta recibir una respuesta válida, abre únicamente el checkout específico que
devuelve la API y consulta después un estado canónico con un token separado. Apps Script queda
como importador legacy `registration-v2`; no recibe el formulario actual ni envía emails.

`REGISTRATION_OPEN=false` mantiene oculto el formulario, bloquea toda solicitud de registro antes
de la red y muestra el aviso bilingüe de próxima apertura. El cutover posterior cambia únicamente
ese valor a `true`, después del GO de Dirección y de habilitar el catálogo del Bot.

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
Las evidencias HTML exactas de inscripción permanecen en `legal/terms/registration-v3.html` y
`legal/terms/registration-v4.html`; `/politica/` refleja la versión vigente y cada URL/hash
inmutable se coordina con el Bot antes del cutover.
La autorización vigente del bot de Harmonic Myth Projection está en
`legal/terms/bot-v10.pdf`; `bot-v6.pdf`, `bot-v7.pdf`, `bot-v8.pdf` y `bot-v9.pdf` permanecen como
evidencia histórica y no se sobrescriben.
