const { execSync } = require('child_process');

const msg = process.argv.slice(2).join(' ').trim();

if (!msg) {
  console.error('\nUsage: npm run deploy -- "what I changed today"\n');
  process.exit(1);
}

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', cwd: __dirname });
}

function runSilent(cmd) {
  return execSync(cmd, { cwd: __dirname }).toString().trim();
}

console.log('\n→ Staging all changes...');
run('git add -A');

const staged = runSilent('git diff --cached --name-only');
if (!staged) {
  console.log('→ Nothing to commit — working tree clean.');
} else {
  console.log(`→ Committing: ${msg}`);
  run(`git commit -m ${JSON.stringify(msg)}`);
}

console.log('→ Pushing to GitHub...');
run('git push');

console.log('\n✓ Deployed.\n');
