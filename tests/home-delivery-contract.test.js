const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contractPath = 'docs/ops/home-delivery-contract-v1.md';
const marker = '<!-- hb-delivery-contract: ops-f-v1 -->';

test('the root delivery marker is unique and exists only as a non-visible HTML comment', () => {
  const home = read('index.html');
  assert.equal(home.split(marker).length - 1, 1);

  const markerComments = [...home.matchAll(/<!--[\s\S]*?-->/g)]
    .map(match => match[0])
    .filter(comment => comment.includes('hb-delivery-contract:'));
  assert.deepEqual(markerComments, [marker]);
  assert.doesNotMatch(home.replace(/<!--[\s\S]*?-->/g, ''), /hb-delivery-contract:/);
});

test('the versioned Home contract records the truthful legacy delivery and recovery boundaries', () => {
  assert.ok(fs.existsSync(path.join(root, contractPath)), `${contractPath} must exist`);
  const contract = read(contractPath);

  assert.match(contract, /Contract version: `ops-f-v1`/);
  assert.match(contract, /legacy GitHub Pages branch source is `main:\/`/);
  assert.match(contract, /`dist\/` is a CI build output only and is not the GitHub Pages source/);
  assert.match(contract, /source commit SHA/);
  assert.match(contract, /SHA-256/);
  assert.match(contract, /HTTP `200`/);
  assert.match(contract, /hb-delivery-contract: ops-f-v1/);
  assert.match(contract, /revert PR[\s\S]*republish/i);
  assert.match(contract, /There is no staging environment/);
  assert.match(contract, /no verified alert-recipient configuration or delivery evidence/i);
  assert.match(contract, /repository administrator[\s\S]*external/i);
  assert.doesNotMatch(contract, /https?:\/\/[^\s)`]*staging/i);
});

test('CI remains validation-only and retains test, build, and manifest verification', () => {
  const workflowDirectory = path.join(root, '.github', 'workflows');
  const workflows = fs.readdirSync(workflowDirectory)
    .filter(name => /\.ya?ml$/.test(name))
    .map(name => read(path.join('.github', 'workflows', name)))
    .join('\n');

  assert.match(workflows, /run: npm test/);
  assert.match(workflows, /run: npm run build/);
  assert.match(workflows, /Verify contract manifests/);
  assert.match(workflows, /sha256sum -c SHA256SUMS/);
  assert.doesNotMatch(workflows, /actions\/(?:upload-pages-artifact|deploy-pages)|pages-build-deployment|environment:\s*staging/i);
});

test('README delegates deployment operations to the versioned contract', () => {
  const readme = read('README.md');
  assert.match(readme, new RegExp(`\\[.*\\]\\(${contractPath.replaceAll('/', '\\/')}\\)`));
  assert.match(readme, /supersedes the previous one-line deployment procedure/i);
});
