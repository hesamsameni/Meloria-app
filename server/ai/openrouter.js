import OpenAI from "openai";

export const ai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const deepseekAi = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export { deepseekAi };

const DEEPSEEK_MODEL_MAP = {
  "deepseek/deepseek-v3.2": "deepseek-chat",
  "deepseek/deepseek-v4-flash": "deepseek-v4-flash",
};

function resolveClient(model) {
  const isDeepseek = model.startsWith("deepseek");
  const client = isDeepseek ? deepseekAi : ai;
  const resolvedModel = isDeepseek
    ? (DEEPSEEK_MODEL_MAP[model] ?? model.replace(/^deepseek\//, ""))
    : model;
  return { client, resolvedModel };
}

export async function callAI(
  prompt,
  model = "openai/gpt-4o-mini",
  options = {},
) {
  const { client, resolvedModel } = resolveClient(model);
  const { responseFormat = null, maxTokens = null } = options;
  const requestConfig = {
    model: resolvedModel,
    messages: [{ role: "user", content: prompt }],
  };

  if (responseFormat === "json") {
    requestConfig.response_format = { type: "json_object" };
  }
  if (maxTokens) {
    requestConfig.max_tokens = maxTokens;
  }

  const res = await client.chat.completions.create(requestConfig);
  const usage = res.usage;
  if (usage) {
    console.log(
      `[AI] model=${resolvedModel} prompt_tokens=${usage.prompt_tokens} completion_tokens=${usage.completion_tokens} total=${usage.total_tokens}`,
    );
  }
  return res.choices[0].message.content;
}

// Streaming chat — takes a full messages array (including system message).
// Yields text chunks as they arrive. Use with `for await` in route handlers.
export async function* streamAI(messages, model = "openai/gpt-4o-mini") {
  const { client, resolvedModel } = resolveClient(model);
  const stream = await client.chat.completions.create({
    model: resolvedModel,
    messages,
    stream: true,
    stream_options: { include_usage: true },
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
    if (chunk.usage) {
      const u = chunk.usage;
      console.log(
        `[AI] model=${resolvedModel} prompt_tokens=${u.prompt_tokens} completion_tokens=${u.completion_tokens} total=${u.total_tokens}`,
      );
    }
  }
}

export async function extract(
  prompt,
  model = "openai/gpt-4o-mini",
  options = {},
) {
  const content = await callAI(prompt, model, {
    responseFormat: "json",
    ...options,
  });
  const cleaned = content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  return JSON.parse(cleaned);
}
