import { NextResponse } from "next/server";

type RequestBody = { arm?: "GPT" | "GPT_OPENSCHOLAR"; caseText?: string; message?: string; history?: Array<{ role: string; content: string }> };

function demoResponse(message: string, rag: boolean) {
  const evidence = rag ? " In the RAG condition, the production service should retrieve and log relevant literature before generation." : "";
  return `Demo response: I would structure the reasoning by identifying the dominant syndrome, checking high-risk alternatives, and ranking a concise differential. Your prompt was: “${message}”.${evidence}\n\nConfigure OPENAI_API_KEY and OPENAI_MODEL to use the live model. Configure the OpenScholar endpoint variables to enable real retrieval.`;
}

export async function POST(request: Request) {
  const body = (await request.json()) as RequestBody;
  if (!body.message?.trim() || !body.caseText?.trim() || !body.arm) return NextResponse.json({ error: "Missing required request data." }, { status: 400 });
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  if (!apiKey || !model) return NextResponse.json({ text: demoResponse(body.message, body.arm === "GPT_OPENSCHOLAR"), sources: body.arm === "GPT_OPENSCHOLAR" ? [{ title: "OpenScholar integration not configured" }] : [] });

  let retrievedEvidence = "";
  let sources: Array<{ title: string; url?: string }> = [];
  if (body.arm === "GPT_OPENSCHOLAR" && process.env.OPENSCHOLAR_API_URL) {
    try {
      const retrievalResponse = await fetch(process.env.OPENSCHOLAR_API_URL, { method: "POST", headers: { "Content-Type": "application/json", ...(process.env.OPENSCHOLAR_API_KEY ? { Authorization: `Bearer ${process.env.OPENSCHOLAR_API_KEY}` } : {}) }, body: JSON.stringify({ query: `${body.caseText}\n\n${body.message}` }), cache: "no-store" });
      if (retrievalResponse.ok) {
        const retrieval = await retrievalResponse.json();
        const documents = Array.isArray(retrieval.documents) ? retrieval.documents : [];
        retrievedEvidence = documents.map((doc: { title?: string; passage?: string }, index: number) => `[${index + 1}] ${doc.title || "Untitled"}\n${doc.passage || ""}`).join("\n\n");
        sources = documents.map((doc: { title?: string; url?: string }) => ({ title: doc.title || "Untitled", url: doc.url }));
      }
    } catch { /* Generation can still proceed and the UI exposes absent sources. */ }
  }

  const system = "You are assisting a physician in a diagnostic-reasoning study. Be concise, clinically useful, explicit about uncertainty, and do not fabricate citations.";
  const prompt = `AUTOMATIC CASE CONTENT:\n${body.caseText}\n\n${retrievedEvidence ? `RETRIEVED EVIDENCE:\n${retrievedEvidence}\n\n` : ""}PHYSICIAN-WRITTEN PROMPT:\n${body.message}`;
  const openAiResponse = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model, reasoning: { effort: process.env.OPENAI_REASONING_EFFORT || "medium" }, input: [{ role: "system", content: system }, ...(body.history || []).slice(-8).map((item) => ({ role: item.role, content: item.content })), { role: "user", content: prompt }] }), cache: "no-store" });
  const data = await openAiResponse.json();
  
  console.log("Requested model:", model);
  console.log("Returned model:", data.model);
  console.log("OpenAI response ID:", data.id);
  
  if (!openAiResponse.ok) return NextResponse.json({ error: data.error?.message || "OpenAI request failed." }, { status: openAiResponse.status });
  const text = data.output_text || data.output?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content || []).map((item: { text?: string }) => item.text || "").join("\n") || "No response text returned.";
  return NextResponse.json({ text, sources });
}
