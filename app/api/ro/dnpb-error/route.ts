import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabase } from "@/lib/supabase"

interface DNPBErrorRO {
  ro_id: string
  store_name: string
  dnpb_number: string | null
  total_items: number
  total_selisih: number
  confirmed_at: string
}

export async function GET() {
  try {
    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { data: roList, error } = await supabase
      .schema("branch_super_app_clawdbot")
      .rpc("get_dnpb_error_ro_list")

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    const data = await Promise.all(
      (roList || []).map(async (ro: DNPBErrorRO) => {
        const { data: details, error: detailsError } = await supabase
          .schema("branch_super_app_clawdbot")
          .from("ro_receipt")
          .select("article_code, article_name, sku_code, size, pairs_per_box, pairs_shipped, fisik, selisih, notes")
          .eq("ro_id", ro.ro_id)

        if (detailsError) {
          console.error("Details error:", detailsError)
        }

        return {
          ...ro,
          details: details || [],
        }
      })
    )

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("API error:", err)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
