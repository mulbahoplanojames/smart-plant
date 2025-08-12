export type JsonResult<T = any> = {
  ok: boolean
  status: number
  data?: T
  error?: string
  raw?: string
}

export async function fetchJSON<T = any>(input: RequestInfo | URL, init?: RequestInit): Promise<JsonResult<T>> {
  try {
    const res = await fetch(input, init)
    const ct = res.headers.get("content-type") || ""
    if (!res.ok) {
      if (ct.includes("application/json")) {
        const j = await res.json().catch(() => ({}))
        return { ok: false, status: res.status, error: (j && (j.error || j.message)) || `HTTP ${res.status}` }
      } else {
        const txt = await res.text().catch(() => "")
        return { ok: false, status: res.status, error: txt || `HTTP ${res.status}`, raw: txt }
      }
    }
    if (ct.includes("application/json")) {
      const j = await res.json()
      return { ok: true, status: res.status, data: j as T }
    }
    const txt = await res.text().catch(() => "")
    return { ok: true, status: res.status, data: txt as unknown as T, raw: txt }
  } catch (e: any) {
    return { ok: false, status: 0, error: e?.message || "Network error" }
  }
}
