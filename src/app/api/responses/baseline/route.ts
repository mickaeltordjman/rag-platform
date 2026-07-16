import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type BaselineRequest = {
  assignmentId?: string;
  mainDiagnosis?: string;
  differentials?: string[];
  confidence?: number;
};

type AssignmentRow = {
  id: string;
  status: string;
  intervention_arm: "GPT" | "GPT_OPENSCHOLAR";
  baseline_submitted_at: string | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BaselineRequest;

    const assignmentId = body.assignmentId?.trim();
    const mainDiagnosis = body.mainDiagnosis?.trim();
    const confidence = Number(body.confidence);

    if (!assignmentId) {
      return NextResponse.json(
        {
          error: "Assignment ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!mainDiagnosis) {
      return NextResponse.json(
        {
          error: "Main diagnosis is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !Number.isInteger(confidence) ||
      confidence < 0 ||
      confidence > 100
    ) {
      return NextResponse.json(
        {
          error: "Confidence must be between 0 and 100.",
        },
        {
          status: 400,
        },
      );
    }

    const differentials = Array.isArray(body.differentials)
      ? body.differentials
      : [];

    const differential1 =
      typeof differentials[0] === "string"
        ? differentials[0].trim() || null
        : null;

    const differential2 =
      typeof differentials[1] === "string"
        ? differentials[1].trim() || null
        : null;

    const differential3 =
      typeof differentials[2] === "string"
        ? differentials[2].trim() || null
        : null;

    /*
     * Retrieve the assignment and confirm that the baseline
     * response has not already been submitted.
     */
    const {
      data: assignmentData,
      error: assignmentError,
    } = await supabaseAdmin
      .from("assignments")
      .select(
        "id, status, intervention_arm, baseline_submitted_at",
      )
      .eq("id", assignmentId)
      .single();

    if (assignmentError || !assignmentData) {
      return NextResponse.json(
        {
          error: "Assignment not found.",
        },
        {
          status: 404,
        },
      );
    }

    const assignment = assignmentData as AssignmentRow;

    if (
      assignment.baseline_submitted_at ||
      (assignment.status !== "NOT_STARTED" &&
        assignment.status !== "BASELINE_IN_PROGRESS")
    ) {
      return NextResponse.json(
        {
          error: "Baseline response is already locked.",
        },
        {
          status: 409,
        },
      );
    }

    const submittedAt = new Date().toISOString();

    /*
     * Save the baseline diagnostic response.
     */
    const {
      data: responseRow,
      error: responseError,
    } = await supabaseAdmin
      .from("responses")
      .insert({
        assignment_id: assignmentId,
        phase: "BASELINE",
        main_diagnosis: mainDiagnosis,
        differential_1: differential1,
        differential_2: differential2,
        differential_3: differential3,
        confidence,
      })
      .select("id")
      .single();

    if (responseError || !responseRow) {
      console.error(
        "Unable to save baseline response:",
        responseError,
      );

      return NextResponse.json(
        {
          error: "Unable to save baseline response.",
        },
        {
          status: 500,
        },
      );
    }

    /*
     * Lock the baseline response and unlock the AI phase.
     *
     * The status filter reduces the chance of two simultaneous
     * submissions updating the same assignment.
     */
    const {
      data: updatedAssignment,
      error: updateError,
    } = await supabaseAdmin
      .from("assignments")
      .update({
        status: "BASELINE_SUBMITTED",
        baseline_submitted_at: submittedAt,
        ai_unlocked_at: submittedAt,
      })
      .eq("id", assignmentId)
      .in("status", [
        "NOT_STARTED",
        "BASELINE_IN_PROGRESS",
      ])
      .select("id")
      .maybeSingle();

    if (updateError || !updatedAssignment) {
      console.error(
        "Baseline saved, but assignment update failed:",
        updateError,
      );

      return NextResponse.json(
        {
          error:
            "Baseline saved, but assignment update failed.",
        },
        {
          status: 500,
        },
      );
    }

    /*
     * Record both study milestones with the same server timestamp.
     */
    const { error: eventError } = await supabaseAdmin
      .from("study_events")
      .insert([
        {
          assignment_id: assignmentId,
          event_type: "BASELINE_SUBMITTED",
          occurred_at: submittedAt,
          metadata: {
            responseId: responseRow.id,
            confidence,
            differentialCount: [
              differential1,
              differential2,
              differential3,
            ].filter(Boolean).length,
          },
        },
        {
          assignment_id: assignmentId,
          event_type: "AI_UNLOCKED",
          occurred_at: submittedAt,
          metadata: {
            interventionArm:
              assignment.intervention_arm,
          },
        },
      ]);

    if (eventError) {
      /*
       * The diagnostic response is already safely stored.
       * Log the timing-event problem without asking the reader
       * to resubmit the baseline answer.
       */
      console.error(
        "Baseline saved, but study events were not recorded:",
        eventError,
      );
    }

    return NextResponse.json({
      success: true,
      interventionArm:
        assignment.intervention_arm,
      status: "BASELINE_SUBMITTED",
      baselineSubmittedAt: submittedAt,
      aiUnlockedAt: submittedAt,
      responseId: responseRow.id,
      timingEventsRecorded: !eventError,
    });
  } catch (error) {
    console.error(
      "Baseline route error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      },
      {
        status: 500,
      },
    );
  }
}
