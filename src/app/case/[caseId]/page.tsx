"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import JpegCaseViewer from "@/components/JpegCaseViewer";
import { DiagnosticForm } from "@/components/DiagnosticForm";
import { ChatPanel } from "@/components/ChatPanel";
import {
  CASES,
  type CaseSession,
  type DiagnosticAnswer,
} from "@/lib/study";
import {
  ensureSession,
  submitAnswer,
} from "@/lib/storage";

const TEST_ASSIGNMENT_ID =
  "26560c1d-dd74-4821-bcac-828dc156b2f7";

type CasePageProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export default function CasePage({
  params,
}: CasePageProps) {
  const { caseId } = use(params);
  const router = useRouter();

  const studyCase = CASES.find(
    (item) => item.id === caseId,
  );

  const [session, setSession] =
    useState<CaseSession | null>(null);

  const [savingPhase, setSavingPhase] = useState<
    "baseline" | "final" | null
  >(null);

  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!studyCase) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSession(ensureSession(caseId));
    }, 0);

    async function recordCaseOpened() {
      try {
        const response = await fetch(
          "/api/events/case-opened",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              assignmentId: TEST_ASSIGNMENT_ID,
              caseId,
            }),
          },
        );

        if (!response.ok) {
          const payload = (await response.json()) as {
            error?: string;
          };

          console.error(
            "Unable to record case opening:",
            payload.error ??
              "Unknown case-opened error.",
          );
        }
      } catch (error) {
        console.error(
          "Unable to record case opening:",
          error,
        );
      }
    }

    void recordCaseOpened();

    return () => {
      window.clearTimeout(timer);
    };
  }, [caseId, studyCase]);

  async function save(
    phase: "baseline" | "final",
    answer: DiagnosticAnswer,
  ) {
    try {
      setSavingPhase(phase);
      setSaveError("");

      const endpoint =
        phase === "baseline"
          ? "/api/responses/baseline"
          : "/api/responses/final";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignmentId: TEST_ASSIGNMENT_ID,
          mainDiagnosis: answer.mainDiagnosis,
          differentials: answer.differentials,
          confidence: answer.confidence,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        success?: boolean;
        status?: string;
        interventionArm?: string;
      };

      if (!response.ok) {
        throw new Error(
          payload.error ??
            "Unable to save the diagnostic response.",
        );
      }

      const nextSession = submitAnswer(
        caseId,
        phase,
        answer,
      );

      setSession({
        ...nextSession,
      });

      if (phase === "final") {
        window.setTimeout(() => {
          router.push("/dashboard");
        }, 900);
      }
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Unable to save the diagnostic response.",
      );
    } finally {
      setSavingPhase(null);
    }
  }

  if (!studyCase) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        Case not found.
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        Loading case…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-cyan-300">
              RAG-Dx Study Platform
            </p>

            <h1 className="text-xl font-bold">
              Case {studyCase.id}
            </h1>
          </div>

          <a
            href="/dashboard"
            className="secondary-button"
          >
            Back to dashboard
          </a>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-2">
        <section className="panel">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Case information
              </h2>

              <p className="mt-1 text-sm text-slate-300">
                Complete the unaided assessment before
                accessing AI.
              </p>
            </div>

            <span className="badge">
              {studyCase.specialty}
            </span>
          </div>

          <div className="grid gap-4">
            {studyCase.sections.map(
              ([heading, text]) => (
                <div
                  key={heading}
                  className="rounded-2xl border border-white/10 bg-slate-900 p-5"
                >
                  <h3 className="font-semibold text-cyan-200">
                    {heading}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    {text}
                  </p>
                </div>
              ),
            )}

            <JpegCaseViewer caseCode={caseId} />
          </div>
        </section>

        <section className="panel">
          <h2 className="text-2xl font-bold">
            Diagnostic workflow
          </h2>

          <p className="mt-1 text-sm text-slate-300">
            Baseline responses are locked before the
            randomized AI condition is revealed.
          </p>

          {saveError ? (
            <div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
              {saveError}
            </div>
          ) : null}

          <div className="mt-6">
            <DiagnosticForm
              title="1. Unaided diagnostic assessment"
              submitLabel={
                savingPhase === "baseline"
                  ? "Saving baseline answer…"
                  : "Submit and lock baseline answer"
              }
              lockedAnswer={session.baseline}
              onSubmit={(answer) =>
                save("baseline", answer)
              }
            />
          </div>

          <div className="mt-6">
            {session.phase === "baseline" ? (
              <div className="rounded-2xl border border-white/10 bg-slate-900 p-5 text-sm text-slate-400">
                The AI assistant unlocks after baseline
                submission.
              </div>
            ) : (
              <ChatPanel
                session={session}
                assignmentId={TEST_ASSIGNMENT_ID}
                onChange={setSession}
              />
            )}
          </div>

          <div className="mt-6">
            <DiagnosticForm
              title="2. Post-AI diagnostic assessment"
              submitLabel={
                savingPhase === "final"
                  ? "Saving final answer…"
                  : "Submit final answer"
              }
              disabled={
                session.phase === "baseline" ||
                savingPhase !== null
              }
              lockedAnswer={session.final}
              onSubmit={(answer) =>
                save("final", answer)
              }
            />
          </div>

          {session.phase === "completed" ? (
            <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">
              Case completed. Returning to dashboard…
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
