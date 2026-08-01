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

```bash
npm test
npm run build
```

## Deploy

GitHub Pages desde `main` / root.

## Documentos legales públicos

Los documentos consumidos por sistemas externos se publican con nombres versionados e inmutables.
La autorización vigente del bot de Harmonic Myth Projection está en
`legal/terms/bot-v6.pdf`; una nueva versión debe usar otro nombre y no sobrescribir ese archivo.
