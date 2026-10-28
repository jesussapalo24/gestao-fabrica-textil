export const areas = [
  'Costureiros',
  'Corte / Cortistas',
  'Empacotadores',
  'Organização / Estoque',
] as const
export interface Worker {
  id: number
  number: string
  name: string
  role: string
  area: string
  shift: string
  admittedAt: string
}
export interface RecordRow {
  id: number
  kind: string
  day: string
  shift: string
  workerId: number | null
  grossCents: number
  discountCents: number
  advanceCents: number
  status: string
  payload: {
    area?: string
    curtains?: number
    sheets?: number
    product?: string
    quantity?: number
    description?: string
    present?: boolean
    support?: boolean
    numerator?: number
    denominator?: number
    redundancyCents?: number | null
    shareCents?: number | null
  }
}
export interface HistoryRow {
  id: number
  action: string
  detail: string
  createdAt: string
}
export interface FactoryData {
  workers: Worker[]
  records: RecordRow[]
  history: HistoryRow[]
}
export const emptyData: FactoryData = { workers: [], records: [], history: [] }
export async function request(path: string, body?: unknown) {
  const response = await fetch(`/api/management${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const result = await response.json()
  if (!response.ok)
    throw new Error(result.error || 'Não foi possível concluir a operação.')
  return result
}
