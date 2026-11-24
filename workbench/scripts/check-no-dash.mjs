// Fail the build when an em dash, en dash or middle dot can reach a visitor.
// Rule: Art, 2026-10-11 (use only "-" and "|"). Runs after vite build (see package.json).
//
// Three reads:
//   1. everything in dist that is served as it is (tool pages, juice.js/ts, readme, css): comments count.
//   2. our own source (workbench/src, starter/src): comments never ship, so only strings, templates and JSX count.
//   3. the Vite bundle (dist/assets/*.js): our part is already covered by 2, so what is left is library
//      code. That is printed as a warning and never fails the build.
// The characters are written as escapes below so this file stays clean itself.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const NAMES = { '\u00b7': 'U+00B7 middle dot', '\u2014': 'U+2014 em dash', '\u2013': 'U+2013 en dash' };

const RULES = [
  { re: /[\u00b7\u2014\u2013]/g, label: (m) => NAMES[m] },
  { re: /&(?:middot|mdash|ndash|#0*(?:183|8212|8211)|#x0*(?:b7|2014|2013));/gi, label: (m) => `html entity ${m}` },
  { re: /\\u(?:00b7|2014|2013)|\\u\{0*(?:b7|2014|2013)\}|\\xb7/gi, label: (m) => `js escape ${m}` },
  // css escape: "\00b7", "\2014", "\2013"; the short "\b7" form only in .css (in js it can be a regex)
  { re: /\\0+(?:b7|2014|2013)(?![0-9a-f])|\\(?:2014|2013)(?![0-9a-f])/gi, label: (m) => `css escape ${m}` },
  { re: /\\b7(?![0-9a-f])/gi, label: (m) => `css escape ${m}`, only: ['.css'] },
];

const BINARY = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico', '.woff', '.woff2', '.ttf', '.otf', '.mp4', '.mp3', '.pdf', '.zip', '.gz']);
const SCRIPT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);

function* walk(p) {
  if (statSync(p).isDirectory()) {
    for (const name of readdirSync(p).sort()) yield* walk(join(p, name));
  } else {
    yield p;
  }
}

function* textFiles(roots) {
  for (const root of roots) {
    for (const file of walk(root)) {
      if (BINARY.has(extname(file).toLowerCase())) continue;
      const buf = readFileSync(file);
      if (!buf.includes(0)) yield { file, body: buf.toString('utf8') };
    }
  }
}

function findIn(file, body, from = 0, to = body.length) {
  const ext = extname(file).toLowerCase();
  const found = [];
  for (const rule of RULES) {
    if (rule.only && !rule.only.includes(ext)) continue;
    for (const m of body.slice(from, to).matchAll(rule.re)) {
      const at = from + m.index;
      const start = body.lastIndexOf('\n', at - 1) + 1;
      const end = body.indexOf('\n', at);
      found.push({
        file,
        line: body.slice(0, at).split('\n').length,
        col: at - start + 1,
        what: rule.label(m[0]),
        text: body.slice(start, end < 0 ? undefined : end),
      });
    }
  }
  return found.sort((a, b) => a.line - b.line || a.col - b.col);
}

/** Every hit in files that are served as they are. */
export function scan(roots) {
  return [...textFiles(roots)].flatMap(({ file, body }) => findIn(file, body));
}

/** Every hit in our own source, without the comments. */
export function scanSource(roots) {
  const found = [];
  for (const { file, body } of textFiles(roots)) {
    if (extname(file) === '.css') continue; // the built css in dist is read instead
    if (!SCRIPT.has(extname(file))) {
      found.push(...findIn(file, body));
      continue;
    }
    // .ts parsed as ts, so a "<T>" cast is not read as JSX
    const source = ts.createSourceFile(file, body, ts.ScriptTarget.Latest, true);
    const visit = (node) => {
      if (ts.isJSDoc(node)) return;
      // leaf nodes are the code itself; getStart() skips the comments in front of them
      if (node.getChildCount(source) === 0) found.push(...findIn(file, body, node.getStart(source), node.end));
      else node.getChildren(source).forEach(visit);
    };
    visit(source);
  }
  return found;
}

/** What the build command checks. `failures` stop the build, `bundle` is for the report. */
export function checkBuild({ dist, sources }) {
  const isBundle = (f) => /^assets[\\/][^\\/]+\.js$/.test(relative(dist, f.file));
  const served = scan([dist]);
  return {
    failures: [...scanSource(sources), ...served.filter((f) => !isBundle(f))],
    bundle: served.filter(isBundle),
  };
}

const print = (log, f) => {
  const snippet = f.text.slice(Math.max(0, f.col - 41), f.col + 40).trim();
  log(`${relative(process.cwd(), f.file)}:${f.line}:${f.col}  ${f.what}  | ${snippet}`);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const here = (p) => fileURLToPath(new URL(p, import.meta.url));
  let result;
  try {
    result = checkBuild({
      dist: here('../dist'),
      sources: [here('../src'), here('../../starter/src'), here('../../starter/index.html')],
    });
  } catch (err) {
    console.error(`check-no-dash: cannot scan (${err.message}). Build first.`);
    process.exit(2);
  }
  const { failures, bundle } = result;
  failures.forEach((f) => print(console.error, f));
  if (failures.length) {
    console.error(
      `\ncheck-no-dash: FAIL, ${failures.length} hit(s) in ${new Set(failures.map((f) => f.file)).size} file(s)` +
        ` (${bundle.length} in the bundle). Use "-" or "|" only.`,
    );
    process.exit(1);
  }
  bundle.forEach((f) => print(console.warn, f));
  if (bundle.length) console.warn(`check-no-dash: WARNING, ${bundle.length} in library code in the bundle (not ours, build goes on).`);
  console.log('check-no-dash: OK');
}
