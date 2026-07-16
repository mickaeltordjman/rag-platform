import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type StoredSequence = {
  id: string;
  name: string;
  order?: number;
  images: string[];
};

type RouteContext = {
  params: Promise<{
    caseCode: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { caseCode } = await context.params;

    const { data: studyCase, error: caseError } =
      await supabaseAdmin
        .from("cases")
        .select(`
          id,
          case_code,
          dataset,
          title,
          clinical_text,
          image_paths,
          sequence_position
        `)
        .eq("case_code", caseCode)
        .eq("active", true)
        .single();

    if (caseError || !studyCase) {
      console.error(caseError);

      return NextResponse.json(
        { error: "Case not found." },
        { status: 404 },
      );
    }

    const storedSequences = Array.isArray(studyCase.image_paths)
      ? (studyCase.image_paths as StoredSequence[])
      : [];

    const sequences = storedSequences
      .filter(
        (sequence) =>
          typeof sequence?.id === "string" &&
          typeof sequence?.name === "string" &&
          Array.isArray(sequence?.images),
      )
      .sort(
        (a, b) =>
          (a.order ?? Number.MAX_SAFE_INTEGER) -
          (b.order ?? Number.MAX_SAFE_INTEGER),
      );

    const allPaths = sequences.flatMap(
      (sequence) => sequence.images,
    );

    const { data: signedFiles, error: signingError } =
      await supabaseAdmin.storage
        .from("case-images")
        .createSignedUrls(allPaths, 60 * 60);

    if (signingError || !signedFiles) {
      console.error(signingError);

      return NextResponse.json(
        { error: "Unable to load case images." },
        { status: 500 },
      );
    }

    const signedUrlByPath = new Map(
      signedFiles.map((file, index) => [
        allPaths[index],
        file.signedUrl,
      ]),
    );

    return NextResponse.json({
      id: studyCase.id,
      caseCode: studyCase.case_code,
      dataset: studyCase.dataset,
      title: studyCase.title,
      clinicalText: studyCase.clinical_text,
      sequencePosition: studyCase.sequence_position,
      sequences: sequences.map((sequence) => ({
        id: sequence.id,
        name: sequence.name,
        order: sequence.order ?? null,
        images: sequence.images.map((path) => ({
          path,
          signedUrl: signedUrlByPath.get(path) ?? "",
        })),
      })),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 },
    );
  }
}
