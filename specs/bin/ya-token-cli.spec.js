import { exec, execFile, spawn } from 'node:child_process';
import { resolve } from 'node:path';

// vi.mock('readline', async () => await import('../__mocks__/readline.mock.js'));

// beforeEach(() => {
//   vi.spyOn(process.stdout, 'write');
//   readline._resetMock();
// });

(async () => {
  try {
    const res = await runCmd('/usr/bin/env node --version');
    console.log(res);
  } catch (error) {
    console.log(`ERROR: ${error}`);
  }
})();

// const yaTokenCli = spawn('./bin/ya-token-cli.js', {
//   cwd: resolve('./'),
//   env: {
//     YANDEX_CLIENT_ID: '1',
//     YANDEX_CLIENT_SECRET: '2',
//     REDIRECT_URI: '3'
//   },
//   stdio: 'inherit'
// });

// yaTokenCli.on('error', console.error);
// yaTokenCli.on('exit', console.log.bind('EXIT'));
// yaTokenCli.stdout.on('data', console.log.bind('STDOUT'));

// yaTokenCli.stderr.on('data', (data) => {
//   console.error(`stderr: ${data}`);
//   resolve();
// });

// yaTokenCli.stdout.on('data', (data) => {
//   console.log(`stdout: ${data}`);
//   resolve();
// });

function runCmd(cmd) {
  return new Promise((res, rej) => {
    try {
      let output = '';
      const childProcess = spawn(cmd, { shell: true });
      childProcess.on('error', rej);
      childProcess.on('exit', (code, signal) => res({ code, signal, output }));
      childProcess.stdout.on('data', (data) => (output += data.toString()));
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });
}
