const { spawnSync } = require('child_process');

process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} --openssl-legacy-provider`.trim();

const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const args = ['webpack', '--mode', 'production', '--module-bind', 'js=babel-loader'];

const result = spawnSync(cmd, args, {
  stdio: 'inherit',
  shell: true,
  env: process.env
});

process.exit(result.status || 0);
