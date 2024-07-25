const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
console.log('Received arguments:', args);

let backendType = 'class-based'; // default

if (args.includes('--class-based-pg')) {
	backendType = 'class-based-pg';
} else if (args.includes('--class-based')) {
	backendType = 'class-based';
}

console.log('Selected backend:', backendType);

const backendPath = path.join(__dirname, '..', 'packages', 'examples', backendType);
const frontendPath = path.join(__dirname, '..', 'packages', 'node-telescope-frontend');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const backend = spawn(npmCommand, ['run', 'dev'], { cwd: backendPath, stdio: 'inherit' });
const frontend = spawn(npmCommand, ['start'], { cwd: frontendPath, stdio: 'inherit' });

backend.on('close', code => {
	console.log(`Backend process exited with code ${code}`);
	frontend.kill();
});

frontend.on('close', code => {
	console.log(`Frontend process exited with code ${code}`);
	backend.kill();
});

process.on('SIGINT', () => {
	backend.kill();
	frontend.kill();
});
