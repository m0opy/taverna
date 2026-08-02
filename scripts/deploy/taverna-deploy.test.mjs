import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

const bash = process.platform === 'win32' ? 'C:\\Program Files\\Git\\bin\\bash.exe' : 'bash';

function runDeployCommand(command) {
  return spawnSync(bash, ['scripts/deploy/taverna-deploy'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {...process.env, SSH_ORIGINAL_COMMAND: command},
  });
}

const invalidCommand = runDeployCommand('shell');
assert.equal(invalidCommand.status, 64, invalidCommand.stderr);
assert.match(invalidCommand.stderr, /expected "deploy <40-lowercase-hex-sha>"/);

const validCommandWithoutProductionEnvironment = runDeployCommand('deploy 1111111111111111111111111111111111111111');
assert.equal(validCommandWithoutProductionEnvironment.status, 78, validCommandWithoutProductionEnvironment.stderr);
assert.match(validCommandWithoutProductionEnvironment.stderr, /production environment is unavailable/);
