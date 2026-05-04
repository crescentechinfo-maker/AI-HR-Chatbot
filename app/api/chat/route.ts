import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings';
import { searchSimilar } from '@/lib/vectorStore';
import { callOpenRouter } from '@/lib/openrouter';
import type { ChatMessage } from '@/lib/openrouter';

export const maxDuration = 60;

const HR_GUARD = `If the user's question is clearly unrelated to HR, employment, labor law, workplace policies,
or Malaysian Employment Act 1955, respond politely that you can only assist with HR-related topics
and suggest they consult the appropriate resource.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, language = 'en' } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
    }

    const settings = await getSettings();

    if (!settings.apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key is not configured. Please visit Admin → Settings.' },
        { status: 503 }
      );
    }

    const userQuery: string = messages[messages.length - 1]?.content ?? '';

    // ── RAG: retrieve relevant knowledge-base chunks ────────────────────────
    let contextBlock = '';
    if (settings.useKnowledgeBase) {
      const results = await searchSimilar(userQuery, 5);
      if (results.length > 0) {
        const snippets = results
          .map((r, i) => `[${i + 1}] (Source: ${r.chunk.source})\n${r.chunk.text}`)
          .join('\n\n');
        contextBlock = `\n\n--- Relevant HR Document Excerpts ---\n${snippets}\n--- End of Excerpts ---`;
      }
    }

    // ── Build system prompt ─────────────────────────────────────────────────
    const langInstruction =
      language === 'ms'
        ? 'Respond primarily in Bahasa Malaysia.'
        : 'Respond in English. You may use Bahasa Malaysia terms where appropriate.';

    const systemContent = [
      settings.systemPrompt,
      HR_GUARD,
      langInstruction,
      contextBlock,
    ]
      .filter(Boolean)
      .join('\n\n');

    const apiMessages: ChatMessage[] = [
      { role: 'system', content: systemContent },
      // Keep last 10 turns for context window efficiency
      ...messages.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // ── Stream response from OpenRouter ────────────────────────────────────
    const upstream = await callOpenRouter({
      apiKey: settings.apiKey,
      model: settings.model,
      messages: apiMessages,
      stream: true,
    });

    return new Response(upstream.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Chat API error:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
