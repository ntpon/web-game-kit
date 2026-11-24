// Tests for check-no-dash.mjs. Run: pnpm test (node:test, no extra dependency).
// The forbidden characters are written as escapes so this file stays clean itself.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scan, scanSource, checkBuild } from './check-no-dash.mjs';

const MIDDOT = '\u00b7';
const EM = '\u2014';
const EN = '\u2013';

function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), 'nodash-'));
  for (const [name, body] of Object.entries(files)) {
    const p = join(dir, name);
    mkdirSync(join(p, '..'), { recursive: true });
    writeFileSync(p, body);
  }
  return dir;
}

// --- scan: files served as they are (tool pages, helper files, css, readme)

test('clean output has no findings', () => {
  const dir = fixture({ 'index.html': '<p>a | b - c</p>\n', 'a.css': '.x{content:"|"}' });
  assert.deepEqual(scan([dir]), []);
});

test('raw characters are reported with file and line, comments included (they are served)', () => {
  const dir = fixture({
    'index.html': `<p>ok</p>\n<p>a ${MIDDOT} b</p>\n<!-- x ${EM} y -->\n<p>1${EN}2</p>\n`,
    'juice.js': `/* a ${EM} b */\n`,
    'README.md': `a ${MIDDOT} b\n`,
  });
  const found = scan([dir]);
  assert.deepEqual(found.map((f) => f.line), [1, 2, 3, 4, 1]);
});

test('html entities are reported (named, decimal, hex)', () => {
  const dir = fixture({
    'index.html': '<p>&middot;</p>\n<p>&mdash;</p>\n<p>&ndash;</p>\n<p>&#183; &#8212; &#8211;</p>\n<p>&#xB7; &#x2014; &#x2013;</p>\n',
  });
  assert.equal(scan([dir]).length, 9);
});

test('css and js escapes are reported', () => {
  const dir = fixture({
    'a.css': '.a::before{content:"\\00b7"}\n.b::before{content:"\\2014"}\n.c::before{content:"\\2013"}\n.d::before{content:"\\b7"}\n',
    'b.js': 'const s = "\\u00b7 \\u2014 \\u2013 \\u{b7} \\xb7";\n',
  });
  assert.equal(scan([dir]).length, 4 + 5);
});

test('a code sample that shows an entity as text does not fire', () => {
  const dir = fixture({ 'index.html': '<code>&amp;middot; and &amp;mdash;</code>\n' });
  assert.deepEqual(scan([dir]), []);
});

test('binary files are skipped', () => {
  const dir = fixture({ 'img.png': Buffer.from([0x89, 0x50, 0x00, 0xc2, 0xb7, 0x00]) });
  assert.deepEqual(scan([dir]), []);
});

test('a missing path is an error, not a pass', () => {
  assert.throws(() => scan([join(tmpdir(), 'nodash-does-not-exist')]));
  assert.throws(() => scanSource([join(tmpdir(), 'nodash-does-not-exist')]));
});

// --- scanSource: our own ts / tsx, where comments never ship

test('source comments do not count', () => {
  const dir = fixture({
    'a.tsx': `// a ${EM} b\n/** c ${MIDDOT} d */\nexport const A = () => <p>{/* e ${EN} f */}ok</p>; // g ${EM}\n`,
  });
  assert.deepEqual(scanSource([dir]), []);
});

test('source strings, templates and JSX are reported at the line they are on', () => {
  const dir = fixture({
    'a.tsx': [
      `const a = 'x ${EM} y';`,
      'const b = `${a} ' + MIDDOT + ' ${a} ' + EN + '`;',
      'const c = (',
      '  <p',
      `    title="t ${EM} u"`,
      '  >',
      '    first line',
      `    second ${MIDDOT} line`,
      '  </p>',
      ');',
    ].join('\n'),
  });
  assert.deepEqual(scanSource([dir]).map((f) => f.line), [1, 2, 2, 5, 8]);
});

test('source entities and escapes are reported', () => {
  const dir = fixture({
    'a.tsx': 'const a = <p>x &middot; y</p>;\nconst b = "\\u2014";\nconst c = `\\u{2013}`;\n',
  });
  assert.deepEqual(scanSource([dir]).map((f) => f.line), [1, 2, 3]);
});

test('json and html next to the source are scanned as they are', () => {
  const dir = fixture({ 'map.json': `{"name":"a ${EM} b"}\n`, 'index.html': `<title>a ${MIDDOT} b</title>` });
  assert.equal(scanSource([dir]).length, 2);
});

test('css in the source is left to the built css, where its comments are gone', () => {
  const dir = fixture({ 'styles.css': `/* a ${EM} b */\n.x{color:red}\n` });
  assert.deepEqual(scanSource([dir]), []);
});

// --- checkBuild: what the build command runs

test('our own text in the source fails and is not counted again from the bundle', () => {
  const dir = fixture({
    'src/a.ts': `export const a = 'x ${EM} y';`,
    'dist/index.html': '<p>ok</p>',
    'dist/assets/index-AbC123.js': `const a="x ${EM} y";`,
  });
  const r = checkBuild({ dist: join(dir, 'dist'), sources: [join(dir, 'src')] });
  assert.equal(r.failures.length, 1);
  assert.equal(r.failures[0].what, 'U+2014 em dash');
  assert.equal(r.bundle.length, 1);
});

test('a character only library code brings into the bundle warns but does not fail', () => {
  const dir = fixture({
    'src/a.ts': `export const a = 'ok';`,
    'dist/index.html': '<p>ok</p>',
    'dist/assets/index-AbC123.js': `const lib="${MIDDOT}";`,
  });
  const r = checkBuild({ dist: join(dir, 'dist'), sources: [join(dir, 'src')] });
  assert.deepEqual(r.failures, []);
  assert.equal(r.bundle.length, 1);
});

test('tool pages and their own scripts in dist still fail', () => {
  const dir = fixture({
    'src/a.ts': `export const a = 'ok';`,
    'dist/index.html': '<p>ok</p>',
    'dist/tools/x/juice.js': `// a ${MIDDOT} b`,
    'dist/assets/index-AbC123.css': `.a::before{content:"\\2014"}`,
  });
  const r = checkBuild({ dist: join(dir, 'dist'), sources: [join(dir, 'src')] });
  assert.equal(r.failures.length, 2);
});
