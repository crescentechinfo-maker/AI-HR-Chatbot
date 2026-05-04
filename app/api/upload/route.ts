import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPDF, chunkText } from '@/lib/pdfParser';
import { addDocumentChunks, removeDocumentBySource } from '@/lib/vectorStore';

export const maxDuration = 60; // Vercel max for hobby tier

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractTextFromPDF(buffer);

    if (!text.trim()) {
      return NextResponse.json(
        { error: 'Could not extract text from PDF. Make sure it is not a scanned image.' },
        { status: 422 }
      );
    }

    const chunks = chunkText(text, 500, 50);

    // Replace any existing chunks from the same file
    await removeDocumentBySource(file.name);
    await addDocumentChunks(chunks, file.name);

    return NextResponse.json({
      success: true,
      filename: file.name,
      chunks: chunks.length,
      message: `Processed ${chunks.length} chunks from "${file.name}".`,
    });
  } catch (err) {
    console.error('Upload error:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to process PDF: ${msg}` }, { status: 500 });
  }
}
