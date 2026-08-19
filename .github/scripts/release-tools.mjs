#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const MAX_RELEASES_PER_RUN = 20;
const MAX_INPUT_LENGTH = 4096;
const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

const [, , command, ...args] = process.argv;

try {
  switch (command) {
    case 'normalize-versions':
      expectArgumentCount(command, args, 1);
      process.stdout.write(`${normalizeList(args[0], false).join('\n')}\n`);
      break;
    case 'normalize-tags':
      expectArgumentCount(command, args, 1);
      process.stdout.write(`${normalizeList(args[0], true).map((version) => `v${version}`).join('\n')}\n`);
      break;
    case 'set-version':
      expectArgumentCount(command, args, 2);
      setVersion(args[0], args[1]);
      break;
    case 'verify-version':
      expectArgumentCount(command, args, 2);
      verifyVersion(args[0], args[1]);
      break;
    default:
      throw new Error(
        'Usage: release-tools.mjs <normalize-versions|normalize-tags|set-version|verify-version> <arguments...>',
      );
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}

function expectArgumentCount(commandName, values, expected) {
  if (values.length !== expected) {
    throw new Error(`${commandName} expects ${expected} argument${expected === 1 ? '' : 's'}.`);
  }
}

function normalizeList(rawInput, allowTagPrefix) {
  if (rawInput.length === 0 || rawInput.length > MAX_INPUT_LENGTH) {
    throw new Error(`The release list must contain between 1 and ${MAX_INPUT_LENGTH} characters.`);
  }

  const rawEntries = rawInput.split(',');
  if (rawEntries.length > MAX_RELEASES_PER_RUN) {
    throw new Error(`A single workflow run may create or delete at most ${MAX_RELEASES_PER_RUN} releases.`);
  }

  const seen = new Set();
  return rawEntries.map((rawEntry, index) => {
    let version = rawEntry.trim();
    if (allowTagPrefix && version.startsWith('v')) version = version.slice(1);
    if (!version) throw new Error(`Release entry ${index + 1} is empty.`);
    validateSemver(version);
    if (seen.has(version)) throw new Error(`Duplicate release version: ${version}`);
    seen.add(version);
    return version;
  });
}

function validateSemver(version) {
  if (!SEMVER_PATTERN.test(version)) {
    throw new Error(`Invalid SemVer "${version}". Supply versions without a leading "v".`);
  }
}

function setVersion(root, version) {
  validateSemver(version);
  const paths = releasePaths(root);
  const manifest = readJson(paths.manifest, 'uapkg.json');
  const descriptor = readJson(paths.descriptor, 'UapkgDevPlaceholder.uplugin');
  assertFixtureDescriptor(descriptor);

  const manifestSource = readFileSync(paths.manifest, 'utf8');
  const descriptorSource = readFileSync(paths.descriptor, 'utf8');
  const nextManifest = replaceExactlyOnce(
    manifestSource,
    /("version"\s*:\s*")[^"]*(")/,
    version,
    'uapkg.json version',
  );
  const nextDescriptor = replaceExactlyOnce(
    descriptorSource,
    /("VersionName"\s*:\s*")[^"]*(")/,
    version,
    'UapkgDevPlaceholder.uplugin VersionName',
  );

  writeFileSync(paths.manifest, nextManifest, 'utf8');
  writeFileSync(paths.descriptor, nextDescriptor, 'utf8');
  verifyVersion(root, version);

  if (manifest.name !== 'uapkg-dev-package-placeholder') {
    throw new Error(`Unexpected package name "${String(manifest.name)}" in uapkg.json.`);
  }
}

function verifyVersion(root, expectedVersion) {
  validateSemver(expectedVersion);
  const paths = releasePaths(root);
  const manifest = readJson(paths.manifest, 'uapkg.json');
  const descriptor = readJson(paths.descriptor, 'UapkgDevPlaceholder.uplugin');
  assertFixtureDescriptor(descriptor);

  if (manifest.name !== 'uapkg-dev-package-placeholder') {
    throw new Error(`Unexpected package name "${String(manifest.name)}" in uapkg.json.`);
  }
  if (manifest.version !== expectedVersion) {
    throw new Error(`uapkg.json has version "${String(manifest.version)}"; expected "${expectedVersion}".`);
  }
  if (descriptor.VersionName !== expectedVersion) {
    throw new Error(
      `UapkgDevPlaceholder.uplugin has VersionName "${String(descriptor.VersionName)}"; expected "${expectedVersion}".`,
    );
  }
}

function releasePaths(root) {
  const resolvedRoot = resolve(root);
  return {
    manifest: resolve(resolvedRoot, 'uapkg.json'),
    descriptor: resolve(resolvedRoot, 'UapkgDevPlaceholder.uplugin'),
  };
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to read ${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function assertFixtureDescriptor(descriptor) {
  if (descriptor.Version !== 1) {
    throw new Error(
      `UapkgDevPlaceholder.uplugin Version must remain 1 for this publishing fixture; received ${String(descriptor.Version)}.`,
    );
  }
}

function replaceExactlyOnce(source, pattern, value, label) {
  const matches = source.match(new RegExp(pattern.source, 'g')) ?? [];
  if (matches.length !== 1) throw new Error(`Expected exactly one ${label} field; found ${matches.length}.`);
  return source.replace(pattern, (_match, prefix, suffix) => `${prefix}${value}${suffix}`);
}
