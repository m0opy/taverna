import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

const bash = process.platform === 'win32' ? 'C:\\Program Files\\Git\\bin\\bash.exe' : 'bash';
const result = spawnSync(bash, ['scripts/deploy/bootstrap-production', '--repo', 'invalid'], {
  cwd: process.cwd(),
  encoding: 'utf8',
});

assert.equal(result.status, 64, result.stderr);
assert.match(result.stderr, /Usage:/);

const sshRepositoryResult = spawnSync(bash, [
  'scripts/deploy/bootstrap-production',
  '--repo',
  'git@github.com:taverna-hub-team/taverna.git',
  '--app-origin',
  'http://92.118.114.232',
  '--actions-public-key',
  'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIF9FNxkzHnk9LxWLR5WcHcp5ONgSGrBfbT3zxgSW4I5s taverna-vps-readonly',
], {
  cwd: process.cwd(),
  encoding: 'utf8',
});

assert.equal(sshRepositoryResult.status, 64, sshRepositoryResult.stderr);
assert.match(sshRepositoryResult.stderr, /https:\/\/github\.com/);
