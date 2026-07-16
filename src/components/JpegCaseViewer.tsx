"use client";

import {
  DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
  const viewerRef = useRef<HTMLElement | null>(null);

  const [studyCase, setStudyCase] =
    useState<CasePayload | null>(null);

  const [activeSequenceId, setActiveSequenceId] =
    useState<string | null>(null);

  const [loadedSequences, setLoadedSequences] =
    useState<Record<string, LoadedSequence>>({});

  const [
    imageIndexBySequence,
    setImageIndexBySequence,
  ] = useState<Record<string, number>>({});

  const [zoom, setZoom] = useState(1);
  const [loadingCase, setLoadingCase] = useState(true);

  const [
    loadingSequenceId,
    setLoadingSequenceId,
  ] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadCase() {
      try {
        setLoadingCase(true);
        setError("");
        setStudyCase(null);
        setActiveSequenceId(null);
        setLoadedSequences({});
        setImageIndexBySequence({});
        setZoom(1);

        const response = await fetch(
          `/api/cases/${encodeURIComponent(caseCode)}`,
          {
            cache: "no-store",
          },
        );

        const payload = (await response.json()) as
          | CasePayload
          | { error?: string };

        if (!response.ok) {
          throw new Error(
            "error" in payload && payload.error
              ? payload.error
              : "Unable to load case.",
          );
        }

        if (!active) {
          return;
        }

        const casePayload = payload as CasePayload;

        setStudyCase(casePayload);
        setActiveSequenceId(
          casePayload.sequences[0]?.id ?? null,
        );
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load case.",
        );
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
    if (!activeSequenceId) {
      return;
    }

    if (loadedSequences[activeSequenceId]) {
      return;
    }

    const sequenceId = activeSequenceId;
    let active = true;

    async function loadSequence() {
      try {
        setLoadingSequenceId(sequenceId);
        setError("");

        const response = await fetch(
          `/api/cases/${encodeURIComponent(
            caseCode,
          )}/sequences/${encodeURIComponent(sequenceId)}`,
          {
            cache: "no-store",
          },
        );

        const payload = (await response.json()) as
          | LoadedSequence
          | { error?: string };

        if (!response.ok) {
          throw new Error(
            "error" in payload && payload.error
              ? payload.error
              : "Unable to load sequence.",
          );
        }

        if (!active) {
          return;
        }

        setLoadedSequences((current) => ({
          ...current,
          [sequenceId]: payload as LoadedSequence,
        }));

        setImageIndexBySequence((current) => ({
          ...current,
          [sequenceId]: current[sequenceId] ?? 0,
        }));
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load sequence.",
        );
      } finally {
        if (active) {
          setLoadingSequenceId(null);
        }
      }
    }

    void loadSequence();

    return () => {
      active = false;
    };
  }, [activeSequenceId, caseCode, loadedSequences]);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(
        document.fullscreenElement === viewerRef.current,
      );
    }

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange,
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange,
      );
    };
  }, []);

  const activeSummary = useMemo(() => {
    return (
      studyCase?.sequences.find(
        (sequence) => sequence.id === activeSequenceId,
      ) ?? null
    );
  }, [activeSequenceId, studyCase]);

  const activeSequence = activeSequenceId
    ? loadedSequences[activeSequenceId] ?? null
    : null;

  const currentIndex = activeSequence
    ? imageIndexBySequence[activeSequence.id] ?? 0
    : 0;

  const currentImage =
    activeSequence?.images[currentIndex] ?? null;

  const isLoadingActiveSequence =
    activeSequenceId !== null &&
    loadingSequenceId === activeSequenceId;

  const setCurrentIndex = useCallback(
    (nextIndex: number) => {
      if (!activeSequence) {
        return;
      }

      const maximumIndex = Math.max(
        activeSequence.images.length - 1,
        0,
      );

      const safeIndex = Math.min(
        Math.max(nextIndex, 0),
        maximumIndex,
      );

      setImageIndexBySequence((current) => ({
        ...current,
        [activeSequence.id]: safeIndex,
      }));
    },
    [activeSequence],
  );

  const previousImage = useCallback(() => {
    if (
      !activeSequence ||
      activeSequence.images.length === 0
    ) {
      return;
    }

    setCurrentIndex(
      currentIndex === 0
        ? activeSequence.images.length - 1
        : currentIndex - 1,
    );
  }, [activeSequence, currentIndex, setCurrentIndex]);

  const nextImage = useCallback(() => {
    if (
      !activeSequence ||
      activeSequence.images.length === 0
    ) {
      return;
    }

    setCurrentIndex(
      currentIndex === activeSequence.images.length - 1
        ? 0
        : currentIndex + 1,
    );
  }, [activeSequence, currentIndex, setCurrentIndex]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowRight"
      ) {
        event.preventDefault();
        nextImage();
      }

      if (
        event.key === "ArrowUp" ||
        event.key === "ArrowLeft"
      ) {
        event.preventDefault();
        previousImage();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [nextImage, previousImage]);

  function selectSequence(sequenceId: string) {
    setActiveSequenceId(sequenceId);
    setZoom(1);
    setError("");
  }

  function handleSequenceDragStart(
    event: DragEvent<HTMLButtonElement>,
    sequenceId: string,
  ) {
    event.dataTransfer.setData(
      "application/x-rag-sequence",
      sequenceId,
    );

    event.dataTransfer.effectAllowed = "copy";
  }

  function handleViewerDragOver(
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }

  function handleViewerDragLeave(
    event: DragEvent<HTMLDivElement>,
  ) {
    if (
      event.currentTarget.contains(
        event.relatedTarget as Node | null,
      )
    ) {
      return;
    }

    setIsDragOver(false);
  }

  function handleViewerDrop(
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();
    setIsDragOver(false);

    const sequenceId = event.dataTransfer.getData(
      "application/x-rag-sequence",
    );

    if (!sequenceId) {
      return;
    }

    const exists = studyCase?.sequences.some(
      (sequence) => sequence.id === sequenceId,
    );

    if (exists) {
      selectSequence(sequenceId);
    }
  }

  async function toggleFullscreen() {
    try {
      if (!viewerRef.current) {
        return;
      }

      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await viewerRef.current.requestFullscreen();
      }
    } catch (fullscreenError) {
      console.error(
        "Unable to change fullscreen mode:",
        fullscreenError,
      );
    }
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
    <section
      ref={viewerRef}
      className={`overflow-hidden border border-slate-700 bg-black ${
        isFullscreen
          ? "h-screen w-screen rounded-none"
          : "rounded-xl"
      }`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 bg-slate-950 px-4 py-3 text-white">
        <div>
          <p className="font-semibold">
            {studyCase.caseCode}
          </p>

          <p className="text-sm text-slate-400">
            {activeSummary?.name ?? "Sequence"}

            {activeSequence
              ? ` — image ${currentIndex + 1} of ${
                  activeSequence.images.length
                }`
              : activeSummary
                ? ` — ${activeSummary.imageCount} images`
                : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={previousImage}
            disabled={!activeSequence}
            className="rounded bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <button
            type="button"
            onClick={nextImage}
            disabled={!activeSequence}
            className="rounded bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>

          <button
            type="button"
            onClick={() =>
              setZoom((value) => Math.min(value + 0.25, 4))
            }
            disabled={!activeSequence}
            className="rounded bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Zoom +
          </button>

          <button
            type="button"
            onClick={() =>
              setZoom((value) =>
                Math.max(value - 0.25, 0.5),
              )
            }
            disabled={!activeSequence}
            className="rounded bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Zoom −
          </button>

          <button
            type="button"
            onClick={() => setZoom(1)}
            disabled={!activeSequence}
            className="rounded bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400"
          >
            {isFullscreen ? "Exit full screen" : "Expand"}
          </button>
        </div>
      </header>

      <div
        className={`grid ${
          isFullscreen
            ? "h-[calc(100vh-61px)]"
            : "min-h-[650px]"
        } grid-cols-[150px_minmax(0,1fr)_52px]`}
      >
        <aside className="overflow-y-auto border-r border-slate-700 bg-slate-950 p-3 text-white">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Sequences
          </p>

          <div className="grid gap-2">
            {studyCase.sequences.map((sequence) => {
              const isActive =
                sequence.id === activeSequenceId;

              const isLoading =
                loadingSequenceId === sequence.id;

              return (
                <button
                  key={sequence.id}
                  type="button"
                  draggable
                  onDragStart={(event) =>
                    handleSequenceDragStart(
                      event,
                      sequence.id,
                    )
                  }
                  onClick={() =>
                    selectSequence(sequence.id)
                  }
                  className={
                    isActive
                      ? "cursor-grab rounded-lg border border-cyan-400 bg-cyan-400/15 p-3 text-left text-cyan-100 active:cursor-grabbing"
                      : "cursor-grab rounded-lg border border-white/10 bg-slate-900 p-3 text-left text-slate-200 hover:border-slate-500 hover:bg-slate-800 active:cursor-grabbing"
                  }
                >
                  <span className="block text-sm font-medium">
                    {sequence.name}
                  </span>

                  <span className="mt-1 block text-xs text-slate-400">
                    {sequence.imageCount} images
                    {isLoading ? " · loading" : ""}
                  </span>

                  <span className="mt-2 block text-[10px] uppercase tracking-wide text-slate-500">
                    Drag into viewer
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div
          className={`relative flex min-w-0 items-center justify-center overflow-auto p-4 transition ${
            isDragOver
              ? "bg-cyan-400/10 ring-2 ring-inset ring-cyan-400"
              : "bg-black"
          }`}
          onDragOver={handleViewerDragOver}
          onDragLeave={handleViewerDragLeave}
          onDrop={handleViewerDrop}
          onWheel={(event) => {
            if (!activeSequence) {
              return;
            }

            event.preventDefault();

            if (event.deltaY > 0) {
              nextImage();
            } else if (event.deltaY < 0) {
              previousImage();
            }
          }}
        >
          {isDragOver ? (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/50">
              <div className="rounded-xl border border-cyan-400 bg-slate-950 px-6 py-4 text-center text-cyan-100 shadow-xl">
                Drop sequence to display it
              </div>
            </div>
          ) : null}

          {isLoadingActiveSequence ? (
            <div className="text-center text-white">
              <p className="font-medium">
                Loading {activeSummary?.name ?? "sequence"}…
              </p>

              <p className="mt-2 text-sm text-slate-400">
                Preparing secure image links.
              </p>
            </div>
          ) : currentImage ? (
            <img
              src={currentImage.signedUrl}
              alt={`${studyCase.caseCode}, ${
                activeSummary?.name ?? "sequence"
              }, image ${currentIndex + 1}`}
              draggable={false}
              className={
                isFullscreen
                  ? "max-h-[calc(100vh-100px)] max-w-full select-none object-contain"
                  : "max-h-[78vh] max-w-full select-none object-contain"
              }
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

        <aside className="flex flex-col items-center border-l border-slate-700 bg-slate-950 py-4 text-white">
          <span className="mb-3 text-xs text-slate-400">
            {activeSequence ? currentIndex + 1 : 0}
          </span>

          <div className="flex min-h-0 flex-1 items-center justify-center">
            <input
              type="range"
              min={0}
              max={
                activeSequence
                  ? Math.max(activeSequence.images.length - 1, 0)
                  : 0
              }
              step={1}
              value={currentIndex}
              disabled={
                !activeSequence ||
                activeSequence.images.length <= 1
              }
              onChange={(event) =>
                setCurrentIndex(Number(event.target.value))
              }
              aria-label="Image position"
              className="h-full min-h-[420px] w-6 cursor-pointer accent-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                writingMode: "vertical-lr",
                direction: "rtl",
              }}
            />
          </div>

          <span className="mt-3 text-xs text-slate-400">
            {activeSequence?.images.length ?? 0}
          </span>
        </aside>
      </div>

      {!isFullscreen ? (
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300">
          <span>
            Click or drag a sequence into the viewer. Use the
            mouse wheel, arrow keys, or right slider to navigate.
          </span>

          <span>Zoom: {Math.round(zoom * 100)}%</span>
        </footer>
      ) : null}
    </section>
  );
}
