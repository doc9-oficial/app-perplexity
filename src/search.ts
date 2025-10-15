import docgo from "docgo-sdk";

interface SearchParams {
  query: string;
  model?: string;
  temperature?: number;
}

async function search(params: SearchParams): Promise<void> {
  try {
    if (Array.isArray(params) && params.length === 1 && typeof params[0] === 'object') {
      params = params[0];
    }
    const apiKey = docgo.getEnv("PPLX_API_KEY") || docgo.getEnv("pplxApiKey");
    if (!apiKey) {
      console.log(docgo.result(false, null, "PPLX_API_KEY/pplxApiKey não configurado"));
      return;
    }

    const model =
      params.model || docgo.getEnv("PPLX_MODEL") || "pplx-7b-online";
    const temperature = params.temperature ?? 0.2;

    const base = (
      docgo.getEnv("PPLX_BASE_URL") || "https://api.perplexity.ai"
    ).replace(/\/$/, "");
    const url = base + "/chat/completions";

    const body = {
      model,
      temperature,
      messages: [
        {
          role: "system",
          content: "Você é um pesquisador que responde com fontes confiáveis.",
        },
        { role: "user", content: params.query },
      ],
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    } as any);

    if (!resp.ok) {
      const txt = await resp.text();
      console.log(
        docgo.result(false, null, `Falha Perplexity ${resp.status}: ${txt}`)
      );
      return;
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    const citations = data.citations || data.choices?.[0]?.message?.citations;

    console.log(
      docgo.result(true, { model, content, citations, usage: data.usage })
    );
  } catch (err: any) {
    console.log(docgo.result(false, null, err.message));
  }
}

export default search;
