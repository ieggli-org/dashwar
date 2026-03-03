import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { events } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 min
const cache: Map<string, { text: string; at: number }> = new Map();

function getCacheKey(category: string, locale: string): string {
  return `${category}:${locale}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') ?? 'market';
    const locale = searchParams.get('locale') ?? 'en';
    const validCategories = ['market', 'transport', 'investments'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const key = getCacheKey(category, locale);
    const cached = cache.get(key);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return NextResponse.json({ analysis: cached.text, cached: true });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const fallback = getFallbackAnalysis(category, locale);
      return NextResponse.json({ analysis: fallback, cached: false });
    }

    const db = getDb();
    const recent = await db
      .select({ title: events.title, eventType: events.eventType, occurredAt: events.occurredAt, actors: events.actors })
      .from(events)
      .orderBy(desc(events.occurredAt))
      .limit(25);
    const summary = recent
      .map((e) => `- ${e.title} (${e.eventType}, ${new Date(e.occurredAt).toISOString().slice(0, 10)})`)
      .join('\n');

    const prompt = getPrompt(category, summary, locale);
    const analysis = await fetchOpenAIAnalysis(apiKey, prompt);
    if (analysis) {
      cache.set(key, { text: analysis, at: Date.now() });
      return NextResponse.json({ analysis, cached: false });
    }

    const fallback = getFallbackAnalysis(category, locale);
    return NextResponse.json({ analysis: fallback, cached: false });
  } catch (e) {
    console.error('Impact analysis failed', e);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}

function getPrompt(category: string, eventsSummary: string, locale: string): string {
  const lang = locale === 'pt' ? 'Portuguese' : locale === 'es' ? 'Spanish' : 'English';
  const focus =
    category === 'market'
      ? 'financial markets, commodities, currencies, and stock indices'
      : category === 'transport'
        ? 'maritime and air transport, supply chains, shipping routes, and logistics'
        : 'foreign direct investment, sovereign funds, and sector-specific investments';
  return `You are an objective analyst. Based on the following recent conflict-related events, write a short, factual analysis (2–4 paragraphs) on probable impacts in: ${focus}. Use ${lang}. Be neutral and cite only the event summary. Do not speculate beyond what the events suggest.\n\nEvents:\n${eventsSummary}`;
}

async function fetchOpenAIAnalysis(apiKey: string, prompt: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    return typeof content === 'string' ? content.trim() : null;
  } catch (e) {
    console.error('OpenAI request failed', e);
    return null;
  }
}

function getFallbackAnalysis(category: string, locale: string): string {
  const en: Record<string, string> = {
    market:
      'Recent events point to elevated volatility in oil and safe-haven assets. Escalation tends to lift energy prices and pressure regional equity indices. Currency moves in affected regions may widen. No forward-looking guarantee; this is a summary of typical linkages, not a forecast.',
    transport:
      'Maritime and air routes in the region face rerouting and insurance adjustments when tensions rise. Supply chains with exposure to the Eastern Mediterranean and Gulf may see delays and higher costs. Objective monitoring of official advisories and shipping notices is recommended.',
    investments:
      'Sector-specific and geographic exposure drive investment impact. Defence and energy sectors often react to conflict headlines; regional FDI and sovereign flows can be delayed or repriced. Diversification and adherence to risk frameworks remain standard mitigants.',
  };
  const pt: Record<string, string> = {
    market:
      'Os eventos recentes sugerem maior volatilidade em petróleo e ativos refúgio. Escalações tendem a pressionar preços de energia e índices regionais. Este texto é um resumo de ligações típicas, não uma previsão.',
    transport:
      'Rotas marítimas e aéreas na região podem sofrer desvios e ajustes de seguro. Cadeias de abastecimento com exposição ao Mediterrâneo Oriental e ao Golfo podem registar atrasos e custos mais elevados.',
    investments:
      'O impacto nos investimentos depende da exposição setorial e geográfica. Sectores de defesa e energia reagem frequentemente a notícias de conflito; fluxos de IED e soberanos na região podem ser adiados ou repreciados.',
  };
  const es: Record<string, string> = {
    market:
      'Los eventos recientes apuntan a mayor volatilidad en petróleo y activos refugio. Las escaladas suelen presionar precios energéticos e índices regionales. Este texto es un resumen de vínculos típicos, no una previsión.',
    transport:
      'Las rutas marítimas y aéreas en la región pueden sufrir desvíos y ajustes de seguros. Las cadenas de suministro con exposición al Mediterráneo Oriental y al Golfo pueden ver retrasos y mayores costes.',
    investments:
      'El impacto en inversiones depende de la exposición sectorial y geográfica. Los sectores de defensa y energía suelen reaccionar a noticias del conflicto; los flujos de IED y soberanos en la región pueden retrasarse o repreciarse.',
  };
  const m = locale === 'pt' ? pt : locale === 'es' ? es : en;
  return m[category] ?? m.market;
}
