import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type FinalRequest = {
  assignmentId?: string;
  mainDiagnosis?: string;
  differentials?: string[];
  confidence?: number;
};

type AssignmentRow = {
  id: string;
  status: string;
  opened_at: string | null;
  baseline_submitted_at: string | null;
  ai_unlocked_at: string | null;
  final_submitted_at: string | null;
};

function elapsedMs(
  start: string | null,
  end: string,
) {
  if (!start) {
    return null;
  }

  const value =
    new Date(end).getTime() -
    new Date(start).getTime();

  return Number.isFinite(value)
    ? Math.max(0, value)
    : null;
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as FinalRequest;

    const assignmentId =
      body.assignmentId?.trim();

    const mainDiagnosis =
      body.mainDiagnosis?.trim();

    const confidence =
      Number(body.confidence);

    if (!assignmentId) {
      return NextResponse.json(
        {
          error:
            "Assignment ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!mainDiagnosis) {
      return NextResponse.json(
        {
          error:
            "Main diagnosis is required.",
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
          error:
            "Confidence must be between 0 and 100.",
        },
        {
          status: 400,
        },
      );
    }

    const differentials =
      Array.isArray(body.differentials)
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
     * Load the current assignment and verify that
     * the AI phase has already been unlocked.
     */
    const {
      data: assignmentData,
      error: assignmentError,
    } = await supabaseAdmin
      .from("assignments")
      .select(
        [
          "id",
          "status",
          "opened_at",
          "baseline_submitted_at",
          "ai_unlocked_at",
          "final_submitted_at",
        ].join(", "),
      )
      .eq("id", assignmentId)
      .single();

    if (
      assignmentError ||
      !assignmentData
    ) {
      return NextResponse.json(
        {
          error:
            "Assignment not found.",
        },
        {
          status: 404,
        },
      );
    }

    const assignment =
      assignmentData as AssignmentRow;

    if (
      assignment.final_submitted_at ||
      assignment.status === "COMPLETED"
    ) {
      return NextResponse.json(
        {
          error:
            "Final response is already locked.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      !assignment.baseline_submitted_at ||
      !assignment.ai_unlocked_at ||
      (
        assignment.status !==
          "BASELINE_SUBMITTED" &&
        assignment.status !==
          "AI_IN_PROGRESS"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Final response cannot be submitted yet.",
        },
        {
          status: 409,
        },
      );
    }

    const submittedAt =
      new Date().toISOString();

    /*
     * Save the post-AI diagnostic response.
     */
    const {
      data: responseRow,
      error: responseError,
    } = await supabaseAdmin
      .from("responses")
      .insert({
        assignment_id: assignmentId,
        phase: "POST_AI",
        main_diagnosis:
          mainDiagnosis,
        differential_1:
          differential1,
        differential_2:
          differential2,
        differential_3:
          differential3,
        confidence,
      })
      .select("id")
      .single();

    if (
      responseError ||
      !responseRow
    ) {
      console.error(
        "Unable to save final response:",
        responseError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to save final response.",
        },
        {
          status: 500,
        },
      );
    }

    /*
     * Mark the assignment as completed.
     * The status filter reduces the chance of
     * duplicate simultaneous submissions.
     */
    const {
      data: updatedAssignment,
      error: updateError,
    } = await supabaseAdmin
      .from("assignments")
      .update({
        status: "COMPLETED",
        final_submitted_at:
          submittedAt,
      })
      .eq("id", assignmentId)
      .in("status", [
        "BASELINE_SUBMITTED",
        "AI_IN_PROGRESS",
      ])
      .is(
        "final_submitted_at",
        null,
      )
      .select("id")
      .maybeSingle();

    if (
      updateError ||
      !updatedAssignment
    ) {
      console.error(
        "Final response saved, but completion update failed:",
        updateError,
      );

      return NextResponse.json(
        {
          error:
            "Final response saved, but completion update failed.",
        },
        {
          status: 500,
        },
      );
    }

    const totalCaseTimeMs =
      elapsedMs(
        assignment.opened_at,
        submittedAt,
      );

    const unaidedTimeMs =
      elapsedMs(
        assignment.opened_at,
        assignment.baseline_submitted_at ??
          submittedAt,
      );

    const aiPhaseTimeMs =
      elapsedMs(
        assignment.ai_unlocked_at,
        submittedAt,
      );

    /*
     * Record final-submission and completion events.
     */
    const {
      error: eventError,
    } = await supabaseAdmin
      .from("study_events")
      .insert([
        {
          assignment_id:
            assignmentId,
          event_type:
            "FINAL_SUBMITTED",
          occurred_at:
            submittedAt,
          metadata: {
            responseId:
              responseRow.id,
            confidence,
            differentialCount: [
              differential1,
              differential2,
              differential3,
            ].filter(Boolean).length,
            totalCaseTimeMs,
            unaidedTimeMs,
            aiPhaseTimeMs,
          },
        },
        {
          assignment_id:
            assignmentId,
          event_type:
            "CASE_COMPLETED",
          occurred_at:
            submittedAt,
          metadata: {
            responseId:
              responseRow.id,
            totalCaseTimeMs,
            unaidedTimeMs,
            aiPhaseTimeMs,
          },
        },
      ]);

    if (eventError) {
      console.error(
        "Final response saved, but study events were not recorded:",
        eventError,
      );
    }

    return NextResponse.json({
      success: true,
      status: "COMPLETED",
      finalSubmittedAt:
        submittedAt,
      responseId:
        responseRow.id,
      timing: {
        totalCaseTimeMs,
        unaidedTimeMs,
        aiPhaseTimeMs,
      },
      timingEventsRecorded:
        !eventError,
    });
  } catch (error) {
    console.error(
      "Final response route error:",
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
