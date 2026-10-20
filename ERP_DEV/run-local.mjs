#!/usr/bin/env node
// Golden Hills ERP — cross-platform local backend launcher (Windows + Fedora).
// Usage: node run-local.mjs [postgres|h2] [--web] [--print]
// One command that always sets the DB + Keycloak issuer vars (lesson 2026-10-10).
// --web also starts the Vite dev server on :5173. --print shows resolved paths.

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const isWin = process.platform === 'win32';
const argv = process.argv.slice(2);
const withWeb = argv.includes('--web');
const printOnly = argv.includes('--print');
const mode = argv.find((a) => !a.startsWith('--')) ?? 'postgres';

if (mode !== 'postgres' && mode !== 'h2') {
  console.error(`Unknown mode "${mode}" — use postgres (default) or h2.`);
  process.exit(2);
}

const exists = (p) => p && existsSync(p);

function resolveJava() {
  if (process.env.JAVA_HOME) {
    const exe = join(process.env.JAVA_HOME, 'bin', isWin ? 'java.exe' : 'java');
    if (exists(exe)) return exe;
  }
  if (!isWin) {
    const base = join(homedir(), '.local', 'java');
    if (exists(base)) {
      const jdks = readdirSync(base).sort().reverse();
      for (const jdk of jdks) {
        const exe = join(base, jdk, 'bin', 'java');
        if (exists(exe)) return exe;
      }
    }
  }
  return isWin ? 'java.exe' : 'java';
}

function resolveMvn() {
  if (process.env.MAVEN_HOME) {
    const exe = join(process.env.MAVEN_HOME, 'bin', isWin ? 'mvn.cmd' : 'mvn');
    if (exists(exe)) return exe;
  }
  if (!isWin) {
    const local = join(homedir(), '.local', 'maven', 'bin', 'mvn');
    if (exists(local)) return local;
  }
  return isWin ? 'mvn.cmd' : 'mvn';
}

const javaExe = resolveJava();
const mvn = resolveMvn();
const env = { ...process.env };

if (!isWin && javaExe.startsWith('/')) {
  env.JAVA_HOME = dirname(dirname(javaExe));
  env.PATH = [join(env.JAVA_HOME, 'bin'), env.MAVEN_HOME ? join(env.MAVEN_HOME, 'bin') : '', env.PATH]
    .filter(Boolean)
    .join(delimiter);
}

if (mode === 'postgres') {
  env.DB_URL = 'jdbc:postgresql://localhost:5432/resort_erp';
  env.DB_USER = 'resort_user';
  env.DB_PASSWORD = 'change-me-locally-only';
} else {
  env.DB_URL = 'jdbc:h2:mem:local;MODE=PostgreSQL;DB_CLOSE_DELAY=-1';
  env.DB_USER = 'sa';
  env.DB_PASSWORD = '';
}
if (!env.KEYCLOAK_ISSUER_URL) {
  env.KEYCLOAK_ISSUER_URL = 'http://localhost:8081/realms/resort';
}

function run(cmd, cmdArgs, cwd) {
  const result = spawnSync(cmd, cmdArgs, { stdio: 'inherit', env, cwd, shell: isWin });
  if (result.error) {
    console.error(`Cannot run ${cmd}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const classesDir = join(here, 'services', 'erp-app', 'target', 'classes');
const mainClass = join(classesDir, 'com', 'quantumclk', 'erp', 'ErpApplication.class');
const tmpDir = join(tmpdir(), 'erp-local');
const cpFile = join(tmpDir, 'cp.txt');

if (printOnly) {
  console.log(JSON.stringify({
    mode, java: javaExe, mvn, cpFile,
    web: withWeb ? join(here, 'web') : null,
    env: {
      DB_URL: env.DB_URL, DB_USER: env.DB_USER,
      KEYCLOAK_ISSUER_URL: env.KEYCLOAK_ISSUER_URL,
    },
  }, null, 2));
  process.exit(0);
}

if (!exists(mainClass)) {
  console.log('First run: compiling backend...');
  run(mvn, ['-B', '-q', 'compile'], here);
}

mkdirSync(tmpDir, { recursive: true });
if (!exists(cpFile)) {
  console.log('First run: resolving classpath...');
  const out = isWin ? `-Dmdep.outputFile="${cpFile}"` : `-Dmdep.outputFile=${cpFile}`;
  run(mvn, ['-B', '-q', 'dependency:build-classpath', out, '-Dmdep.includeScope=test'],
    join(here, 'services', 'erp-app'));
}

const classpath = [classesDir, readFileSync(cpFile, 'utf8').trim()].join(delimiter);

try {
  const res = await fetch(`${env.KEYCLOAK_ISSUER_URL}/.well-known/openid-configuration`,
    { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(String(res.status));
} catch {
  console.warn(`WARNING: Keycloak unreachable at ${env.KEYCLOAK_ISSUER_URL} — logins will fail.`);
  const compose = join(here, 'infra', 'docker-compose.local.yml');
  console.warn(isWin
    ? `Start it: docker compose -f "${compose}" up -d keycloak`
    : `Start it: sg docker -c "docker compose -f ${compose} up -d keycloak"`);
}

console.log(`Backend on :8080 — DB=${mode} — issuer=${env.KEYCLOAK_ISSUER_URL}`);
const children = [];
const stop = (code) => {
  for (const child of children) {
    try { child.kill(); } catch { /* already gone */ }
  }
  process.exit(code ?? 0);
};

const backend = spawn(javaExe, ['-cp', classpath, 'com.quantumclk.erp.ErpApplication'],
  { stdio: 'inherit', env });
children.push(backend);
backend.on('exit', (code) => stop(code));

if (withWeb) {
  const npm = isWin ? 'npm.cmd' : 'npm';
  const web = spawn(npm, ['run', 'dev'], { stdio: 'inherit', env, cwd: join(here, 'web'), shell: isWin });
  children.push(web);
  web.on('exit', (code) => { if (code) stop(code); });
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
