import { timingSafeEqual } from "node:crypto"
import { revalidateTag } from "next/cache"

// xaxis's hook `alikro-art-site` posts `{ commit, paths }` here after a landing under `/alikro-art/`
export async function POST(request: Request) {
  const token = process.env.XAXIS_WEBHOOK_SECRET
  if (!token || !isBearerValid({ authorization: request.headers.get("authorization"), token })) {
    console.warn("Rejected revalidation: missing token, or missing or bad Authorization")
    return new Response("Unauthorized", { status: 401 })
  }
  // The body only names the landing in the log: any authorized post revalidates
  const body: { commit?: string, paths?: string[] } | undefined = await request.json().catch(() => undefined)
  revalidateTag("cms-content", "max")
  console.info(`Revalidated tag: cms-content (commit ${body?.commit ?? "unknown"}, ${body?.paths?.length ?? 0} paths)`)
  return new Response("Revalidated tag: cms-content", { status: 200 })
}

function isBearerValid({ authorization, token }: {
  authorization: string | null,
  token: string,
}) {
  if (authorization === null) {
    return false
  }
  const expected = Buffer.from(`Bearer ${token}`)
  const actual = Buffer.from(authorization)
  // timingSafeEqual throws on a length mismatch, and a length leaks nothing secret
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
