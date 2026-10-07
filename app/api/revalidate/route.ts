import { createHmac, timingSafeEqual } from "node:crypto"
import { revalidateTag } from "next/cache"

// xaxis's webhook `hooks/site` posts here after every commit to the workspace, and on "send now"
export async function POST(request: Request) {
  const secret = process.env.XAXIS_WEBHOOK_SECRET
  // The signature covers the exact bytes sent, so read the raw text rather than parsed JSON
  const body = await request.text()
  const signature = request.headers.get("x-xaxis-signature")
  if (!secret || !isSignatureValid({ body, signature, secret })) {
    console.warn("Rejected revalidation: missing secret, or missing or bad X-Xaxis-Signature")
    return new Response("Unauthorized", { status: 401 })
  }
  revalidateTag("cms-content", "max")
  console.info("Revalidated tag: cms-content")
  return new Response("Revalidated tag: cms-content", { status: 200 })
}

// xaxis signs with `sha256=<hex HMAC-SHA256 of the body>`
function isSignatureValid({ body, signature, secret }: {
  body: string,
  signature: string | null,
  secret: string,
}) {
  if (signature === null) {
    return false
  }
  const expected = Buffer.from(`sha256=${createHmac("sha256", secret).update(body).digest("hex")}`)
  const actual = Buffer.from(signature)
  // timingSafeEqual throws on a length mismatch, and a length leaks nothing secret
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
