#!/usr/bin/env node
/**
 * Background update checker script
 * Spawned by main CLI to fetch version info without blocking
 */

import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_DIR = join(homedir(), '.antikit');
const UPDATE_CHECK_FILE = join(CONFIG_DIR, 'update-check.json');

const packageName = process.argv[2];

if (!packageName) {
  process.exit(1);
}

async function fetchAndCache() {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) process.exit(1);

    const data = await response.json();

    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }

    writeFileSync(
      UPDATE_CHECK_FILE,
      JSON.stringify(
        {
          latestVersion: data.version,
          checkedAt: Date.now()
        },
        null,
        2
      )
    );
  } catch {
    process.exit(1);
  }
}

fetchAndCache();
