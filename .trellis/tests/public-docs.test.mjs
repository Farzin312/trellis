import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const packageJson = JSON.parse(read('package.json'));
const [executable] = Object.keys(packageJson.bin ?? {});

const publicDocs = [
  'README.md',
  'SECURITY.md',
  'CHANGELOG.md',
  'docs/README.md',
  'docs/DESIGN.md',
  'docs/SYSTEM.md',
  'docs/adopting-existing-projects.md',
  'docs/evals.md',
  'docs/language-support.md',
  'docs/metrics.md',
  'docs/repository-mapping.md',
  'docs/self-hosted-services.md',
  'docs/skills.md',
  'docs/evolution.md',
  'docs/credits.md',
];

const durableGuidance = [
  'AGENTS.md',
  'docs/README-FOR-AGENTS.md',
  'docs/STRUCTURE.md',
  'docs/sdd/sdd.md',
  'docs/coding-standards.md',
  '.specify/memory/constitution.md',
];

function assertOrdered(text, values) {
  let cursor = -1;
  for (const value of values) {
    const next = text.indexOf(value, cursor + 1);
    assert.notEqual(next, -1, `missing ${value}`);
    assert.ok(next > cursor, `${value} is out of order`);
    cursor = next;
  }
}

test('README is a complete, executable adopter journey', () => {
  const readme = read('README.md');

  assert.ok(executable, 'package.json must expose an executable');
  assertOrdered(readme, [
    '## What Trellis does',
    '## Prerequisites and support',
    '## Install',
    '## First successful workflow',
    '## Troubleshooting',
    '## License',
    '## Security',
    '## Contributing',
  ]);
  assert.match(readme, new RegExp(`npm install -g \\.`));
  assert.match(readme, new RegExp(`${executable} --version`));
  assert.match(readme, /Compatibility reviewed: 2026-07-11/);
  assert.match(readme, /WSL or Git Bash/);
  assert.match(readme, /does not configure application authentication/i);
  assert.match(readme, /copyright and permission notice/i);
});

test('public docs route audiences and contain no release placeholders', () => {
  const index = read('docs/README.md');
  assertOrdered(index, [
    '## Adopters',
    '## Maintainers',
    '## Generated project guidance',
    '## History and evidence',
  ]);

  for (const path of [...publicDocs, ...durableGuidance]) {
    const text = read(path);
    assert.doesNotMatch(text, /__(?:PROJECT_NAME|PROJECT_SLUG)__/i, path);
    assert.doesNotMatch(text, /fill in after init|describe what this project is/i, path);
  }
});

test('positioning and licensing claims stay scoped', () => {
  const text = publicDocs.map(read).join('\n');

  for (const claim of [
    /all free/i,
    /all open[- ]source/i,
    /no attribution required/i,
    /works? (?:with|for) any (?:project|language)/i,
    /failure modes? .*kills/i,
    /prove(?:s)? code actually works/i,
  ]) {
    assert.doesNotMatch(text, claim);
  }
  assert.match(read('docs/credits.md'), /Phoenix.*Elastic License 2\.0.*source-available/is);
});

test('capability docs describe only configured or implemented behavior', () => {
  const evals = read('docs/evals.md');
  for (const status of ['PASS', 'FAIL', 'WARN', 'SKIP']) assert.match(evals, new RegExp(`\\b${status}\\b`));
  assert.match(evals, /required checks/i);
  assert.match(evals, /optional checks/i);

  const languages = read('docs/language-support.md');
  assert.match(languages, /Tested automation/);
  assert.match(languages, /Manual integration/);

  const metrics = read('docs/metrics.md');
  assert.match(metrics, /provider-supplied/i);
  assert.doesNotMatch(metrics, /automatic(?:ally)? (?:token|cost)/i);

  const services = read('docs/self-hosted-services.md');
  assert.match(services, /Phoenix/);
  assert.match(services, /source-available/i);
  assert.doesNotMatch(services, /Mem0/i);

  const mapping = read('docs/repository-mapping.md');
  assert.match(mapping, /trellis map --json/);
  assert.match(mapping, /trellis config enable graphify/);
  assert.match(mapping, /graphify update/);
  assert.match(mapping, /graphifyy==0\.9\.10/);
  assert.match(mapping, /trellis config enable bounds/);
  assert.match(mapping, /git\+https:\/\/github\.com\/Farzin312\/bounds\.git@a504bef/);
  assert.doesNotMatch(mapping, /pipx install bounds-cli/);
  assert.match(mapping, /bounds preflight --fail-on-unowned/);
  assert.match(mapping, /does not install/i);
  assert.match(mapping, /project-wide requirement/i);

  const compose = read('.trellis/services/docker-compose.phoenix.yml');
  assert.match(compose, /version-17\.26\.0@sha256:/);
  assert.match(compose, /127\.0\.0\.1:6006:6006/);
  assert.match(compose, /127\.0\.0\.1:4317:4317/);
  assert.match(compose, /PHOENIX_TELEMETRY_ENABLED=false/);
  assert.match(compose, /PHOENIX_WORKING_DIR=\/mnt\/data/);
  assert.doesNotMatch(compose, /:latest|PHOENIX_SQL_DATABASE_URL/);
});

test('Agent Skills paths use the canonical source and Claude mirror only', () => {
  const text = [...publicDocs, ...durableGuidance].map(read).join('\n');
  assert.match(text, /\.agents\/skills\//);
  assert.match(text, /\.claude\/skills\//);
  assert.doesNotMatch(text, /\.trellis\/agents\/skills\//);
  assert.doesNotMatch(text, /\.codex\/(?:agents|prompts)\//);
  assert.doesNotMatch(text, /\.opencode\/command\//);
  assert.doesNotMatch(text, /\.claude\/commands\//);
});

test('durable guidance shares one stack-agnostic nine-phase contract', () => {
  const phaseOrder = 'Specify -> Clarify -> Plan -> Tasks -> Checklist -> Analyze -> Implement -> Review -> Verify';
  const guidance = durableGuidance.map(read).join('\n');

  assert.ok(read('AGENTS.md').includes(phaseOrder));
  assert.ok(read('docs/sdd/sdd.md').includes(phaseOrder));
  assert.doesNotMatch(guidance, /Server Components by default|Supabase|PostgREST|Stripe/i);
  assert.match(guidance, /does not configure application authentication/i);
  assert.match(read('AGENTS.md'), /npm run check/);
  assert.doesNotMatch(read('AGENTS.md'), /npm run (?:test:mutation|check:all)/);
});

test('dated bug records have parseable leading frontmatter and required routing fields', () => {
  const records = readdirSync(new URL('../../docs/bug-fixes/', import.meta.url))
    .filter((name) => /^\d{4}-\d{2}-\d{2}-.+\.md$/.test(name));
  assert.ok(records.length > 0);
  for (const name of records) {
    const content = read(`docs/bug-fixes/${name}`);
    const frontmatter = content.match(/^---\n([\s\S]*?)\n---\n/)?.[1];
    assert.ok(frontmatter, `${name} must start with frontmatter`);
    for (const field of ['id', 'date_fixed', 'severity', 'area', 'category']) {
      assert.match(frontmatter, new RegExp(`^${field}:\\s*\\S+`, 'm'), `${name} missing ${field}`);
    }
    assert.match(content, /^> Parent:/m, `${name} missing breadcrumb`);
  }
});
