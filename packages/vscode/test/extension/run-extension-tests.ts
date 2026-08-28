import { resolve } from 'node:path';
import { runTests } from '@vscode/test-electron';

async function main(): Promise<void> {
  const extensionDevelopmentPath = resolve(__dirname, '../../..');
  const extensionTestsPath = resolve(__dirname, 'suite/index');
  const fixture = resolve(extensionDevelopmentPath, 'test/fixtures/workspace');
  await runTests({ extensionDevelopmentPath, extensionTestsPath, launchArgs: [fixture, '--disable-extensions'], extensionTestsEnv: { PLY_VSCODE_TEST: '1' } });
}
void main().catch((error) => { console.error(error); process.exitCode = 1; });
