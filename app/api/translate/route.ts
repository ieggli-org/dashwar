import { NextRequest, NextResponse } from 'next/server';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const cache = new Map<string, { translated: string; at: number }>();

function cacheKey(text: string, locale: string): string {
  return `${locale}:${text.slice(0, 200)}`;
}

type TranslateItem = { title: string; body: string | null };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, targetLocale, items } = body as {
      text?: string;
      targetLocale?: string;
      items?: TranslateItem[];
    };

    const locale = targetLocale === 'pt' ? 'pt' : targetLocale === 'es' ? 'es' : 'en';

    // Batch: translate feed items (title + body per item)
    if (Array.isArray(items) && items.length > 0) {
      if (locale === 'en') {
        return NextResponse.json({ items: items.map((i) => ({ title: i.title, body: i.body })) });
      }
      const apiKey = process.env.OPENAI_API_KEY;
      const lang = locale === 'pt' ? 'Brazilian Portuguese' : 'Spanish';
      const results: { title: string; body: string | null }[] = [];

      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx]!;
        const titleKey = cacheKey(item.title, locale);
        const bodyKey = item.body ? cacheKey(item.body, locale) : '';
        let title = item.title;
        let body = item.body;

        const cachedTitle = cache.get(titleKey);
        if (cachedTitle && Date.now() - cachedTitle.at < CACHE_TTL_MS) {
          title = cachedTitle.translated;
        } else {
          const t = await translateOne(apiKey, lang, item.title, locale);
          if (t) {
            title = t;
            cache.set(titleKey, { translated: t, at: Date.now() });
          }
        }
        if (item.body) {
          const cachedBody = cache.get(bodyKey);
          if (cachedBody && Date.now() - cachedBody.at < CACHE_TTL_MS) {
            body = cachedBody.translated;
          } else {
            const b = await translateOne(apiKey, lang, item.body, locale);
            if (b) {
              body = b;
              cache.set(bodyKey, { translated: b, at: Date.now() });
            }
          }
        }
        results.push({ title, body });
      }
      return NextResponse.json({ items: results });
    }

    // Single text
    if (typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Missing or invalid text' }, { status: 400 });
    }
    if (locale === 'en') {
      return NextResponse.json({ translated: text });
    }

    const key = cacheKey(text, locale);
    const cached = cache.get(key);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return NextResponse.json({ translated: cached.translated });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ translated: text });
    }

    const lang = locale === 'pt' ? 'Brazilian Portuguese' : 'Spanish';
    const translated = await translateOne(apiKey, lang, text, locale);
    if (translated) {
      cache.set(key, { translated, at: Date.now() });
      return NextResponse.json({ translated });
    }
    return NextResponse.json({ translated: text });
  } catch (e) {
    console.error('Translate failed', e);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}

async function translateWithOpenAI(
  apiKey: string,
  lang: string,
  text: string
): Promise<string | null> {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `Translate the following text to ${lang}. Preserve meaning and tone. Return only the translation, no explanation.\n\n${text}`,
          },
        ],
        max_tokens: 500,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const translated = data.choices?.[0]?.message?.content?.trim();
    return typeof translated === 'string' ? translated : null;
  } catch {
    return null;
  }
}

/** MyMemory free API: langpair is e.g. en|pt (source|target). No key required. */
async function translateWithMyMemory(text: string, langPair: string): Promise<string | null> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${langPair}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const t = data.responseData?.translatedText;
    return typeof t === 'string' ? t.trim() : null;
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function translateOne(
  apiKey: string | undefined,
  lang: string,
  text: string,
  locale: string
): Promise<string | null> {
  if (apiKey) {
    const out = await translateWithOpenAI(apiKey, lang, text);
    if (out) return out;
  }
  const langPair = locale === 'pt' ? 'en|pt' : 'en|es';
  const out = await translateWithMyMemory(text, langPair);
  await sleep(150);
  return out;
}
