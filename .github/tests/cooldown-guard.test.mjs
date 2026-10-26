import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = fileURLToPath(new URL('../../', import.meta.url))
const workflow = readFileSync(join(root, '.github/workflows/pr-checks.yml'), 'utf8')
// Execute the production run block, never a second implementation of its policy.
// Fail closed if the job, step, or literal-block indentation changes.
const job = workflow.split('  check-cooldown-excludes:\n')[1]?.split('\n  tests:')[0]
const block = job?.match(
  /      - name: minimumReleaseAge[^\n]*\n        run: \|\n((?:          [^\n]*\n|\n)+)/
)?.[1]
assert.ok(block, 'find the actual cooldown guard in the required CI job')
const guard = block.replace(/^          /gm, '')
const packageManager = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).packageManager
const pinnedVersion = packageManager.match(/^pnpm@([^+]+)/)[1]
const resolved = spawnSync('bash', ['-c', 'command -v pnpm'], { encoding: 'utf8' })
assert.equal(resolved.status, 0, 'pnpm must already be available; tests do not install tools')
// A caller using a version-manager shim can name an already-installed binary.
const pnpm = process.env.COOLDOWN_TEST_PNPM || resolved.stdout.trim()
const base = 'minimumReleaseAge: 4320\nminimumReleaseAgeExclude: ["@rvoh/*"]\n'

function run({ yaml = base, npmrc = '', version, answers, configFailure = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'dream-cooldown-'))
  try {
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ private: true, packageManager }))
    if (yaml !== null) writeFileSync(join(dir, 'pnpm-workspace.yaml'), yaml)
    writeFileSync(join(dir, '.npmrc'), npmrc)
    const env = {
      PATH: `${dirname(pnpm)}:${process.env.PATH}`,
      HOME: process.env.HOME,
      XDG_CONFIG_HOME: dir,
      CI: 'true',
      COREPACK_ENABLE_NETWORK: '0',
      npm_config_offline: 'true',
      npm_config_userconfig: join(dir, '.npmrc'),
      npm_config_update_notifier: 'false',
    }
    const calls = join(dir, 'config-called')
    if (version !== undefined || answers || configFailure) {
      const bin = join(dir, 'bin')
      mkdirSync(bin)
      writeFileSync(
        join(bin, 'pnpm'),
        `#!/usr/bin/env node
const { spawnSync } = require('node:child_process')
const { writeFileSync } = require('node:fs')
const args = process.argv.slice(2)
const version = ${JSON.stringify(version ?? null)}
const answers = ${JSON.stringify(answers ?? null)}
if (args[0] === '--version' && version !== null) { console.log(version); process.exit(0) }
if (args[0] === 'config') {
  writeFileSync(${JSON.stringify(calls)}, 'called')
  if (${JSON.stringify(configFailure)}) process.exit(1)
  if (answers) { process.stdout.write(answers[args[2]] ?? 'null'); process.exit(0) }
}
const result = spawnSync(${JSON.stringify(pnpm)}, args, { stdio: 'inherit' })
process.exit(result.status ?? 1)
`,
        { mode: 0o755 }
      )
      env.PATH = `${bin}:${env.PATH}`
    }
    const result = spawnSync('bash', ['-eo', 'pipefail', '-c', guard], {
      cwd: dir,
      env,
      encoding: 'utf8',
      timeout: 30000,
    })
    assert.ifError(result.error)
    return { status: result.status, output: result.stdout + result.stderr, configCalled: existsSync(calls) }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

function accepts(options) {
  const result = run(options)
  assert.equal(result.status, 0, result.output)
}
function rejects(options, diagnostic) {
  const result = run(options)
  assert.notEqual(result.status, 0, 'production guard incorrectly accepted fixture')
  assert.match(result.output, diagnostic)
  return result
}

test('real pinned pnpm is used without downloading or installing dependencies', () => {
  const result = spawnSync(pnpm, ['--version'], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, COREPACK_ENABLE_NETWORK: '0', npm_config_offline: 'true' },
  })
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout.trim(), pinnedVersion)
})

