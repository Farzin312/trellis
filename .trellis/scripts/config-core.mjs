import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  openSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';

export const STACKS = Object.freeze(['generic', 'javascript', 'typescript', 'python', 'go', 'rust']);
export const INTEGRATIONS = Object.freeze(['graphify', 'bounds']);
const knownFields = new Set([
  'schema_version',
  'project_name',
  'project_slug',
  'stacks',
  'enabled_integrations',
]);

export class ConfigError extends Error {}

function uniqueStringArray(value, field, allowed, { nonempty = false } = {}) {
  if (!Array.isArray(value) || (nonempty && value.length === 0)) {
    throw new ConfigError(`${field} must be ${nonempty ? 'a non-empty' : 'an'} array`);
  }
  if (value.some((entry) => typeof entry !== 'string' || !allowed.includes(entry))) {
    throw new ConfigError(`${field} contains an unsupported value`);
  }
  if (new Set(value).size !== value.length) throw new ConfigError(`${field} contains duplicates`);
  return [...value];
}

export function validateConfig(value) {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    throw new ConfigError('root must be a JSON object');
  }
  if (value.schema_version !== 1) throw new ConfigError('schema_version must equal 1');
  if (typeof value.project_name !== 'string' || !value.project_name.trim()
    || value.project_name !== value.project_name.trim()
    || value.project_name.length > 200 || /[\u0000-\u001f]/.test(value.project_name)) {
    throw new ConfigError('project_name must be a trimmed non-empty display name without control characters');
  }
  if (typeof value.project_slug !== 'string'
    || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.project_slug)
    || value.project_slug.length > 214) {
    throw new ConfigError('project_slug must be a lowercase hyphenated slug');
  }
  const stacks = uniqueStringArray(value.stacks, 'stacks', STACKS, { nonempty: true });
  if (stacks.includes('generic') && stacks.length > 1) {
    throw new ConfigError('generic cannot be combined with another stack');
  }
  const integrations = uniqueStringArray(
    value.enabled_integrations,
    'enabled_integrations',
    INTEGRATIONS,
  );

  const extras = Object.fromEntries(Object.keys(value)
    .filter((key) => !knownFields.has(key))
    .sort()
    .map((key) => [key, value[key]]));
  return {
    schema_version: 1,
    project_name: value.project_name,
    project_slug: value.project_slug,
    stacks,
    enabled_integrations: integrations,
    ...extras,
  };
}

export function configPath(root) {
  return join(root, '.trellis', 'config.json');
}

function assertSafeConfigPath(root) {
  const directory = join(root, '.trellis');
  const path = configPath(root);
  if (existsSync(directory) && lstatSync(directory).isSymbolicLink()) {
    throw new ConfigError('.trellis must not be a symbolic link');
  }
  if (existsSync(path) && lstatSync(path).isSymbolicLink()) {
    throw new ConfigError('.trellis/config.json must not be a symbolic link');
  }
}

export function readProjectConfig(root) {
  const path = configPath(root);
  assertSafeConfigPath(root);
  if (!existsSync(path)) throw new ConfigError('missing .trellis/config.json; run trellis init');
  let value;
  try {
    value = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new ConfigError(`config is not valid JSON: ${error.message}`);
  }
  return validateConfig(value);
}

export function writeProjectConfig(root, value) {
  const path = configPath(root);
  assertSafeConfigPath(root);
  const config = validateConfig(value);
  const temporary = join(dirname(path), `.config.json.tmp-${process.pid}-${Date.now()}`);
  const mode = existsSync(path) ? statSync(path).mode & 0o777 : 0o644;
  let descriptor;
  try {
    descriptor = openSync(temporary, 'wx', mode);
    writeFileSync(descriptor, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    renameSync(temporary, path);
  } catch (error) {
    if (descriptor !== undefined) closeSync(descriptor);
    if (existsSync(temporary)) unlinkSync(temporary);
    throw error;
  }
  return config;
}
