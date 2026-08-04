# Registration v4 cutover

Status: prepared, not authorized for production cutover.

## Canonical legal artifacts

| Version | Public artifact | SHA-256 |
| --- | --- | --- |
| `registration-v3` | `/legal/terms/registration-v3.html` | `0d65e0c03acd635f08c3e04628a19ef0e674e08612e2ac2446502f3b10b6b54e` |
| `registration-v4` | `/legal/terms/registration-v4.html` | `3566b7a597d10c75ad6e898879502740bc2b3ff67dfbb373dafff6973313a806` |

The v3 artifact is byte-identical to the policy accepted since August 1, 2026. It must remain
immutable. Existing registration rows already retain their accepted `terms_version` and
`terms_sha256`; migration must not rewrite them.

V4 adds an explicit bilingual disclosure of the consent-gated Meta events `PageView`,
`CompleteRegistration` and `Purchase`, their canonical firing boundaries and the fields that are
never sent to Meta. It does not authorize additional standard events.

## Backend contract Mariano must incorporate

The browser sends `terms_version=registration-v4`. PMP Myth Bot must associate that exact version
with SHA-256 `3566b7a597d10c75ad6e898879502740bc2b3ff67dfbb373dafff6973313a806` and the canonical immutable
URL `https://harmonicbeacon.com/legal/terms/registration-v4.html`. `/politica/` serves the same bytes
as the human-facing current policy at cutover time.

The current Bot accepts only one configured terms version. A no-downtime rollout therefore needs a
small compatibility window in which both immutable pairs are accepted:

- `registration-v3` → `0d65e0c03acd635f08c3e04628a19ef0e674e08612e2ac2446502f3b10b6b54e`
- `registration-v4` → `3566b7a597d10c75ad6e898879502740bc2b3ff67dfbb373dafff6973313a806`

The server must choose the hash from the submitted, allowlisted version; it must never accept a hash
from the browser. It must store the selected version/hash on the registration exactly as it does
today. Unknown versions remain rejected. Idempotent retries made under v3 must continue resolving to
their original v3 result; a v4 payload uses a version-scoped browser idempotency key.

If dual acceptance is not implemented, registration must be closed for the coordinated cutover. Do
not deploy backend-v4 and landing-v3, or landing-v4 and backend-v3, while registration is open.

## Safe rollout

1. Verify the v3 archive hash and the v4 policy hash from committed bytes.
2. Deploy Bot support for both allowlisted version/hash pairs; keep v3 as the current browser version.
3. Verify synthetic v3 and v4 requests against a non-production environment, including idempotent
   retry, legacy v3 confirmation-context recovery and rejection of unknown versions/hashes.
4. Deploy the landing with v4 form, notice and policy.
5. Verify a synthetic v4 registration, stored evidence and checkout handoff end to end.
6. Keep v3 accepted for at least the maximum in-flight browser retry window. Retire it from new
   submissions only after confirming there are no unresolved v3 attempts; never delete historical
   evidence.

This procedure does not authorize opening registration, enabling commerce or changing a real event.

## Rollback

1. Close new registration before changing only one side of the contract.
2. Restore the landing commit that submits `registration-v3` and restore the Bot's current version to
   the v3 pair above.
3. Verify v3 registration in a non-production/synthetic flow, then reopen only with explicit approval.
4. Preserve all v4 rows and the v4 document as historical evidence; do not rewrite or delete them.

When dual acceptance is active, a landing rollback to v3 does not require an emergency Bot rollback:
the Bot can continue accepting both exact pairs until the incident is understood.
