import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
// @ts-ignore
import pdfParse from "pdf-parse"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db()
    
    // Get the latest campaign
    const campaigns = await db.collection('outreach_campaigns').find().sort({_id:-1}).limit(1).toArray()
    const campaign = campaigns[0]
    
    if (!campaign?.attachedCvId) {
      return NextResponse.json({ error: "No CV attached to latest campaign" })
    }

    const cvDoc = await db.collection("cv_documents").findOne({
      _id: new ObjectId(campaign.attachedCvId)
    })
    
    if (!cvDoc) {
      return NextResponse.json({ error: "Attached CV not found in DB" })
    }

    let cvText = null
    let errorStr = null
    let cvType = cvDoc.mimeType
    
    if (cvDoc.data && cvDoc.mimeType === "application/pdf") {
      try {
        const base64Data = cvDoc.data.includes(',') ? cvDoc.data.split(',')[1] : cvDoc.data;
        const buffer = Buffer.from(base64Data, "base64")
        const pdfData = await pdfParse(buffer)
        cvText = pdfData.text
      } catch (err) {
        errorStr = String(err)
      }
    }
    
    return NextResponse.json({
      cvId: cvDoc._id,
      cvType,
      textLength: cvText?.length,
      textSnippet: cvText ? cvText.substring(0, 500) : null,
      errorStr
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
