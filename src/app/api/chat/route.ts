import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type ChatHistoryItem = {
  role: string;
  content: string;
};

type RequestBody = {
  assignmentId?: string;
  caseId?: string;
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

type OpenAIUsage = {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
};

type OpenAIResponseData = {
  id?: string;
  model?: string;
  output_text?: string;
  output?: OpenAIOutputItem[];
  usage?: OpenAIUsage;
  error?: {
    message?: string;
  };
};

type AssignmentRow = {
  id: string;
  intervention_arm: "GPT" | "GPT_OPENSCHOLAR";
  status: string;
  baseline_submitted_at: string | null;
};

function demoResponse(message: string, rag: boolean) {
  const evidence = rag
    ? " In the RAG condition, the production service should retrieve and log relevant literature before generation."
    : "";

  return `Demo response: I would structure the reasoning by identifying the dominant syndrome, checking high-risk alternatives, and ranking a concise differential. Your prompt was: “${message}”.${evidence}

Configure OPENAI_API_KEY and OPENAI_MODEL to use the live model. Configure the OpenScholar endpoint variables to enable real retrieval.`;
}

async function recordStudyEvent(
  assignmentId: string,
  eventType: string,
  metadata: Record<string, unknown> = {},
) {
  const { error } = await supabaseAdmin
    .from("study_events")
    .insert({
      assignment_id: assignmentId,
      event_type: eventType,
      occurred_at: new Date().toISOString(),
      metadata,
    });

  if (error) {
    console.error(
      `Unable to record ${eventType}:`,
      error.message,
    );
  }
}

async function getNextInteractionNumber(
  assignmentId: string,
) {
  const { data, error } = await supabaseAdmin
    .from("chat_messages")
    .select("interaction_number")
    .eq("assignment_id", assignmentId)
    .order("interaction_number", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to determine interaction number: ${error.message}`,
    );
  }

  return (data?.interaction_number ?? 0) + 1;
}

export async function POST(request: Request) {
  const requestStartedAt = Date.now();

  try {
    const body = (await request.json()) as RequestBody;

    const assignmentId = body.assignmentId?.trim();
    const caseId = body.caseId?.trim();
    const caseText = body.caseText?.trim();
    const message = body.message?.trim();

    if (
      !assignmentId ||
      !caseId ||
      !caseText ||
      !message
    ) {
      return NextResponse.json(
        {
          error: "Missing required request data.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Load the assignment from Supabase.
     * The intervention arm is taken from the database,
     * not trusted from the browser.
     */
    const {
      data: assignmentData,
      error: assignmentError,
    } = await supabaseAdmin
      .from("assignments")
      .select(
        "id, intervention_arm, status, baseline_submitted_at",
      )
      .eq("id", assignmentId)
      .single();

    if (assignmentError || !assignmentData) {
      return NextResponse.json(
        {
          error: "Assignment not found.",
        },
        {
          status: 404,
        },
      );
    }

    const assignment =
      assignmentData as AssignmentRow;

    if (!assignment.baseline_submitted_at) {
      return NextResponse.json(
        {
          error:
            "The baseline response must be submitted before using the AI assistant.",
        },
        {
          status: 403,
        },
      );
    }

    if (
      assignment.status === "COMPLETED" ||
      assignment.status === "FINAL_SUBMITTED"
    ) {
      return NextResponse.json(
        {
          error:
            "This assignment has already been completed.",
        },
        {
          status: 409,
        },
      );
    }

    const arm = assignment.intervention_arm;

    if (
      arm !== "GPT" &&
      arm !== "GPT_OPENSCHOLAR"
    ) {
      return NextResponse.json(
        {
          error: "Invalid intervention arm.",
        },
        {
          status: 400,
        },
      );
    }

    const interactionNumber =
      await getNextInteractionNumber(assignmentId);

    const userSubmittedAt =
      new Date().toISOString();

    /*
     * Save the exact physician-written prompt.
     * The automatically inserted case text is not mixed
     * into the physician prompt field.
     */
    const {
      data: userMessageRow,
      error: userMessageError,
    } = await supabaseAdmin
      .from("chat_messages")
      .insert({
        assignment_id: assignmentId,
        role: "USER",
        content: message,
        interaction_number: interactionNumber,
        sequence_number:
          interactionNumber * 2 - 1,
        metadata: {
          caseId,
          submittedAt: userSubmittedAt,
          source: "physician_written_prompt",
        },
      })
      .select("id")
      .single();

    if (userMessageError) {
      throw new Error(
        `Unable to save physician prompt: ${userMessageError.message}`,
      );
    }

    await recordStudyEvent(
      assignmentId,
      "CHAT_PROMPT_SUBMITTED",
      {
        caseId,
        interactionNumber,
        chatMessageId: userMessageRow.id,
      },
    );

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL;
    const reasoningEffort =
      process.env.OPENAI_REASONING_EFFORT ||
      "medium";

    if (!apiKey || !model) {
      const text = demoResponse(
        message,
        arm === "GPT_OPENSCHOLAR",
      );

      const latencyMs =
        Date.now() - requestStartedAt;

      await supabaseAdmin
        .from("chat_messages")
        .insert({
          assignment_id: assignmentId,
          role: "ASSISTANT",
          content: text,
          interaction_number: interactionNumber,
          sequence_number:
            interactionNumber * 2,
          latency_ms: latencyMs,
          metadata: {
            caseId,
            demo: true,
          },
        });

      await recordStudyEvent(
        assignmentId,
        "CHAT_RESPONSE_RECEIVED",
        {
          caseId,
          interactionNumber,
          latencyMs,
          demo: true,
        },
      );

      return NextResponse.json({
        text,
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

    /*
     * Temporary OpenScholar block.
     * We will improve this during the OpenScholar milestone.
     */
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
              ...(process.env
                .OPENSCHOLAR_API_KEY
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
                  document.title ||
                  "Untitled"
                }\n${
                  document.passage || ""
                }`,
            )
            .join("\n\n");

          sources = documents.map(
            (document) => ({
              title:
                document.title ||
                "Untitled",
              url: document.url,
            }),
          );
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

    const history = (
      body.history || []
    )
      .slice(-8)
      .filter(
        (item) =>
          typeof item.role === "string" &&
          typeof item.content ===
            "string" &&
          item.content.trim(),
      )
      .map((item) => ({
        role: item.role,
        content: item.content,
      }));

    const modelRequestStartedAt =
      Date.now();

    const openAiResponse = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type":
            "application/json",
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

    const latencyMs =
      Date.now() - modelRequestStartedAt;

    const data =
      (await openAiResponse.json()) as OpenAIResponseData;

    console.log(
      "Requested model:",
      model,
    );
    console.log(
      "Returned model:",
      data.model,
    );
    console.log(
      "Reasoning effort:",
      reasoningEffort,
    );
    console.log(
      "OpenAI response ID:",
      data.id,
    );

    if (!openAiResponse.ok) {
      await recordStudyEvent(
        assignmentId,
        "CHAT_RESPONSE_ERROR",
        {
          caseId,
          interactionNumber,
          latencyMs,
          status: openAiResponse.status,
          error:
            data.error?.message ||
            "OpenAI request failed.",
        },
      );

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
        ?.flatMap(
          (item) =>
            item.content || [],
        )
        .map(
          (item) =>
            item.text || "",
        )
        .filter(Boolean)
        .join("\n") || "";

    const text =
      data.output_text ||
      fallbackText ||
      "No response text returned.";

    const inputTokens =
      data.usage?.input_tokens ?? null;

    const outputTokens =
      data.usage?.output_tokens ?? null;

    const totalTokens =
      data.usage?.total_tokens ??
      (inputTokens !== null &&
      outputTokens !== null
        ? inputTokens + outputTokens
        : null);

    /*
     * Save the exact LLM output and metadata.
     */
    const {
      data: assistantMessageRow,
      error: assistantMessageError,
    } = await supabaseAdmin
      .from("chat_messages")
      .insert({
        assignment_id: assignmentId,
        role: "ASSISTANT",
        content: text,
        interaction_number: interactionNumber,
        sequence_number:
          interactionNumber * 2,
        model_identifier:
          data.model || model,
        reasoning_level:
          reasoningEffort,
        model_requested: model,
        model_returned:
          data.model || null,
        response_id:
          data.id || null,
        reasoning_effort:
          reasoningEffort,
        latency_ms: latencyMs,
        input_tokens: inputTokens,
        output_tokens:
          outputTokens,
        total_tokens: totalTokens,
        metadata: {
          caseId,
          arm,
          sourceCount:
            sources.length,
          userMessageId:
            userMessageRow.id,
        },
      })
      .select("id")
      .single();

    if (assistantMessageError) {
      throw new Error(
        `Unable to save assistant output: ${assistantMessageError.message}`,
      );
    }

    await recordStudyEvent(
      assignmentId,
      "CHAT_RESPONSE_RECEIVED",
      {
        caseId,
        interactionNumber,
        chatMessageId:
          assistantMessageRow.id,
        responseId:
          data.id || null,
        modelRequested: model,
        modelReturned:
          data.model || null,
        reasoningEffort,
        latencyMs,
        inputTokens,
        outputTokens,
        totalTokens,
        sourceCount:
          sources.length,
      },
    );

    return NextResponse.json({
      text,
      sources,
      modelRequested: model,
      modelReturned:
        data.model ?? null,
      reasoningEffort,
      responseId:
        data.id ?? null,
      latencyMs,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens,
      },
    });
  } catch (error) {
    console.error(
      "Chat route error:",
      error,
    );

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
