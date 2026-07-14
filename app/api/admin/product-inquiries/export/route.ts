import { NextResponse } from "next/server"

import { serviceAxios } from "@/lib/axios/axios"

export const runtime = "nodejs"

function normalizeInquiryList(input: any): any[] {
  if (Array.isArray(input)) return input
  if (input && typeof input === "object") {
    if (Array.isArray(input.items)) return input.items
    if (Array.isArray(input.docs)) return input.docs
    if (Array.isArray(input.data)) return input.data
  }
  return []
}

function normalizeTotal(input: any): number | null {
  if (!input || typeof input !== "object") return null
  const total =
    input.total ??
    input.totalDocs ??
    input.totalItems ??
    input.count ??
    input.meta?.total ??
    input.meta?.totalDocs
  const n = Number(total)
  return Number.isFinite(n) && n >= 0 ? n : null
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const search = url.searchParams.get("search")?.trim() || undefined
    const status = url.searchParams.get("status")?.trim() || undefined

    const baseParams: Record<string, any> = {}
    if (search) baseParams.search = search
    if (status && status !== "all") baseParams.status = status

    // 1) Try getting total from list meta (filtered-aware)
    const first = await serviceAxios.get("/product-inquiries", {
      params: { ...baseParams, page: 1, limit: 1 },
    })
    const firstData = first.data?.data ?? first.data
    const meta = firstData?.meta ?? null
    let total = normalizeTotal(meta)

    // 2) Fallback: dashboard-style endpoint (not filter-aware)
    if (total == null) {
      const cnt = await serviceAxios.get("/product-inquiries/number-of-inquiries")
      const cntData = cnt.data?.data ?? cnt.data
      total = normalizeTotal(cntData)
    }

    total = total ?? 0

    // Avoid extreme limits causing backend errors
    const safeTotal = Math.min(Math.max(total, 0), 50_000)

    const res = await serviceAxios.get("/product-inquiries", {
      params: { ...baseParams, page: 1, limit: safeTotal },
    })
    const data = res.data?.data ?? res.data
    const items = normalizeInquiryList(data?.items ?? data)

    return NextResponse.json(
      { items, total: safeTotal },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message || "Failed to export product inquiries" },
      { status: 500 },
    )
  }
}
