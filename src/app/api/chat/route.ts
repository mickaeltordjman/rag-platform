import { NextResponse } from "next/server";

type ChatHistoryItem = {
  role: string;
  content: string;
};

type RequestBody = {
  arm?: "GPT" | "GPT_OPENSCHOLAR";
  caseText?: string;
  message?: string;
  history?: ChatHistoryItem[];
};

type Source = {
  title: string;
  url?: string;
};

type RetrievalDocument = {
  title?: string;
  passage?: string;
  url?: string;
};

type OpenAIContentItem = {
  text?: string;
};

type OpenAIOutputItem = {
  content?: OpenAIContentItem[];
};

type OpenAIResponseData = {
  id?: string;
  model?: string;
  output_text?: string;
  output?: OpenAIOutputItem[];
  error?: {
    message?: string;
  };
};

function demoResponse(message: string, rag: boolean) {
  const evidence = rag
    ? " In the RAG condition, the production service should retrieve and log relevant literature before generation."
    : "";

  return `Demo response: I would structure the reasoning by identifying the dominant syndrome, checking high-risk alternatives, and ranking a concise differential. Your prompt was: “${message}”.${evidence}

Configure OPENAI_API_KEY and OPENAI_MODEL to use the live model. Configure the OpenScholar endpoint variables to enable real retrieval.`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    const message = body.message?.trim();
    const caseText = body.caseText?.trim();
    const arm = body.arm;

    if (!message || !caseText || !arm) {
      return NextResponse.json(
        {
          error: "Missing required request data.",
        },
        {
          status: 400,
        },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL;
    const reasoningEffort =
      process.env.OPENAI_REASONING_EFFORT || "medium";

    if (!apiKey || !model) {
      return NextResponse.json({
        text: demoResponse(
          message,
          arm === "GPT_OPENSCHOLAR",
        ),
        sources:
          arm === "GPT_OPENSCHOLAR"
            ? [
                {
                  title:
                    "OpenScholar integration not configured",
                },
              ]
            : [],
        demo: true,
      });
    }

    let retrievedEvidence = "";
    let sources: Source[] = [];

    if (
      arm === "GPT_OPENSCHOLAR" &&
      process.env.OPENSCHOLAR_API_URL
    ) {
      try {
        const retrievalResponse = await fetch(
          process.env.OPENSCHOLAR_API_URL,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(process.env.OPENSCHOLAR_API_KEY
                ? {
                    Authorization: `Bearer ${process.env.OPENSCHOLAR_API_KEY}`,
                  }
                : {}),
            },
            body: JSON.stringify({
              query: `${caseText}\n\n${message}`,
            }),
            cache: "no-store",
          },
        );

        if (retrievalResponse.ok) {
          const retrieval =
            (await retrievalResponse.json()) as {
              documents?: RetrievalDocument[];
            };

          const documents = Array.isArray(
            retrieval.documents,
          )
            ? retrieval.documents
            : [];

          retrievedEvidence = documents
            .map(
              (document, index) =>
                `[${index + 1}] ${
                  document.title || "Untitled"
                }\n${document.passage || ""}`,
            )
            .join("\n\n");

          sources = documents.map((document) => ({
            title: document.title || "Untitled",
            url: document.url,
          }));
        } else {
          console.error(
            "OpenScholar request failed:",
            retrievalResponse.status,
          );
        }
      } catch (error) {
        console.error(
          "OpenScholar retrieval error:",
          error,
        );
      }
    }

    const system = `
You are assisting a physician in a diagnostic-reasoning study.

Provide a clinically useful diagnostic assessment based only on the available case information and the physician's request.

When relevant:
- state the leading diagnosis;
- explain the key supporting findings;
- provide a prioritized differential diagnosis;
- explain why the alternatives are more or less likely;
- identify important missing information that could change the assessment;
- explicitly communicate uncertainty.

Do not fabricate clinical facts, imaging findings, references, or citations. Keep the response focused, but provide sufficient detail to support clinical reasoning.
`.trim();

    const prompt = `
AUTOMATIC CASE CONTENT:
${caseText}

${
  retrievedEvidence
    ? `RETRIEVED EVIDENCE:
${retrievedEvidence}

`
    : ""
}PHYSICIAN-WRITTEN PROMPT:
${message}
`.trim();

    const history = (body.history || [])
      .slice(-8)
      .filter(
        (item) =>
          typeof item.role === "string" &&
          typeof item.content === "string" &&
          item.content.trim(),
      )
      .map((item) => ({
        role: item.role,
        content: item.content,
      }));

    const openAiResponse = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          reasoning: {
            effort: reasoningEffort,
          },
          text: {
            verbosity: "medium",
          },
          max_output_tokens: 3000,
          input: [
            {
              role: "system",
              content: system,
            },
            ...history,
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
        cache: "no-store",
      },
    );

    const data =
      (await openAiResponse.json()) as OpenAIResponseData;

    console.log("Requested model:", model);
    console.log("Returned model:", data.model);
    console.log("Reasoning effort:", reasoningEffort);
    console.log("OpenAI response ID:", data.id);

    if (!openAiResponse.ok) {
      return NextResponse.json(
        {
          error:
            data.error?.message ||
            "OpenAI request failed.",
        },
        {
          status: openAiResponse.status,
        },
      );
    }

    const fallbackText =
      data.output
        ?.flatMap((item) => item.content || [])
        .map((item) => item.text || "")
        .filter(Boolean)
        .join("\n") || "";

    const text =
      data.output_text ||
      fallbackText ||
      "No response text returned.";

    return NextResponse.json({
      text,
      sources,
      modelRequested: model,
      modelReturned: data.model ?? null,
      reasoningEffort,
      responseId: data.id ?? null,
    });
  } catch (error) {
    console.error("Chat route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      },
      {
        status: 500,
      },
    );
  }
}
