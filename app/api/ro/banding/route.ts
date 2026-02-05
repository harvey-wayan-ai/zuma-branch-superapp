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
      const { data: receiptData, error: receiptError } = await supabase
        .schema("branch_super_app_clawdbot")
        .from("ro_receipt")
        .select("article_code, fisik, pairs_per_box, boxes_ddd, boxes_ljbb")
        .eq("ro_id", ro_id)

      if (receiptError) {
        console.error("Receipt fetch error:", receiptError)
        return NextResponse.json(
          { success: false, error: receiptError.message },
          { status: 500 }
        )
      }

      for (const item of receiptData || []) {
        const fisikBoxes = Math.ceil(item.fisik / item.pairs_per_box)
        
        const totalOriginalBoxes = item.boxes_ddd + item.boxes_ljbb
        let dddBoxes = 0
        let ljbbBoxes = 0
        
        if (totalOriginalBoxes > 0) {
          const dddRatio = item.boxes_ddd / totalOriginalBoxes
          dddBoxes = Math.round(fisikBoxes * dddRatio)
          ljbbBoxes = fisikBoxes - dddBoxes
        }

        const { error: processUpdateError } = await supabase
          .schema("branch_super_app_clawdbot")
          .from("ro_process")
          .update({ 
            status: "COMPLETED",
            boxes_allocated_ddd: dddBoxes,
            boxes_allocated_ljbb: ljbbBoxes,
            updated_at: new Date().toISOString()
          })
          .eq("ro_id", ro_id)
          .eq("article_code", item.article_code)

        if (processUpdateError) {
          console.error("Process update error:", processUpdateError)
        }
      }

      const { error: receiptUpdateError } = await supabase
        .schema("branch_super_app_clawdbot")
        .from("ro_receipt")
        .update({ 
          status: "CONFIRMED_DISCREPANCY",
          confirmed_by: user.id,
          confirmed_at: new Date().toISOString()
        })
        .eq("ro_id", ro_id)

      if (receiptUpdateError) {
        console.error("Receipt update error:", receiptUpdateError)
      }

      return NextResponse.json({
        success: true,
        message: "Discrepancy confirmed - RO marked as COMPLETED with actual received quantities"
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
