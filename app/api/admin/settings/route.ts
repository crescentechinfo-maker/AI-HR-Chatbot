import { NextRequest, NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/settings';
import type { AdminSettings } from '@/types';

export async function GET() {
  try {
    const settings = await getSettings();
    // Mask the API key — send only last 4 chars so the UI can show status
    const masked: AdminSettings = {
      ...settings,
      apiKey: settings.apiKey
        ? '***' + settings.apiKey.slice(-4)
        : '',
    };
    return NextResponse.json(masked);
  } catch {
    return NextResponse.json({ error: 'Failed to read settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<AdminSettings>;
    const updated = await saveSettings(body);
    return NextResponse.json({
      success: true,
      settings: {
        ...updated,
        apiKey: updated.apiKey ? '***' + updated.apiKey.slice(-4) : '',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
