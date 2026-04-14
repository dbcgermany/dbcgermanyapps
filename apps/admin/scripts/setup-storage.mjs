#!/usr/bin/env node
// Idempotently creates the Supabase Storage buckets used by the admin app.
//
// Usage (from monorepo root):
//   node --env-file=.vercel/.env.production.local apps/admin/scripts/setup-storage.mjs

import { createClient } from "@supabase/supabase-js";

const BUCKETS = [
  {
    name: "event-covers",
    public: true,
    fileSizeLimit: 8 * 1024 * 1024, // 8 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const service = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function ensureBucket(cfg) {
  const { data: existing } = await service.storage.getBucket(cfg.name);
  if (existing) {
    const { error } = await service.storage.updateBucket(cfg.name, {
      public: cfg.public,
      fileSizeLimit: cfg.fileSizeLimit,
      allowedMimeTypes: cfg.allowedMimeTypes,
    });
    if (error) throw error;
    console.log(`  ↺ updated ${cfg.name}`);
    return;
  }
  const { error } = await service.storage.createBucket(cfg.name, {
    public: cfg.public,
    fileSizeLimit: cfg.fileSizeLimit,
    allowedMimeTypes: cfg.allowedMimeTypes,
  });
  if (error) throw error;
  console.log(`  + created ${cfg.name}`);
}

for (const bucket of BUCKETS) {
  try {
    await ensureBucket(bucket);
  } catch (err) {
    console.error(`Failed on bucket ${bucket.name}:`, err.message ?? err);
    process.exit(1);
  }
}

console.log("\nStorage ready.");
