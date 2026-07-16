import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type FinalRequest = {
  assignmentId: string;
  mainDiagnosis: string;
  differentials: [string, string, string];
  confidence: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FinalRequest;

    const assignmentId = body.assignmentId?.trim();
    const mainDiagnosis = body.mainDiagnosis?.trim();
    const confidence = Number(body.confidence);

    if (!assignmentId || !mainDiagnosis) {
      return NextResponse.json(
        { error: "Assignment and main diagnosis are required." },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(confidence) ||
      confidence < 0 ||
      confidence > 100
    ) {
      return NextResponse.json(
        { error: "Confidence must be between 0 and 100." },
        { status: 400 },
      );
    }

    const { data: assignment, error: assignmentError } =
      await supabaseAdmin
        .from("assignments")
        .select("id, status")
        .eq("id", assignmentId)
        .single();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: "Assignment not found." },
        { status: 404 },
      );
    }

    if (
      assignment.status !== "BASELINE_SUBMITTED" &&
      assignment.status !== "AI_IN_PROGRESS"
    ) {
      return NextResponse.json(
        { error: "Final response cannot be submitted yet." },
        { status: 409 },
      );
    }

    const differentials = Array.isArray(body.differentials)
      ? body.differentials
      : ["", "", ""];

    const { error: responseError } =
      await supabaseAdmin.from("responses").insert({
        assignment_id: assignmentId,
        phase: "POST_AI",
        main_diagnosis: mainDiagnosis,
        differential_1: differentials[0]?.trim() || null,
        differential_2: differentials[1]?.trim() || null,
        differential_3: differentials[2]?.trim() || null,
        confidence,
      });

    if (responseError) {
      console.error(responseError);

      return NextResponse.json(
        { error: "Unable to save final response." },
        { status: 500 },
      );
    }

    const { error: updateError } =
      await supabaseAdmin
        .from("assignments")
        .update({
          status: "COMPLETED",
          final_submitted_at: new Date().toISOString(),
        })
        .eq("id", assignmentId);

    if (updateError) {
      console.error(updateError);

      return NextResponse.json(
        { error: "Final response saved, but completion update failed." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      status: "COMPLETED",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 },
    );
  }
}
