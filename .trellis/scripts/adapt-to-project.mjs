#!/usr/bin/env node
/**
 * adapt-to-project.mjs
 *
 * Adapts the Trellis framework to the project's actual stack. Runs during
 * init.sh. Detects stack from manifest files and updates the constitution,
 * mandate file, and .env.example to match reality.
 *
 * This is what makes Trellis MOLDABLE to any project premise rather than
 * being hardcoded to one stack.
 *
 * Usage:
 *   node .trellis/scripts/adapt-to-project.mjs                    # auto-detect
 *   node .trellis/scripts/adapt-to-project.mjs --stack nextjs,supabase,stripe
 *   node .trellis/scripts/adapt-to-project.mjs --interactive       # prompt user
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const args = process.argv.slice(2);

// ── Stack detection ────────────────────────────────────────────────────

function detectStack() {
  const stack = { runtime: [], database: [], payments: [], ui: [], cloud: [] };
  let pkg = {};

  // package.json
  if (existsSync(join(root, 'package.json'))) {
    pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps['next']) stack.runtime.push('nextjs');
    if (deps['react']) stack.ui.push('react');
    if (deps['svelte']) stack.ui.push('svelte');
    if (deps['vue']) stack.ui.push('vue');
    if (deps['@sveltejs/kit']) stack.runtime.push('sveltekit');
    if (deps['@remix-run/react']) stack.runtime.push('remix');
    if (deps['astro']) stack.runtime.push('astro');
    if (deps['express']) stack.runtime.push('express');
    if (deps['fastify']) stack.runtime.push('fastify');
    if (deps['@supabase/supabase-js']) stack.database.push('supabase');
    if (deps['stripe']) stack.payments.push('stripe');
    if (deps['@trpc/server']) stack.runtime.push('trpc');
    if (deps['zod']) stack.runtime.push('zod');
  }

  // requirements.txt
  if (existsSync(join(root, 'requirements.txt'))) {
    const reqs = readFileSync(join(root, 'requirements.txt'), 'utf8').toLowerCase();
    if (reqs.includes('fastapi') || reqs.includes('flask') || reqs.includes('django')) {
      stack.runtime.push('python-web');
    }
    if (reqs.includes('sqlalchemy') || reqs.includes('asyncpg')) stack.database.push('postgres');
    if (reqs.includes('pymongo')) stack.database.push('mongodb');
  }

  // go.mod
  if (existsSync(join(root, 'go.mod'))) {
    const gomod = readFileSync(join(root, 'go.mod'), 'utf8');
    if (gomod.includes('gin-gonic') || gomod.includes('echo')) stack.runtime.push('go-web');
    stack.runtime.push('go');
  }

  // Cargo.toml
  if (existsSync(join(root, 'Cargo.toml'))) {
    const cargo = readFileSync(join(root, 'Cargo.toml'), 'utf8');
    if (cargo.includes('axum') || cargo.includes('actix')) stack.runtime.push('rust-web');
    stack.runtime.push('rust');
  }

  return stack;
}

const explicitStack = args.find(a => a.startsWith('--stack='));
const stack = explicitStack ? parseExplicitStack(explicitStack) : detectStack();

console.log('Detected stack:');
console.log(JSON.stringify(stack, null, 2));

// ── Constitution adaptation ────────────────────────────────────────────

const constitutionPath = join(root, '.specify', 'memory', 'constitution.md');
if (existsSync(constitutionPath)) {
  let content = readFileSync(constitutionPath, 'utf8');

  // Principle I: Server Components First
  // Adapt to the UI framework if present, or remove for non-UI projects
  if (stack.ui.length === 0 && !stack.runtime.includes('nextjs')) {
    // Non-UI project: replace Principle I
    content = content.replace(
      /### I\. Server Components First[\s\S]*?(?=### II\.)/,
      '### I. Simplicity First\n\nPrefer the simplest solution that works. '
      + 'Avoid premature abstraction. See Ponytail addendum below.\n\n'
    );
    console.log('  Adapted: Principle I -> Simplicity First (no UI framework detected)');
  }

  // Principle II: Auth provider
  const hasSupabase = stack.database.includes('supabase');
  if (!hasSupabase) {
    content = content.replace(
      /Auth truth is your auth provider \(e\.g\., Supabase Auth\)\./,
      'Auth truth is your auth provider.'
    );
    content = content.replace(
      /Payment truth is your payment provider's webhooks \(e\.g\., Stripe\)\./,
      "Payment truth is your payment provider's webhooks."
    );
    console.log('  Adapted: Principle II stack references made generic');
  }

  writeFileSync(constitutionPath, content);
  console.log('  [OK] Constitution adapted to project stack');
}

// ── AGENTS.md adaptation ───────────────────────────────────────────────

const agentsPath = join(root, 'AGENTS.md');
if (existsSync(agentsPath)) {
  let content = readFileSync(agentsPath, 'utf8');

  // Update the scope description with detected stack
  const stackSummary = [
    ...stack.runtime,
    ...stack.ui,
    ...stack.database,
    ...stack.payments,
  ].filter(Boolean).join(', ') || 'generic';

  content = content.replace(
    /This repo owns: \[describe what this project is.*?\]/,
    `This repo owns: a project built with ${stackSummary}. Fill in the detailed scope.`
  );

  writeFileSync(agentsPath, content);
  console.log('  [OK] AGENTS.md scope updated');
}

// ── .bounds/root.yaml language detection ────────────────────────────────

const boundsPath = join(root, '.bounds', 'root.yaml');
if (existsSync(boundsPath)) {
  let boundsContent = readFileSync(boundsPath, 'utf8');
  const detectedLangs = [];
  if (existsSync(join(root, 'package.json')) || existsSync(join(root, 'tsconfig.json'))) detectedLangs.push('typescript');
  if (existsSync(join(root, 'requirements.txt')) || existsSync(join(root, 'pyproject.toml'))) detectedLangs.push('python');
  if (existsSync(join(root, 'go.mod'))) detectedLangs.push('go');
  if (existsSync(join(root, 'Cargo.toml'))) detectedLangs.push('rust');
  if (detectedLangs.length === 0) detectedLangs.push('typescript'); // fallback

  const langLine = `languages:\n${detectedLangs.map(l => `  - ${l}`).join('\n')}`;
  boundsContent = boundsContent.replace(/languages:\n(  - \w+\n?)+/, langLine + '\n');
  writeFileSync(boundsPath, boundsContent);
  console.log(`  [OK] .bounds/root.yaml languages set to: ${detectedLangs.join(', ')}`);
}

console.log('\nAdaptation complete. Review the constitution and AGENTS.md for accuracy.');

function parseExplicitStack(str) {
  const parts = str.replace('--stack=', '').split(',');
  const stack = { runtime: [], database: [], payments: [], ui: [], cloud: [] };
  for (const p of parts) {
    if (['nextjs', 'remix', 'astro', 'sveltekit', 'express', 'fastify', 'trpc'].includes(p)) stack.runtime.push(p);
    if (['react', 'svelte', 'vue', 'solid'].includes(p)) stack.ui.push(p);
    if (['supabase', 'postgres', 'mysql', 'mongodb'].includes(p)) stack.database.push(p);
    if (['stripe', 'square', 'paypal'].includes(p)) stack.payments.push(p);
  }
  return stack;
}
