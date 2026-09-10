import { NextRequest, NextResponse } from "next/server"

export function getExtensionCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin")
  
  if (origin) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-hirecompass-token",
      "Access-Control-Allow-Credentials": "true",
    }
  }

  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-hirecompass-token",
  }
}

export function handleOptionsCors(request: NextRequest) {
  return NextResponse.json({}, { headers: getExtensionCorsHeaders(request) })
}
