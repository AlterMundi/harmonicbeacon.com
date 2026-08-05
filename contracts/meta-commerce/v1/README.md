# Meta commerce v1

Contratos públicos aditivos para que la landing mida únicamente hechos canónicos sin inferir
importe, moneda, pago ni disponibilidad.

- `commerce-status-v2.schema.json`: evolución autenticada del status de inscripción. `purchase`
  sólo es no nulo para exactamente una orden paga elegible.
- `public-catalog.schema.json`: proyección pública sin IDs, URLs ni tokens de Ticket Tailor.
- Los fixtures son sintéticos, no contienen PII y deben permanecer byte-idénticos en el repositorio
  de la landing.

El MVP acepta solamente USD. `amount_minor` son centavos y la landing deriva el valor decimal para
Meta dividiendo por 100. `conversion_id` es opaco, estable y no deriva del ID del proveedor.
