import fs from 'fs';
import path from 'path';
import os from 'os';

function isKVConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export async function storageGet<T>(key: string): Promise<T | null> {
  if (isKVConfigured()) {
    const { kv } = await import('@vercel/kv');
    return kv.get<T>(key);
  }
  const filePath = path.join(os.tmpdir(), `hr-chatbot-${key}.json`);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
    }
  } catch { /* ignore */ }
  return null;
}

export async function storageSet(key: string, value: unknown): Promise<void> {
  if (isKVConfigured()) {
    const { kv } = await import('@vercel/kv');
    await kv.set(key, value);
    return;
  }
  const filePath = path.join(os.tmpdir(), `hr-chatbot-${key}.json`);
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}
