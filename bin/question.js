import * as readline from 'node:readline';

export async function question(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) =>
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer);
    })
  );
}
