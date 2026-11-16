import type { RiskReport } from './risk'

const BASE = '/api/risk-reports'

type ApiError = { error?: { code?: string; message?: string } | string }

function errorMessage(body: ApiError, status: number) {
  const err = body?.error
  if (typeof err === 'string') return err
  if (err?.message) return err.message
  return `خطا در ارتباط با سرور (HTTP ${status})`
}

export async function listReports(): Promise<RiskReport[]> {
  const res = await fetch(`${BASE}?limit=1000&orderBy=createdAt:desc`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(errorMessage(body, res.status))
  return (body.items ?? []) as RiskReport[]
}

export type NewReport = Omit<
  RiskReport,
  'id' | 'createdAt' | 'updatedAt' | 'managerNote' | 'status'
>

export async function createReport(input: NewReport): Promise<RiskReport> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, status: 'new' }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(errorMessage(body, res.status))
  return body.data as RiskReport
}

export async function updateReport(
  id: string,
  patch: Partial<Pick<RiskReport, 'status' | 'managerNote'>>,
): Promise<RiskReport> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(errorMessage(body, res.status))
  return body.data as RiskReport
}

export async function deleteReport(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(errorMessage(body, res.status))
  }
}
