# RAG-Dx Study Platform

A working Next.js MVP for an international physician diagnostic-reasoning study.

## Study workflow

1. Every reader reviews each case without AI.
2. The reader submits a main diagnosis, up to three differentials, and confidence from 0–100.
3. That baseline answer is locked.
4. The reader-case interaction is assigned to GPT alone or GPT + OpenScholar.
5. The reader interacts with the assigned assistant and submits the same diagnostic assessment again.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

The app works without API keys using a clearly labeled demo AI response. To use a live OpenAI model, configure `OPENAI_API_KEY` and the exact approved API model identifier in `OPENAI_MODEL`.

## OpenScholar adapter

The prototype expects:

```text
POST OPENSCHOLAR_API_URL
Authorization: Bearer <optional key>
Content-Type: application/json

{ "query": "..." }
```

Response:

```json
{
  "documents": [
    { "title": "Article title", "passage": "Retrieved passage", "url": "https://..." }
  ]
}
```

Adapt `src/app/api/chat/route.ts` when the actual Discovery/OpenScholar contract is available.

## What is working

- Reader registration and consent capture
- Reader dashboard and case progress
- Universal unaided baseline assessment
- Required 0–100 confidence selection
- Baseline answer locking
- Stable reader-case assignment to GPT or GPT + OpenScholar
- AI chat with demo fallback or live OpenAI Responses API
- Post-AI assessment and case completion
- Browser persistence across refreshes
- Separation of automatic case content and manual physician prompts in the AI request

## Production limitations

This is a functional UI and workflow MVP, not yet a research-production deployment. Data are stored in browser `localStorage`; authentication, a server database, invitation management, auditable server-side randomization, encrypted exports, centralized event logging, and institutional hosting review are still required before enrolling real study participants.
