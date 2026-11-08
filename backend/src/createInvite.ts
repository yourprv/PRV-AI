import { createHash, randomInt } from 'node:crypto';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = [
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env.local'),
  path.resolve(__dirname, '../../app/.env.local'),
].find((candidate) => existsSync(candidate));
dotenv.config({ path: envPath });

const ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

// randomInt uses Node's cryptographically secure random source and avoids the
// modulo bias that can result from mapping random bytes with `% 36`.
function createInviteCode(): string {
  const chars = Array.from({ length: 16 }, () => ALPHANUMERIC[randomInt(ALPHANUMERIC.length)]);
  return [0, 4, 8, 12].map((start) => chars.slice(start, start + 4).join('')).join('-');
}

function readOptions(args: string[]) {
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    if (!key.startsWith('--') || !args[index + 1] || args[index + 1].startsWith('--')) {
      throw new Error(`Expected a value after ${key}.`);
    }
    values.set(key.slice(2), args[index + 1]);
    index += 1;
  }

  const tier = values.get('tier');
  if (tier !== 'plus' && tier !== 'pro') throw new Error('--tier must be plus or pro.');
  const maxUses = Number(values.get('max-uses') || '1');
  if (!Number.isSafeInteger(maxUses) || maxUses < 1) throw new Error('--max-uses must be a positive integer.');

  const expiresAt = values.get('expires-at');
  if (expiresAt && !Number.isFinite(Date.parse(expiresAt))) {
    throw new Error('--expires-at must be a valid ISO date/time, such as 2027-01-01T00:00:00Z.');
  }
  if (expiresAt && Date.parse(expiresAt) <= Date.now()) throw new Error('--expires-at must be in the future.');
  return { tier, maxUses, expiresAt: expiresAt || null } as const;
}

async function main() {
  try {
    const options = readOptions(process.argv.slice(2));
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the backend environment.');
    }

    const code = createInviteCode();
    const codeHash = createHash('sha256').update(code, 'ascii').digest('hex');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase.from('invite_codes').insert({
      code_hash: codeHash,
      tier: options.tier,
      max_uses: options.maxUses,
      expires_at: options.expiresAt,
      is_active: true,
    });
    if (error) throw new Error(`Could not store invite code: ${error.message}`);

    // This is the only time the plaintext value is shown. Store it securely.
    console.log(`Invite code (${options.tier}, ${options.maxUses} use(s)${options.expiresAt ? `, expires ${options.expiresAt}` : ''}):`);
    console.log(code);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    console.error('Usage: npm run invite:create -- --tier plus|pro [--max-uses 1] [--expires-at ISO_DATE]');
    process.exitCode = 1;
  }
}

void main();
