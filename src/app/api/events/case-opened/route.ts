import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type RequestBody = {
  assignmentId?: string;
  caseId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    const assignmentId = body.assignmentId?.trim();
    const caseId = body.caseId?.trim();

    if (!assignmentId || !caseId) {
      return NextResponse.json(
        {
          error: "Missing assignmentId or caseId.",
        },
        {
          status: 400,
        },
      );
    }

    const now = new Date().toISOString();

    const {
      data: assignment,
      error: assignmentError,
    } = await supabaseAdmin
      .from("assignments")
      .select("id, opened_at")
      .eq("id", assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        {
          error: "Assignment not found.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Only save the first opening time.
     * Reloading the page will not overwrite it.
     */
    if (!assignment.opened_at) {
      const { error: updateError } =
        await supabaseAdmin
          .from("assignments")
          .update({
            opened_at: now,
            status: "IN_PROGRESS",
          })
          .eq("id", assignmentId);

      if (updateError) {
        throw new Error(
          `Unable to update assignment: ${updateError.message}`,
        );
      }

      const { error: eventError } =
        await supabaseAdmin
          .from("study_events")
          .insert({
            assignment_id: assignmentId,
            event_type: "CASE_OPENED",
            occurred_at: now,
            metadata: {
              caseId,
            },
          });

      if (eventError) {
        throw new Error(
          `Unable to record CASE_OPENED: ${eventError.message}`,
        );
      }
    }

    return NextResponse.json({
      success: true,
      openedAt: assignment.opened_at ?? now,
    });
  } catch (error) {
    console.error("Case-opened route error:", error);

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
