"use client";

import { useEffect, useMemo, useState } from "react";

type CaseImage = {
  path: string;
  signedUrl: string;
};

type CaseSequence = {
  id: string;
  name: string;
  order: number | null;
  images: CaseImage[];
};

type CasePayload = {
  id: string;
  caseCode: string;
  dataset: string;
  title: string | null;
  clinicalText: string;
  sequences: CaseSequence[];
};

type JpegCaseViewerProps = {
  caseCode: string;
};

export default function JpegCaseViewer({
  caseCode,
}: JpegCaseViewerProps) {
  const [studyCase, setStudyCase] = useState<CasePayload | null>(null);
  const [activeSequenceIndex, setActiveSequenceIndex] = useState(0);
  const [imageIndexBySequence, setImageIndexBySequence] = useState<
    Record<string, number>
  >({});
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCase() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/cases/${encodeURIComponent(caseCode)}`,
          {
            cache: "no-store",
          },
        );

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load case.");
        }

        if (active) {
          setStudyCase(payload);
          setActiveSequenceIndex(0);
          setImageIndexBySequence({});
          setZoom(1);
        }
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
          setLoading(false);
        }
      }
    }

    void loadCase();

    return () => {
      active = false;
    };
  }, [caseCode]);

  const activeSequence = useMemo(() => {
    if (!studyCase) {
      return null;
    }

    return studyCase.sequences[activeSequenceIndex] ?? null;
  }, [activeSequenceIndex, studyCase]);

  const currentIndex = activeSequence
    ? imageIndexBySequence[activeSequence.id] ?? 0
    : 0;

  const currentImage =
    activeSequence?.images[currentIndex] ?? null;

  function setCurrentIndex(nextIndex: number) {
    if (!activeSequence) {
      return;
    }

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

  if (loading) {
    return (
      <div className="flex min-h-[650px] items-center justify-center rounded-xl bg-black text-white">
        Loading case images…
      </div>
    );
  }

  if (error || !studyCase) {
    return (
      <div className="flex min-h-[650px] items-center justify-center rounded-xl bg-black p-6 text-red-300">
        {error || "Unable to load case."}
      </div>
    );
  }

  if (!activeSequence || !currentImage) {
    return (
      <div className="flex min-h-[650px] items-center justify-center rounded-xl bg-black text-white">
        No images are configured for this case.
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-700 bg-black">
      <div className="flex flex-wrap gap-2 border-b border-slate-700 bg-slate-900 p-3">
        {studyCase.sequences.map((sequence, index) => (
          <button
            key={sequence.id}
            type="button"
            onClick={() => {
              setActiveSequenceIndex(index);
              setZoom(1);
            }}
            className={
              index === activeSequenceIndex
                ? "rounded bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950"
                : "rounded bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600"
            }
          >
            {sequence.name}
          </button>
        ))}
      </div>

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 bg-slate-950 px-4 py-3 text-white">
        <div>
          <p className="font-semibold">{studyCase.caseCode}</p>

          <p className="text-sm text-slate-400">
            {activeSequence.name} — image {currentIndex + 1} of{" "}
            {activeSequence.images.length}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={previousImage}
            className="rounded bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600"
          >
            Previous
          </button>

          <button
            type="button"
            onClick={nextImage}
            className="rounded bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600"
          >
            Next
          </button>

          <button
            type="button"
            onClick={() =>
              setZoom((value) => Math.min(value + 0.25, 4))
            }
            className="rounded bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600"
          >
            Zoom +
          </button>

          <button
            type="button"
            onClick={() =>
              setZoom((value) => Math.max(value - 0.25, 0.5))
            }
            className="rounded bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600"
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
          if (event.deltaY > 0) {
            nextImage();
          } else {
            previousImage();
          }
        }}
      >
        <img
          src={currentImage.signedUrl}
          alt={`${studyCase.caseCode}, ${activeSequence.name}, image ${
            currentIndex + 1
          }`}
          draggable={false}
          className="max-h-[78vh] max-w-full select-none object-contain"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center",
          }}
        />
      </div>

      <footer className="border-t border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300">
        Use the mouse wheel to scroll through images.
      </footer>
    </section>
  );
}