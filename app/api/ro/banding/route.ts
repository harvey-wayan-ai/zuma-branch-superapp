import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { ro_id, action } = body

    if (!ro_id) {
      return NextResponse.json(
        { success: false, error: "RO ID is required" },
        { status: 400 }
      )
    }

    if (!action || !['BANDING', 'CONFIRMED'].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Action must be BANDING or CONFIRMED" },
        { status: 400 }
      )
    }

    if (action === 'BANDING') {
      const { error: insertError } = await supabase
        .schema("branch_super_app_clawdbot")
        .from("ro_banding_notices")
        .insert({
          ro_id,
          banding_by: user.id,
          banding_at: new Date().toISOString(),
          status: "PENDING",
          message: "Warehouse confirmed correct quantities. SPG/B must re-check arrived stock. Possible miscount or fraud indication."
        })

      if (insertError) {
        console.error("Banding insert error:", insertError)
        return NextResponse.json(
          { success: false, error: insertError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: "Banding notice created successfully"
      })
    } else {
      const { error: updateError } = await supabase
        .schema("branch_super_app_clawdbot")
        .from("ro_receipt")
        .update({ 
          status: "CONFIRMED_DISCREPANCY",
          confirmed_by: user.id,
          confirmed_at: new Date().toISOString()
        })
        .eq("ro_id", ro_id)

      if (updateError) {
        console.error("Confirmed update error:", updateError)
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: "Discrepancy confirmed and resolved"
      })
    }
  } catch (err) {
    console.error("Banding API error:", err)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