test('current repository policy passes the actual guard', () => {
  accepts({ yaml: readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8') })
})

for (const age of ['1', '4319', '0', '-1', '1.5', 'null', 'bananas']) {
  test(`rejects real pnpm effective minimumReleaseAge ${age}`, () => {
    rejects({ yaml: `minimumReleaseAge: ${age}\n` }, /minimumReleaseAge|could not load/)
  })
}
test('rejects missing release age', () => rejects({ yaml: 'packages: []\n' }, /minimumReleaseAge/))
for (const age of [4320, 10080]) {
  test(`accepts real pnpm effective minimumReleaseAge ${age}`, () =>
    accepts({ yaml: `minimumReleaseAge: ${age}\n` }))
}
for (const value of ['true', '0', '[]', '{}']) {
  test(`rejects real pnpm effective trustLockfile ${value}`, () => {
    rejects({ yaml: `${base}trustLockfile: ${value}\n` }, /trustLockfile|could not load/)
  })
}
for (const value of ['false', 'null']) {
  test(`accepts real pnpm effective trustLockfile ${value}`, () =>
    accepts({ yaml: `${base}trustLockfile: ${value}\n` }))
}
test('accepts unset trustLockfile', () => accepts())
test('uses pnpm normalization for quoted integer/boolean settings', () =>
  accepts({ yaml: 'minimumReleaseAge: "4320"\ntrustLockfile: "false"\n' }))
for (const [key, value] of [
  ['minimumReleaseAge', '"4320"'],
  ['trustLockfile', '"false"'],
]) {
  test(`rejects unexpected effective JSON type for ${key}`, () =>
    rejects(
      {
        answers: {
          minimumReleaseAge: '4320',
          minimumReleaseAgeExclude: '["@rvoh/*"]',
          trustLockfile: 'null',
          [key]: value,
        },
      },
      new RegExp(key)
    ))
}

for (const version of [
  '10.15.1',
  '11.3.0',
  '11.99.0',
  '12.14.0-rc.1',
  '13.0.0-beta.1',
  '12',
  'v12.14.0',
  'banana',
  '',
  '012.14.0',
  '12.01.0',
  '12.14.0+',
  '12.14.0\n13.0.0',
]) {
  test(`rejects unsupported or malformed running pnpm ${JSON.stringify(version)} before config reads`, () => {
    const result = rejects({ version }, /pnpm.*12|stable.*pnpm/i)
    assert.equal(result.configCalled, false, 'unsupported pnpm must not read config')
  })
}
for (const version of ['12.0.0', '12.14.0', '12.99.1', '13.0.0', '12.14.0+build.1']) {
  test(`accepts supported stable pnpm ${version} with real config parsing`, () => accepts({ version }))
}

for (const yaml of [
  '"minimumReleaseAge": 4320\n"minimumReleaseAgeExclude": ["@rvoh/*"]\n',
  'minimumReleaseAge: 4320\nfirstParty: &firstParty ["@rvoh/*"]\nminimumReleaseAgeExclude: *firstParty\n',
  '{"minimumReleaseAge": 4320, "minimumReleaseAgeExclude": ["@rvoh/*"], "trustLockfile": false}\n',
  'minimumReleaseAge: 4320\nminimumReleaseAgeExclude: null\n',
]) {
  test(`preserves pnpm-native YAML syntax ${JSON.stringify(yaml)}`, () => accepts({ yaml }))
}
for (const exclude of ['["lodash"]', '"lodash"', '["@rvoh/*", 7]']) {
  test(`rejects third-party or nonstring exclusions ${exclude}`, () => {
    rejects(
      { yaml: `minimumReleaseAge: 4320\nminimumReleaseAgeExclude: ${exclude}\n` },
      /Non-@rvoh|could not load|could not determine running pnpm/
    )
  })
}
for (const key of [
  'minimumReleaseAge',
  'minimum-release-age',
  'minimum_release_age',
  '"minimumReleaseAgeExclude"',
  "'minimum-release-age-exclude'",
]) {
  test(`rejects stale npmrc setting ${key}`, () => rejects({ npmrc: `${key}=4320\n` }, /\.npmrc are ignored/))
}
test('preserves first-party scalar config responses', () =>
  accepts({
    answers: { minimumReleaseAge: '4320', minimumReleaseAgeExclude: '"@rvoh/dream"', trustLockfile: 'null' },
  }))
test('rejects missing workspace', () => rejects({ yaml: null }, /pnpm-workspace.yaml is missing/))
test('rejects duplicate YAML keys through pnpm parser', () =>
  rejects({ yaml: `${base}minimumReleaseAge: 10080\n` }, /could not load|could not determine running pnpm/))
test('rejects malformed YAML through pnpm parser', () =>
  rejects({ yaml: 'minimumReleaseAge: [\n' }, /could not load|could not determine running pnpm/))
test('rejects config command failure', () => rejects({ configFailure: true }, /could not load/))
for (const key of ['minimumReleaseAge', 'minimumReleaseAgeExclude', 'trustLockfile']) {
  test(`rejects malformed JSON from config get ${key}`, () =>
    rejects(
      {
        answers: {
          minimumReleaseAge: '4320',
          minimumReleaseAgeExclude: '["@rvoh/*"]',
          trustLockfile: 'null',
          [key]: '{invalid',
        },
      },
      /could not read/
    ))
}
