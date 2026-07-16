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
    sequenceId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { caseCode, sequenceId } = await context.params;

    const { data: studyCase, error: caseError } =
      await supabaseAdmin
        .from("cases")
        .select("id, case_code, image_paths")
        .eq("case_code", caseCode)
        .eq("active", true)
        .single();

    if (caseError || !studyCase) {
      return NextResponse.json(
        { error: "Case not found." },
        { status: 404 },
      );
    }

    const storedSequences = Array.isArray(studyCase.image_paths)
      ? (studyCase.image_paths as StoredSequence[])
      : [];

    const sequence = storedSequences.find(
      (item) => item.id === sequenceId,
    );

    if (!sequence) {
      return NextResponse.json(
        { error: "Sequence not found." },
        { status: 404 },
      );
    }

    const { data: signedFiles, error: signingError } =
      await supabaseAdmin.storage
        .from("case-images")
        .createSignedUrls(sequence.images, 60 * 60);

    if (signingError || !signedFiles) {
      console.error(signingError);

      return NextResponse.json(
        { error: "Unable to load sequence images." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      id: sequence.id,
      name: sequence.name,
      order: sequence.order ?? null,
      images: sequence.images.map((path, index) => ({
        path,
        signedUrl: signedFiles[index]?.signedUrl ?? "",
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
