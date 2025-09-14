// Claude LLM integration for sales transcript analysis
export type LlmExtract = {
  budget_status?: "Resolved Today" | "Approved" | "Freeze";
  decision_maker?: string;
  next_meeting?: string;       // ISO 8601 if the model returns it
  sentiment?: "positive" | "negative" | "neutral";
  key_insights?: string[];
  action_items?: string[];
  confidence_score?: number;
};

export async function extractWithLLM(transcript: string): Promise<LlmExtract | null> {
  const { CLAUDE_API_KEY, CLAUDE_MODEL } = process.env as Record<string, string | undefined>;
  if (!CLAUDE_API_KEY) return null;

  const model = CLAUDE_MODEL || "claude-3-5-sonnet-20241022";
  const prompt = `Extract structured fields from this sales debrief transcript.

Return ONLY valid JSON with these keys (omit if not mentioned):
- budget_status: "Resolved Today" | "Approved" | "Freeze"
- decision_maker: string (exact name if mentioned)
- next_meeting: ISO 8601 datetime if a specific time is mentioned
- sentiment: "positive" | "negative" | "neutral" (overall tone of conversation)
- key_insights: array of important insights mentioned
- action_items: array of specific tasks or follow-ups mentioned
- confidence_score: number 0-1 indicating confidence in extraction

Do not invent information. Only extract what is explicitly stated.

Transcript:
${transcript}

JSON:`;

  try {
    console.log(`🤖 Calling Claude API with model: ${model}`);
    
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    if (!resp.ok) {
      console.warn(`Claude API error: ${resp.status} ${resp.statusText}`);
      return null;
    }

    const data = await resp.json();
    const content = data.content?.[0]?.text;
    
    if (!content) {
      console.warn("No content in Claude response");
      return null;
    }

    console.log(`🤖 Claude response: ${content.substring(0, 200)}...`);

    // Extract JSON from Claude's response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("No JSON found in Claude response:", content);
      return null;
    }

    try {
      const result = JSON.parse(jsonMatch[0]);
      console.log(`🤖 Successfully extracted:`, result);
      return result;
    } catch {
      console.warn("Failed to parse Claude JSON:", jsonMatch[0]);
      return null;
    }
  } catch (error) {
    console.warn("Claude LLM extraction failed:", error);
    return null;
  }
}