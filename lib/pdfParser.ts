export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Dynamic import avoids Next.js build-time issues with pdf-parse
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse/lib/pdf-parse.js');
  const data = await pdfParse(buffer);
  return data.text as string;
}

/**
 * Split text into overlapping chunks for better RAG retrieval.
 * chunkSize and overlap are measured in words.
 */
export function chunkText(
  text: string,
  chunkSize = 500,
  overlap = 50
): string[] {
  // Normalise whitespace
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const words = cleaned.split(' ').filter((w) => w.length > 0);
  const chunks: string[] = [];

  let i = 0;
  while (i < words.length) {
    const slice = words.slice(i, i + chunkSize).join(' ');
    if (slice.trim().length > 100) {
      chunks.push(slice);
    }
    i += chunkSize - overlap;
    if (i + overlap >= words.length) break;
  }

  // Capture the last remaining words
  const tail = words.slice(i).join(' ');
  if (tail.trim().length > 100) {
    chunks.push(tail);
  }

  return chunks;
}
