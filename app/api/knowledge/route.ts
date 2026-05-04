import { NextRequest, NextResponse } from 'next/server';
import {
  getChunkCount,
  getDocumentSources,
  clearVectorStore,
  removeDocumentBySource,
} from '@/lib/vectorStore';

export async function GET() {
  try {
    return NextResponse.json({
      chunks: await getChunkCount(),
      sources: await getDocumentSources(),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to read knowledge base' }, { status: 500 });
  }
}

// DELETE /api/knowledge              → clear all
// DELETE /api/knowledge?source=foo   → remove one document
export async function DELETE(req: NextRequest) {
  try {
    const source = req.nextUrl.searchParams.get('source');
    if (source) {
      await removeDocumentBySource(source);
      return NextResponse.json({ success: true, message: `Removed "${source}"` });
    }
    await clearVectorStore();
    return NextResponse.json({ success: true, message: 'Knowledge base cleared' });
  } catch {
    return NextResponse.json({ error: 'Failed to modify knowledge base' }, { status: 500 });
  }
}
