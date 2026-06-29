import { NextRequest, NextResponse } from "next/server"
// @ts-ignore
import pdfParse from "pdf-parse"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      type: typeof pdfParse,
      keys: Object.keys(pdfParse || {}),
      defaultType: typeof (pdfParse as any).default,
      pdfParseStr: String(pdfParse)
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
