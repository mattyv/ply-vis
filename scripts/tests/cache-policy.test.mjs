import assert from 'node:assert/strict';
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = new URL('../../', import.meta.url);
const gradlewUrl = new URL('packages/jetbrains/gradlew', root);
const gradlewBatUrl = new URL('packages/jetbrains/gradlew.bat', root);

async function runWrapper(environment = {}) {
  const fixture = await mkdtemp(join(tmpdir(), 'ply-vis-cache-policy-'));
  const java = join(fixture, 'java');
  await writeFile(java, '#!/bin/sh\nprintf "%s\\n" "$GRADLE_USER_HOME"\n');
  await chmod(java, 0o755);

  try {
    const env = {
      PATH: `${fixture}${delimiter}/usr/bin:/bin`,
      HOME: join(fixture, 'home'),
      ...environment,
    };
    delete env.JAVA_HOME;
    const result = spawnSync(fileURLToPath(gradlewUrl), ['--version'], { env, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
}

test('Gradle wrapper keeps its default user home outside the checkout', async () => {
  const value = await runWrapper();
  assert.match(value, /\/\.cache\/ply-vis\/gradle$/);
  assert.doesNotMatch(value, /packages\/jetbrains/);
});

test('Gradle wrapper honors cache-root and Gradle user-home overrides', async () => {
  assert.equal(
    await runWrapper({ PLY_VIS_CACHE_HOME: '/stable/ply-cache' }),
    '/stable/ply-cache/gradle',
  );
  assert.equal(
    await runWrapper({ GRADLE_USER_HOME: '/custom/gradle-home', PLY_VIS_CACHE_HOME: '/ignored' }),
    '/custom/gradle-home',
  );
});

test('Windows wrapper and IntelliJ Platform cache use the same external policy', async () => {
  const [gradlew, gradlewBat] = await Promise.all([
    readFile(gradlewUrl, 'utf8'),
    readFile(gradlewBatUrl, 'utf8'),
  ]);

  assert.match(gradlew, /org\.jetbrains\.intellij\.platform\.intellijPlatformCache/);
  assert.match(gradlew, /intellij-platform/);
  assert.match(gradlewBat, /PLY_VIS_CACHE_HOME/);
  assert.match(gradlewBat, /LOCALAPPDATA/);
  assert.match(gradlewBat, /org\.jetbrains\.intellij\.platform\.intellijPlatformCache/);
  assert.match(gradlewBat, /intellij-platform/);
});
