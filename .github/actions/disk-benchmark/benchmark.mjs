// Diagnostic: is the template harness paying for the wrong disk?
//
// On GitHub-hosted Windows runners the workspace, RUNNER_TEMP and the pnpm store
// all live on D:, but `os.tmpdir()` resolves to C:\Users\...\AppData\Local\Temp —
// and `prepareActor` in test/templates.test.js installs every template under
// `os.tmpdir()`. If D: is materially faster at creating many small files, moving
// the harness there is a real fix; if the two match, NTFS per-file cost is the
// whole story and only re-sharding or a bigger timeout will help.
//
// Two workloads, because they answer different questions:
//   - many small files, nested (a node_modules-shaped tree) -> per-file cost
//   - one big sequential file                               -> raw bandwidth
// Same work on both paths, so the two columns are directly comparable.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DIRS = Number(process.env.BENCH_DIRS ?? 1000);
const FILES_PER_DIR = Number(process.env.BENCH_FILES_PER_DIR ?? 10);
const FILE_BYTES = Number(process.env.BENCH_FILE_BYTES ?? 1024);
const BULK_MB = Number(process.env.BENCH_BULK_MB ?? 64);

const smallPayload = Buffer.alloc(FILE_BYTES, 0x61);
const bulkChunk = Buffer.alloc(1024 * 1024, 0x62);

const time = (fn) => {
    const t0 = process.hrtime.bigint();
    fn();
    return Number(process.hrtime.bigint() - t0) / 1e9;
};

const benchmark = (label, root) => {
    const base = fs.mkdtempSync(path.join(root, 'disk-bench-'));
    try {
        const create = time(() => {
            for (let d = 0; d < DIRS; d++) {
                const dir = path.join(base, `pkg-${d}`, 'lib');
                fs.mkdirSync(dir, { recursive: true });
                for (let f = 0; f < FILES_PER_DIR; f++) {
                    fs.writeFileSync(path.join(dir, `mod-${f}.js`), smallPayload);
                }
            }
        });

        // Metadata reads matter too: npm and jest walk these trees repeatedly.
        // Stat every entry, not just directories — that is what a resolver does.
        let seen = 0;
        const walk = time(() => {
            const stack = [base];
            while (stack.length) {
                const dir = stack.pop();
                for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
                    const full = path.join(dir, e.name);
                    fs.statSync(full);
                    seen++;
                    if (e.isDirectory()) stack.push(full);
                }
            }
        });

        const bulk = time(() => {
            const fd = fs.openSync(path.join(base, 'bulk.bin'), 'w');
            for (let i = 0; i < BULK_MB; i++) fs.writeSync(fd, bulkChunk);
            fs.fsyncSync(fd);
            fs.closeSync(fd);
        });

        const remove = time(() => fs.rmSync(base, { recursive: true, force: true }));

        const files = DIRS * FILES_PER_DIR;
        return {
            label,
            root,
            create: create.toFixed(2),
            filesPerSec: Math.round(files / create),
            walk: walk.toFixed(2),
            statsPerSec: Math.round(seen / walk),
            bulk: bulk.toFixed(2),
            bulkMBps: Math.round(BULK_MB / bulk),
            remove: remove.toFixed(2),
        };
    } finally {
        fs.rmSync(base, { recursive: true, force: true });
    }
};

// os.tmpdir() is what the harness actually uses; RUNNER_TEMP is the candidate.
// On Linux they are usually the same disk, which makes that run a useful control.
const targets = [
    ['os.tmpdir()', os.tmpdir()],
    ['RUNNER_TEMP', process.env.RUNNER_TEMP],
].filter(([, p]) => p && fs.existsSync(p));

console.log(`platform=${process.platform}  files=${DIRS * FILES_PER_DIR} x ${FILE_BYTES}B  bulk=${BULK_MB}MB\n`);

const rows = [];
for (const [label, root] of targets) {
    try {
        rows.push(benchmark(label, root));
    } catch (err) {
        console.log(`${label} (${root}): FAILED — ${err.message}`);
    }
}

const pad = (s, n) => String(s).padEnd(n);
// Keep the table readable when a temp path is long.
const short = (p) => (p.length <= 42 ? p : `...${p.slice(-39)}`);
console.log(
    `${pad('target', 14)}${pad('path', 44)}${pad('create s', 10)}${pad('files/s', 9)}${pad('walk s', 8)}${pad('stats/s', 9)}${pad('bulk MB/s', 11)}rm s`,
);
for (const r of rows) {
    console.log(
        `${pad(r.label, 14)}${pad(short(r.root), 44)}${pad(r.create, 10)}${pad(r.filesPerSec, 9)}${pad(r.walk, 8)}${pad(r.statsPerSec, 9)}${pad(r.bulkMBps, 11)}${r.remove}`,
    );
}

if (rows.length === 2) {
    const [a, b] = rows;
    const ratio = (x, y) => (Number(x) / Number(y)).toFixed(2);
    console.log(
        `\nsmall-file create: ${a.label} is ${ratio(a.create, b.create)}x the time of ${b.label}` +
            `  |  bulk write: ${ratio(a.bulk, b.bulk)}x`,
    );
}
