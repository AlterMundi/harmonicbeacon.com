# Home operating, delivery, and recovery contract v1

Contract version: `ops-f-v1`

This contract covers the public Home site at <https://harmonicbeacon.com/>. It records the current
mechanism; it does not create a deployment system or change repository or Pages settings.

## Operating and delivery contract

- The current legacy GitHub Pages branch source is `main:/` (the root of `main`). A change reaches
  the public site only after it is merged to `main` and GitHub Pages republishes that source.
- `.github/workflows/ci.yml` is validation-only. It runs `npm test`, `npm run build`, and verifies
  each versioned contract manifest with `sha256sum -c SHA256SUMS`.
- `dist/` is a CI build output only and is not the GitHub Pages source. CI does not upload or deploy
  it.
- There is no staging environment. Pull-request CI and local checks are the pre-publication gates;
  the first deployment verification occurs against the public URL after merge.

Before merge, require the CI checks above to pass. Record the source commit SHA, source tree, and the
SHA-256 of `index.html` from that commit:

```bash
source_commit=$(git rev-parse HEAD)
source_tree=$(git rev-parse "$source_commit^{tree}")
source_index_sha256=$(git show "$source_commit:index.html" | sha256sum | cut -d' ' -f1)
```

After Pages republishes, fetch the public document without credentials and record its HTTP status,
headers, retrieval time, marker count, and SHA-256. Acceptance requires HTTP `200`, exactly one
`hb-delivery-contract: ops-f-v1` marker, and a public body SHA-256 equal to
`source_index_sha256`:

```bash
retrieved_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
status=$(curl -sS -L -D public-headers.txt -o public-index.html \
  -w '%{http_code}' https://harmonicbeacon.com/)
test "$status" = 200
test "$(grep -Foc '<!-- hb-delivery-contract: ops-f-v1 -->' public-index.html)" = 1
public_index_sha256=$(sha256sum public-index.html | cut -d' ' -f1)
test "$public_index_sha256" = "$source_index_sha256"
```

Keep these values together as the source/deployment fingerprint. Do not record cookies, authorization
headers, form data, or other visitor information.

## Recovery contract

If the public verification fails because of a Home change, create a revert PR for the responsible
commit, require the same CI checks, merge the revert to `main`, wait for Pages to republish, and repeat
the public HTTP, marker, and SHA-256 verification. Do not rewrite `main` or bypass review to roll back.

There is currently no verified alert-recipient configuration or delivery evidence, so this contract
does not claim that anyone is automatically notified of a failed publish or public check. Verification
must be initiated and its evidence retained by the release operator.

A future migration away from the legacy branch source would require a repository administrator to
change the GitHub Pages source setting. That admin action remains external to this contract and is not
authorized by this candidate.
