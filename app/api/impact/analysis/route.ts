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
    const validCategories = ['market', 'transport', 'investments', 'tourism_flights', 'country_impact'];
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
        : category === 'tourism_flights'
          ? 'tourism and flights: which regions and routes are impacted (e.g. Eastern Mediterranean, Gulf, Israel, Iran, neighbouring countries), flight cancellations or rerouting, travel advisories, and impact on tourism in affected and nearby countries'
          : category === 'country_impact'
            ? 'list of countries that could be impacted and in what timeframe. For each country give: country name, approximate timeframe (e.g. "in 1–2 weeks", "in 3 weeks", "already impacted"), and type of impact (e.g. gas/fuel prices, supply chains, travel, inflation). Format as short bullet points, one per country.'
            : 'foreign direct investment, sovereign funds, and sector-specific investments';
  return `You are an objective analyst. Based on the following recent conflict-related events, write a short, factual analysis (2–4 paragraphs for narrative categories; for country_impact use clear bullet points) on: ${focus}. Use ${lang}. Be neutral and cite only the event summary. Do not speculate beyond what the events suggest.\n\nEvents:\n${eventsSummary}`;
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
    tourism_flights:
      'Tourism and flights: Regions directly impacted include Israel, Iran, and neighbouring countries (Lebanon, Syria, Iraq, Jordan). Airlines have rerouted or cancelled some services over the Eastern Mediterranean and Gulf. Travel advisories are in effect for several countries. Tourism in the wider Middle East and Eastern Mediterranean may be affected; travellers should check official advisories and carrier updates.',
    country_impact:
      '• Israel, Iran, Lebanon, Syria, Iraq, Jordan — already impacted (security, flights, borders).\n• Gulf states (UAE, Bahrain, Kuwait, Saudi Arabia) — 1–2 weeks: flight rerouting, higher insurance, possible fuel-price pass-through.\n• Turkey, Egypt — 1–3 weeks: tourism and overflight effects, energy costs.\n• EU (e.g. Germany, France, Italy) — 2–4 weeks: fuel and energy prices, supply-chain delays.\n• USA, Canada — 2–4 weeks: gas prices and refined-product imports may rise.\n• Asia (e.g. India, China) — 3–6 weeks: oil and shipping costs if Strait of Hormuz or Suez is affected.',
  };
  const pt: Record<string, string> = {
    market:
      'Os eventos recentes sugerem maior volatilidade em petróleo e ativos refúgio. Escalações tendem a pressionar preços de energia e índices regionais. Este texto é um resumo de ligações típicas, não uma previsão.',
    transport:
      'Rotas marítimas e aéreas na região podem sofrer desvios e ajustes de seguro. Cadeias de abastecimento com exposição ao Mediterrâneo Oriental e ao Golfo podem registar atrasos e custos mais elevados.',
    investments:
      'O impacto nos investimentos depende da exposição setorial e geográfica. Sectores de defesa e energia reagem frequentemente a notícias de conflito; fluxos de IED e soberanos na região podem ser adiados ou repreciados.',
    tourism_flights:
      'Turismo e voos: Regiões diretamente impactadas incluem Israel, Irão e países vizinhos (Líbano, Síria, Iraque, Jordânia). Companhias aéreas desviaram ou cancelaram alguns serviços sobre o Mediterrâneo Oriental e o Golfo. Avisos de viagem estão em vigor. O turismo no Médio Oriente e Mediterrâneo Oriental pode ser afetado; consulte avisos oficiais e as companhias aéreas.',
    country_impact:
      '• Israel, Irão, Líbano, Síria, Iraque, Jordânia — já impactados (segurança, voos, fronteiras).\n• Estados do Golfo (EAU, Barém, Kuwait, Arábia Saudita) — 1–2 semanas: desvios de voos, seguros, preços de combustível.\n• Turquia, Egipto — 1–3 semanas: turismo e sobrevoo, custos energéticos.\n• UE (Alemanha, França, Itália) — 2–4 semanas: preços de combustível e energia, atrasos na cadeia de abastecimento.\n• EUA, Canadá — 2–4 semanas: preços da gasolina podem subir.\n• Ásia (Índia, China) — 3–6 semanas: petróleo e custos de transporte se o Estreito de Ormuz ou Suez forem afetados.',
  };
  const es: Record<string, string> = {
    market:
      'Los eventos recientes apuntan a mayor volatilidad en petróleo y activos refugio. Las escaladas suelen presionar precios energéticos e índices regionales. Este texto es un resumen de vínculos típicos, no una previsión.',
    transport:
      'Las rutas marítimas y aéreas en la región pueden sufrir desvíos y ajustes de seguros. Las cadenas de suministro con exposición al Mediterráneo Oriental y al Golfo pueden ver retrasos y mayores costes.',
    investments:
      'El impacto en inversiones depende de la exposición sectorial y geográfica. Los sectores de defensa y energía suelen reaccionar a noticias del conflicto; los flujos de IED y soberanos en la región pueden retrasarse o repreciarse.',
    tourism_flights:
      'Turismo y vuelos: Regiones directamente impactadas incluyen Israel, Irán y países vecinos (Líbano, Siria, Irak, Jordania). Aerolíneas han desviado o cancelado servicios sobre el Mediterráneo Oriental y el Golfo. Avisos de viaje en vigor. El turismo en Oriente Medio y el Mediterráneo Oriental puede verse afectado; consulte avisos oficiales y aerolíneas.',
    country_impact:
      '• Israel, Irán, Líbano, Siria, Irak, Jordania — ya impactados (seguridad, vuelos, fronteras).\n• Estados del Golfo (EAU, Baréin, Kuwait, Arabia Saudí) — 1–2 semanas: desvíos de vuelos, seguros, precios de combustible.\n• Turquía, Egipto — 1–3 semanas: turismo y sobrevuelo, costes energéticos.\n• UE (Alemania, Francia, Italia) — 2–4 semanas: precios de combustible y energía, retrasos en cadena de suministro.\n• EE.UU., Canadá — 2–4 semanas: subida posible de precios de gasolina.\n• Asia (India, China) — 3–6 semanas: petróleo y costes de envío si se afectan el Estrecho de Ormuz o Suez.',
  };
  const m = locale === 'pt' ? pt : locale === 'es' ? es : en;
  return m[category] ?? m.market ?? '';
}
