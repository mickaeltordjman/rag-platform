"use client";

import {
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
  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const [loadingCase, setLoadingCase] =
    useState(true);

  const [
    loadingSequenceId,
    setLoadingSequenceId,
  ] = useState<string | null>(null);

  const [error, setError] = useState("");

  const activeThumbnailRef =
    useRef<HTMLButtonElement | null>(null);

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
        setSidebarOpen(true);

        const response = await fetch(
          `/api/cases/${encodeURIComponent(
            caseCode,
          )}`,
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

        const casePayload =
          payload as CasePayload;

        setStudyCase(casePayload);

        setActiveSequenceId(
          casePayload.sequences[0]?.id ??
            null,
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

    if (
      loadedSequences[activeSequenceId]
    ) {
      return;
    }

    const sequenceId =
      activeSequenceId;

    let active = true;

    async function loadSequence() {
      try {
        setLoadingSequenceId(
          sequenceId,
        );

        setError("");

        const response = await fetch(
          `/api/cases/${encodeURIComponent(
            caseCode,
          )}/sequences/${encodeURIComponent(
            sequenceId,
          )}`,
          {
            cache: "no-store",
          },
        );

        const payload =
          (await response.json()) as
            | LoadedSequence
            | { error?: string };

        if (!response.ok) {
          throw new Error(
            "error" in payload &&
              payload.error
              ? payload.error
              : "Unable to load sequence.",
          );
        }

        if (!active) {
          return;
        }

        setLoadedSequences(
          (current) => ({
            ...current,
            [sequenceId]:
              payload as LoadedSequence,
          }),
        );

        setImageIndexBySequence(
          (current) => ({
            ...current,
            [sequenceId]:
              current[sequenceId] ?? 0,
          }),
        );
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
  }, [
    activeSequenceId,
    caseCode,
    loadedSequences,
  ]);

  const activeSummary = useMemo(
    () =>
      studyCase?.sequences.find(
        (sequence) =>
          sequence.id ===
          activeSequenceId,
      ) ?? null,
    [activeSequenceId, studyCase],
  );

  const activeSequence =
    activeSequenceId
      ? loadedSequences[
          activeSequenceId
        ] ?? null
      : null;

  const currentIndex =
    activeSequence
      ? imageIndexBySequence[
          activeSequence.id
        ] ?? 0
      : 0;

  const currentImage =
    activeSequence?.images[
      currentIndex
    ] ?? null;

  const isLoadingActiveSequence =
    activeSequenceId !== null &&
    loadingSequenceId ===
      activeSequenceId;

  useEffect(() => {
    activeThumbnailRef.current?.scrollIntoView(
      {
        behavior: "smooth",
        block: "nearest",
      },
    );
  }, [
    activeSequenceId,
    currentIndex,
  ]);

  function setCurrentIndex(
    nextIndex: number,
  ) {
    if (!activeSequence) {
      return;
    }

    const lastIndex =
      activeSequence.images.length - 1;

    const safeIndex = Math.min(
      Math.max(nextIndex, 0),
      Math.max(lastIndex, 0),
    );

    setImageIndexBySequence(
      (current) => ({
        ...current,
        [activeSequence.id]:
          safeIndex,
      }),
    );
  }

  function previousImage() {
    if (
      !activeSequence ||
      activeSequence.images.length === 0
    ) {
      return;
    }

    const nextIndex =
      currentIndex === 0
        ? activeSequence.images.length -
          1
        : currentIndex - 1;

    setCurrentIndex(nextIndex);
  }

  function nextImage() {
    if (
      !activeSequence ||
      activeSequence.images.length === 0
    ) {
      return;
    }

    const nextIndex =
      currentIndex ===
      activeSequence.images.length - 1
        ? 0
        : currentIndex + 1;

    setCurrentIndex(nextIndex);
  }

  function selectSequence(
    sequenceId: string,
  ) {
    setActiveSequenceId(
      sequenceId,
    );

    setZoom(1);
    setError("");
  }

  function selectImage(
    imageIndex: number,
  ) {
    setCurrentIndex(imageIndex);
    setZoom(1);
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

  if (
    !studyCase ||
    studyCase.sequences.length === 0
  ) {
    return (
      <div className="flex min-h-[650px] items-center justify-center rounded-xl bg-black text-white">
        No image sequences are
        configured.
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-700 bg-black">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 bg-slate-950 px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              setSidebarOpen(
                (current) => !current,
              )
            }
            className="rounded bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600"
            aria-label={
              sidebarOpen
                ? "Hide image sidebar"
                : "Show image sidebar"
            }
          >
            {sidebarOpen
              ? "Hide images"
              : "Show images"}
          </button>

          <div>
            <p className="font-semibold">
              {studyCase.caseCode}
            </p>

            <p className="text-sm text-slate-400">
              {activeSummary?.name ??
                "Sequence"}

              {activeSequence
                ? ` — image ${
                    currentIndex + 1
                  } of ${
                    activeSequence.images
                      .length
                  }`
                : activeSummary
                  ? ` — ${activeSummary.imageCount} images`
                  : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
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
              setZoom((value) =>
                Math.min(
                  value + 0.25,
                  4,
                ),
              )
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
                Math.max(
                  value - 0.25,
                  0.5,
                ),
              )
            }
            disabled={!activeSequence}
            className="rounded bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Zoom −
          </button>

          <button
            type="button"
            onClick={() =>
              setZoom(1)
            }
            disabled={!activeSequence}
            className="rounded bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reset
          </button>
        </div>
      </header>

      <div className="flex min-h-[650px]">
        {sidebarOpen ? (
          <aside className="flex w-52 shrink-0 flex-col border-r border-slate-700 bg-slate-950 text-white sm:w-60">
            <div className="border-b border-slate-700 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Sequences
              </p>

              <div className="mt-3 grid gap-2">
                {studyCase.sequences.map(
                  (sequence) => {
                    const isActive =
                      sequence.id ===
                      activeSequenceId;

                    const isLoaded =
                      Boolean(
                        loadedSequences[
                          sequence.id
                        ],
                      );

                    const isLoading =
                      loadingSequenceId ===
                      sequence.id;

                    return (
                      <button
                        key={
                          sequence.id
                        }
                        type="button"
                        onClick={() =>
                          selectSequence(
                            sequence.id,
                          )
                        }
                        className={
                          isActive
                            ? "rounded-lg border border-cyan-400 bg-cyan-400/15 px-3 py-2 text-left text-sm text-cyan-100"
                            : "rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                        }
                      >
                        <span className="block font-medium">
                          {
                            sequence.name
                          }
                        </span>

                        <span className="mt-1 block text-xs text-slate-400">
                          {
                            sequence.imageCount
                          }{" "}
                          images
                          {isLoading
                            ? " · loading"
                            : isLoaded
                              ? " · loaded"
                              : ""}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Images
                </p>

                {activeSequence ? (
                  <span className="text-xs text-slate-500">
                    {currentIndex + 1}/
                    {
                      activeSequence
                        .images.length
                    }
                  </span>
                ) : null}
              </div>

              {isLoadingActiveSequence ? (
                <p className="text-sm text-slate-400">
                  Loading thumbnails…
                </p>
              ) : activeSequence ? (
                <div className="grid grid-cols-2 gap-2">
                  {activeSequence.images.map(
                    (
                      image,
                      imageIndex,
                    ) => {
                      const isActive =
                        imageIndex ===
                        currentIndex;

                      return (
                        <button
                          key={
                            image.path
                          }
                          ref={
                            isActive
                              ? activeThumbnailRef
                              : null
                          }
                          type="button"
                          onClick={() =>
                            selectImage(
                              imageIndex,
                            )
                          }
                          className={
                            isActive
                              ? "overflow-hidden rounded-lg border-2 border-cyan-400 bg-slate-800"
                              : "overflow-hidden rounded-lg border border-white/10 bg-slate-900 hover:border-slate-500"
                          }
                          aria-label={`Open image ${
                            imageIndex + 1
                          }`}
                        >
                          <div className="aspect-square bg-black">
                            <img
                              src={
                                image.signedUrl
                              }
                              alt={`Thumbnail ${
                                imageIndex + 1
                              }`}
                              loading="lazy"
                              draggable={
                                false
                              }
                              className="h-full w-full object-contain"
                            />
                          </div>

                          <div
                            className={
                              isActive
                                ? "bg-cyan-400 px-2 py-1 text-center text-xs font-semibold text-slate-950"
                                : "bg-slate-900 px-2 py-1 text-center text-xs text-slate-400"
                            }
                          >
                            {imageIndex +
                              1}
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Select a sequence to
                  view its images.
                </p>
              )}
            </div>
          </aside>
        ) : null}

        <div
          className="flex min-w-0 flex-1 items-center justify-center overflow-auto p-4"
          onWheel={(event) => {
            if (!activeSequence) {
              return;
            }

            event.preventDefault();

            if (event.deltaY > 0) {
              nextImage();
            } else if (
              event.deltaY < 0
            ) {
              previousImage();
            }
          }}
        >
          {isLoadingActiveSequence ? (
            <div className="text-center text-white">
              <p className="font-medium">
                Loading{" "}
                {activeSummary?.name ??
                  "sequence"}
                …
              </p>

              <p className="mt-2 text-sm text-slate-400">
                Preparing secure image
                links.
              </p>
            </div>
          ) : currentImage ? (
            <img
              src={
                currentImage.signedUrl
              }
              alt={`${studyCase.caseCode}, ${
                activeSummary?.name ??
                "sequence"
              }, image ${
                currentIndex + 1
              }`}
              draggable={false}
              className="max-h-[78vh] max-w-full select-none object-contain"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin:
                  "center",
              }}
            />
          ) : (
            <p className="text-red-300">
              {error ||
                "Unable to display this sequence."}
            </p>
          )}
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300">
        <span>
          Use the mouse wheel to move
          through the active sequence.
        </span>

        <span>
          Zoom:{" "}
          {Math.round(zoom * 100)}%
        </span>
      </footer>
    </section>
  );
}
