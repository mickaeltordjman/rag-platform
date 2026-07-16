"use client";

import { useEffect, useMemo, useState } from "react";

type CaseSequenceSummary = {
  id: string;
  name: string;
  order: number | null;
  imageCount: number;
};

type CasePayload = {
  id: string;
  caseCode: string;
  dataset: string;
  title: string | null;
  clinicalText: string;
  sequences: CaseSequenceSummary[];
};

type SequenceImage = {
  path: string;
  signedUrl: string;
};

type LoadedSequence = {
  id: string;
  name: string;
  order: number | null;
  images: SequenceImage[];
};

type JpegCaseViewerProps = {
  caseCode: string;
};

export default function JpegCaseViewer({
  caseCode,
}: JpegCaseViewerProps) {
  const [studyCase, setStudyCase] =
    useState<CasePayload | null>(null);

  const [activeSequenceId, setActiveSequenceId] =
    useState<string | null>(null);

  const [loadedSequences, setLoadedSequences] = useState<
    Record<string, LoadedSequence>
  >({});

  const [imageIndexBySequence, setImageIndexBySequence] =
    useState<Record<string, number>>({});

  const [zoom, setZoom] = useState(1);
  const [loadingCase, setLoadingCase] = useState(true);
  const [loadingSequence, setLoadingSequence] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCase() {
      try {
        setLoadingCase(true);
        setError("");

        const response = await fetch(
          `/api/cases/${encodeURIComponent(caseCode)}`,
          { cache: "no-store" },
        );

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(
            payload.error ?? "Unable to load case.",
          );
        }

        if (!active) return;

        setStudyCase(payload);

        const firstSequenceId =
          payload.sequences?.[0]?.id ?? null;

        setActiveSequenceId(firstSequenceId);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load case.",
          );
        }
      } finally {
        if (active) {
          setLoadingCase(false);
        }
      }
    }

    void loadCase();

    return () => {
      active = false;
    };
  }, [caseCode]);

  useEffect(() => {
    if (!activeSequenceId) return;
    if (loadedSequences[activeSequenceId]) return;

    let active = true;

    async function loadSequence() {
      try {
        setLoadingSequence(true);
        setError("");

        const response = await fetch(
          `/api/cases/${encodeURIComponent(
            caseCode,
          )}/sequences/${encodeURIComponent(
            activeSequenceId,
          )}`,
          { cache: "no-store" },
        );

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(
            payload.error ?? "Unable to load sequence.",
          );
        }

        if (!active) return;

        setLoadedSequences((current) => ({
          ...current,
          [activeSequenceId]: payload,
        }));
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load sequence.",
          );
        }
      } finally {
        if (active) {
          setLoadingSequence(false);
        }
      }
    }

    void loadSequence();

    return () => {
      active = false;
    };
  }, [activeSequenceId, caseCode, loadedSequences]);

  const activeSequence = activeSequenceId
    ? loadedSequences[activeSequenceId] ?? null
    : null;

  const currentIndex = activeSequence
    ? imageIndexBySequence[activeSequence.id] ?? 0
    : 0;

  const currentImage =
    activeSequence?.images[currentIndex] ?? null;

  const activeSummary = useMemo(
    () =>
      studyCase?.sequences.find(
        (sequence) => sequence.id === activeSequenceId,
      ) ?? null,
    [activeSequenceId, studyCase],
  );

  function setCurrentIndex(nextIndex: number) {
    if (!activeSequence) return;

    setImageIndexBySequence((current) => ({
      ...current,
      [activeSequence.id]: nextIndex,
    }));
  }

  function previousImage() {
    if (!activeSequence || activeSequence.images.length === 0) {
      return;
    }

    setCurrentIndex(
      currentIndex === 0
        ? activeSequence.images.length - 1
        : currentIndex - 1,
    );
  }

  function nextImage() {
    if (!activeSequence || activeSequence.images.length === 0) {
      return;
    }

    setCurrentIndex(
      currentIndex === activeSequence.images.length - 1
        ? 0
        : currentIndex + 1,
    );
  }

  if (loadingCase) {
    return (
      <div className="flex min-h-[650px] items-center justify-center rounded-xl bg-black text-white">
        Loading case…
      </div>
    );
  }

  if (error && !studyCase) {
    return (
      <div className="flex min-h-[650px] items-center justify-center rounded-xl bg-black p-6 text-red-300">
        {error}
      </div>
    );
  }

  if (!studyCase || studyCase.sequences.length === 0) {
    return (
      <div className="flex min-h-[650px] items-center justify-center rounded-xl bg-black text-white">
        No image sequences are configured.
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-700 bg-black">
      <div className="flex flex-wrap gap-2 border-b border-slate-700 bg-slate-900 p-3">
        {studyCase.sequences.map((sequence) => (
          <button
            key={sequence.id}
            type="button"
            onClick={() => {
              setActiveSequenceId(sequence.id);
              setZoom(1);
            }}
            className={
              sequence.id === activeSequenceId
                ? "rounded bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950"
                : "rounded bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600"
            }
          >
            {sequence.name} ({sequence.imageCount})
          </button>
        ))}
      </div>

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 bg-slate-950 px-4 py-3 text-white">
        <div>
          <p className="font-semibold">{studyCase.caseCode}</p>
          <p className="text-sm text-slate-400">
            {activeSummary?.name ?? "Sequence"}
            {activeSequence
              ? ` — image ${currentIndex + 1} of ${
                  activeSequence.images.length
                }`
              : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={previousImage}
            disabled={!activeSequence}
            className="rounded bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600 disabled:opacity-40"
          >
            Previous
          </button>

          <button
            type="button"
            onClick={nextImage}
            disabled={!activeSequence}
            className="rounded bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600 disabled:opacity-40"
          >
            Next
          </button>

          <button
            type="button"
            onClick={() =>
              setZoom((value) => Math.min(value + 0.25, 4))
            }
            disabled={!activeSequence}
            className="rounded bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600 disabled:opacity-40"
          >
            Zoom +
          </button>

          <button
            type="button"
            onClick={() =>
              setZoom((value) => Math.max(value - 0.25, 0.5))
            }
            disabled={!activeSequence}
            className="rounded bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600 disabled:opacity-40"
          >
            Zoom −
          </button>

          <button
            type="button"
            onClick={() => setZoom(1)}
            className="rounded bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600"
          >
            Reset
          </button>
        </div>
      </header>

      <div
        className="flex min-h-[650px] items-center justify-center overflow-auto p-4"
        onWheel={(event) => {
          if (!activeSequence) return;

          if (event.deltaY > 0) {
            nextImage();
          } else {
            previousImage();
          }
        }}
      >
        {loadingSequence ? (
          <p className="text-white">Loading sequence…</p>
        ) : currentImage ? (
          <img
            src={currentImage.signedUrl}
            alt={`${studyCase.caseCode}, ${
              activeSummary?.name ?? "sequence"
            }, image ${currentIndex + 1}`}
            draggable={false}
            className="max-h-[78vh] max-w-full select-none object-contain"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center",
            }}
          />
        ) : (
          <p className="text-red-300">
            {error || "Unable to display this sequence."}
          </p>
        )}
      </div>
    </section>
  );
}
