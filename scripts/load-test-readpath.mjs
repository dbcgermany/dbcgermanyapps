// Read-only load test against the public buy-flow front pages.
// Hits /api/health, the homepage, the event listing — all of which are ISR-
// cached or hit Supabase via service-role. Does NOT touch Stripe checkout
// (would create real Sessions on the live account).
//
// Tunables at top. Default: 50 concurrent virtual users × 30 seconds → ~1500
// requests per endpoint per minute. Way below anything that would trip
// Vercel's per-request limits or Supabase pool limits.
//
// Usage:
//   node scripts/load-test-readpath.mjs
//   VUS=100 DURATION_S=60 node scripts/load-test-readpath.mjs

const VUS = parseInt(process.env.VUS ?? "50", 10);
const DURATION_S = parseInt(process.env.DURATION_S ?? "30", 10);
const BASE = "https://tickets.dbc-germany.com";

const TARGETS = [
  { path: "/api/health", weight: 3, name: "health" },
  { path: "/de", weight: 5, name: "home(de)" },
  { path: "/en", weight: 2, name: "home(en)" },
];

const totalWeight = TARGETS.reduce((s, t) => s + t.weight, 0);

function pickTarget() {
  let r = Math.random() * totalWeight;
  for (const t of TARGETS) {
    if (r < t.weight) return t;
    r -= t.weight;
  }
  return TARGETS[0];
}

const results = new Map(); // name -> { count, success, fail, totalMs, max, p95 buffer }

function record(name, ms, ok) {
  const entry = results.get(name) ?? {
    count: 0,
    success: 0,
    fail: 0,
    totalMs: 0,
    max: 0,
    samples: [],
  };
  entry.count += 1;
  if (ok) entry.success += 1;
  else entry.fail += 1;
  entry.totalMs += ms;
  if (ms > entry.max) entry.max = ms;
  if (entry.samples.length < 1000) entry.samples.push(ms);
  results.set(name, entry);
}

async function vu(deadlineMs) {
  while (Date.now() < deadlineMs) {
    const t = pickTarget();
    const start = performance.now();
    let ok = false;
    try {
      const res = await fetch(`${BASE}${t.path}`, {
        redirect: "follow",
        headers: { "user-agent": "dbc-readpath-loadtest/1.0" },
      });
      ok = res.ok;
      // Drain body so the connection releases promptly.
      await res.text();
    } catch {
      ok = false;
    }
    record(t.name, performance.now() - start, ok);
  }
}

console.log(`Starting: ${VUS} VUs × ${DURATION_S}s against ${BASE}`);
const deadline = Date.now() + DURATION_S * 1000;
const start = performance.now();
await Promise.all(Array.from({ length: VUS }, () => vu(deadline)));
const wall = (performance.now() - start) / 1000;

console.log(`\nDone in ${wall.toFixed(1)}s\n`);
console.log(
  `${"endpoint".padEnd(12)}  ${"count".padStart(6)}  ${"ok".padStart(6)}  ${"fail".padStart(5)}  ${"avg".padStart(6)}  ${"p95".padStart(6)}  ${"max".padStart(6)}  ${"rps".padStart(6)}`
);
for (const [name, r] of results) {
  const sorted = r.samples.slice().sort((a, b) => a - b);
  const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
  const avg = r.totalMs / r.count;
  const rps = r.count / wall;
  console.log(
    `${name.padEnd(12)}  ${String(r.count).padStart(6)}  ${String(r.success).padStart(6)}  ${String(r.fail).padStart(5)}  ${avg.toFixed(0).padStart(5)}ms ${p95.toFixed(0).padStart(5)}ms ${r.max.toFixed(0).padStart(5)}ms  ${rps.toFixed(1).padStart(6)}`
  );
}
