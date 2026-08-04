# Public registration v2

Contrato aditivo para verificar el buzón antes de emitir checkout y para recuperar desde el
navegador una compra de Ticket Tailor cuyo metadata no haya regresado al backend.

El modo legacy conserva `registration.response.v1`. Con verificación activa, la creación devuelve
`registration.email-verification.v1`; la confirmación correcta del código devuelve el contrato
legacy con checkout. El navegador debe conservar en `sessionStorage` el `registration_id`, el
`commerce_status_token` y el `checkout.metadata_value`, sin incluirlos en analytics ni logs.

Archivos:

- `email-verification-response.schema.json`
- `email-verification.fixture.json`
- `commerce-claim-request.schema.json`
- `commerce-claim-response.schema.json`
- `commerce-claim.fixture.json`
