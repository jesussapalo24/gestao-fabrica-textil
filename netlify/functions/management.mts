import { getUser, login, logout } from '@netlify/identity'
import type { Config, Context } from '@netlify/functions'
import { getDatabase } from '@netlify/database'
import { createHash } from 'node:crypto'
import { desc } from 'drizzle-orm'
import { z } from 'zod'
import { database } from '../../db/index'
import { workers, records, audit } from '../../db/schema'
import { packaging, stock } from '../../src/lib/calculations'

function inputSchema() {
  const day = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((s) => {
      const d = new Date(s)
      return !isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === s
    })
  const amount = z.number().int().min(0).max(100000000)
  const shift = z.enum(['Dia', 'Noite'])
  const workerSchema = z.object({
    number: z
      .string()
      .trim()
      .min(1)
      .max(30)
      .transform((s) => s.toUpperCase()),
    name: z.string().trim().min(3).max(120),
    role: z.string().trim().min(2).max(80),
    area: z.enum([
      'Costureiros',
      'Corte / Cortistas',
      'Empacotadores',
      'Organização / Estoque',
    ]),
    shift,
    admittedAt: day,
  })
  const base = { day, shift, requestId: z.string().uuid() }
  return z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('worker'), ...workerSchema.shape }),
    z.object({
      kind: z.literal('packaging'),
      ...base,
      curtains: amount.max(100000),
      sheets: amount.max(100000),
      attendance: z
        .array(
          z.object({
            workerId: z.number().int().positive(),
            present: z.boolean(),
            support: z.boolean(),
          }),
        )
        .min(1)
        .max(1000),
    }),
    z.object({
      kind: z.literal('stock'),
      ...base,
      workerId: z.number().int().positive(),
      present: z.boolean(),
      justified: z.boolean(),
      dailyCents: amount,
      absenceCents: amount,
    }),
    z.object({
      kind: z.literal('defect'),
      ...base,
      workerId: z.number().int().positive().nullable(),
      product: z.string().trim().min(2).max(100),
      quantity: amount.min(1).max(100000),
      description: z.string().trim().min(3).max(2000),
    }),
    z.object({
      kind: z.literal('adjustment'),
      ...base,
      area: z.enum(['Empacotadores', 'Organização / Estoque']),
      workerId: z.number().int().positive(),
      advanceCents: amount,
      discountCents: amount,
      description: z.string().trim().min(3).max(500),
    }),
  ])
}
export default async (req: Request, context: Context) => {
  const respond = (data: unknown, status = 200) =>
    Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
  try {
    if (!['GET', 'POST'].includes(req.method))
      return respond({ error: 'Método não permitido.' }, 405)
    if (
      req.method === 'POST' &&
      req.headers.get('origin') !== new URL(req.url).origin
    )
      return respond({ error: 'Origem inválida.' }, 403)
    const route = new URL(req.url).pathname.split('/').pop()
    const email = Netlify.env.get('GERENCIA_EMAIL')
    if (route === 'login' && req.method === 'POST') {
      if (!email)
        return respond(
          {
            error:
              'Acesso pendente de configuração segura da conta da Gerência.',
          },
          503,
        )
      const bucket = createHash('sha256')
        .update(`${context.ip}:${Math.floor(Date.now() / 900000)}`)
        .digest('hex')
      const store = getDatabase()
      const attempts =
        await store.sql`INSERT INTO login_attempts (bucket, attempts) VALUES (${bucket},1) ON CONFLICT(bucket) DO UPDATE SET attempts = login_attempts.attempts + 1 RETURNING attempts`
      if (Number(attempts[0].attempts) > 8)
        return respond(
          { error: 'Demasiadas tentativas. Aguarde 15 minutos.' },
          429,
        )
      const parsed = z
        .object({ code: z.string().min(1).max(200) })
        .safeParse(await req.json())
      if (!parsed.success)
        return respond({ error: 'Introduza o código de acesso.' }, 400)
      try {
        const user = await login(email, parsed.data.code)
        if (user.email?.toLowerCase() !== email.toLowerCase()) {
          await logout()
          return respond({ error: 'Acesso não autorizado.' }, 403)
        }
        await store.sql`INSERT INTO audit (actor,action,detail) VALUES (${'Gerência'},${'Entrada'},${'Entrada na sessão partilhada'})`
        return respond({ ok: true })
      } catch {
        return respond(
          { error: 'Código inválido ou conta ainda não activada.' },
          401,
        )
      }
    }
    const user = await getUser()
    if (!user || !email || user.email?.toLowerCase() !== email.toLowerCase())
      return respond(
        {
          error:
            'Entre com o código da Gerência para consultar ou guardar dados.',
        },
        401,
      )
    if (route === 'logout' && req.method === 'POST') {
      await logout()
      return respond({ ok: true })
    }
    if (req.method === 'GET') {
      const db = database()
      const [allWorkers, allRecords, history] = await Promise.all([
        db.select().from(workers).orderBy(workers.number),
        db.select().from(records).orderBy(desc(records.day)),
        db.select().from(audit).orderBy(desc(audit.createdAt)).limit(100),
      ])
      return respond({ workers: allWorkers, records: allRecords, history })
    }
    const parsed = inputSchema().safeParse(await req.json())
    if (!parsed.success)
      return respond(
        {
          error:
            'Dados inválidos. Verifique os campos, as datas e os valores positivos.',
        },
        400,
      )
    const data = parsed.data
    const client = await getDatabase().pool.connect()
    try {
      await client.query('BEGIN')
      if (data.kind === 'worker') {
        await client.query(
          'INSERT INTO workers (number,name,role,area,shift,admitted_at) VALUES ($1,$2,$3,$4,$5,$6)',
          [
            data.number,
            data.name,
            data.role,
            data.area,
            data.shift,
            data.admittedAt,
          ],
        )
      } else {
        const allWorkers = (await client.query('SELECT * FROM workers')).rows
        const findWorker = (id: number) => {
          const w = allWorkers.find((w) => w.id === id)
          if (!w) throw new Error('Trabalhador não encontrado.')
          return w
        }
        const insert = async (
          kind: string,
          workerId: number | null,
          key: string,
          payload: unknown,
          gross = 0,
          discount = 0,
          advance = 0,
          status = 'Registado',
        ) => {
          await client.query(
            'INSERT INTO records (kind,day,shift,worker_id,unique_key,payload,gross_cents,discount_cents,advance_cents,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
            [
              kind,
              data.day,
              data.shift,
              workerId,
              key,
              JSON.stringify(payload),
              gross,
              discount,
              advance,
              status,
            ],
          )
        }
        if (data.kind === 'packaging') {
          const ids = data.attendance.map((a) => a.workerId)
          if (new Set(ids).size !== ids.length)
            throw new Error('Um trabalhador só pode constar uma vez no turno.')
          data.attendance.forEach((a) => {
            const w = findWorker(a.workerId)
            if (
              !a.support &&
              (w.area !== 'Empacotadores' || w.shift !== data.shift)
            )
              throw new Error(
                'Identifique como apoio quem pertence a outra área ou turno.',
              )
          })
          const present = data.attendance.filter((a) => a.present).length
          if (!present)
            throw new Error('Indique pelo menos um trabalhador presente.')
          const calc = packaging(data.curtains, data.sheets, present)
          const key = `packaging:${data.day}:${data.shift}`
          await insert(
            'packaging',
            null,
            key,
            { ...data, ...calc },
            calc.grossCents,
            0,
            0,
            calc.status,
          )
          for (const a of data.attendance)
            await insert(
              'share',
              a.workerId,
              `${key}:${a.workerId}`,
              {
                present: a.present,
                support: a.support,
                collectiveKey: key,
                numerator: a.present ? calc.grossCents : 0,
                denominator: present,
                redundancyCents: calc.redundancyCents,
              },
              a.present ? (calc.shareCents ?? 0) : 0,
              0,
              0,
              a.present ? calc.status : 'Ausente',
            )
        } else if (data.kind === 'stock') {
          const w = findWorker(data.workerId)
          if (w.area !== 'Organização / Estoque')
            throw new Error(
              'Seleccione um trabalhador de Organização / Estoque.',
            )
          if (w.shift !== data.shift)
            throw new Error('O turno deve corresponder ao trabalhador.')
          const calc = stock(
            data.present,
            data.dailyCents,
            data.justified ? 0 : data.absenceCents,
          )
          await insert(
            'stock',
            data.workerId,
            `stock:${data.day}:${data.shift}:${data.workerId}`,
            data,
            calc.grossCents,
            calc.discountCents,
            0,
            'Arredondamento pendente',
          )
        } else if (data.kind === 'adjustment') {
          const w = findWorker(data.workerId)
          if (data.area === 'Organização / Estoque' && w.area !== data.area)
            throw new Error(
              'Seleccione um trabalhador de Organização / Estoque.',
            )
          await insert(
            'adjustment',
            data.workerId,
            `adjustment:${data.requestId}`,
            data,
            0,
            data.discountCents,
            data.advanceCents,
          )
        } else {
          if (data.workerId) findWorker(data.workerId)
          await insert(
            'defect',
            data.workerId,
            `defect:${data.requestId}`,
            data,
          )
        }
      }
      await client.query(
        'INSERT INTO audit (actor,action,detail) VALUES ($1,$2,$3)',
        [
          'Gerência',
          `Registo: ${{ worker: 'Trabalhador', packaging: 'Empacotamento', stock: 'Presença de estoque', defect: 'Defeito', adjustment: 'Adiantamento ou desconto' }[data.kind]}`,
          data.kind === 'worker'
            ? `Trabalhador n.º ${data.number}`
            : `${data.day} · Turno ${data.shift}`,
        ],
      )
      await client.query('COMMIT')
      return respond({ ok: true }, 201)
    } catch (error) {
      await client.query('ROLLBACK')
      if ((error as { code?: string }).code === '23505')
        return respond(
          {
            error:
              'Já existe um registo com este número ou para esta data e turno. A produção não foi duplicada.',
          },
          409,
        )
      if (error instanceof Error && !('code' in error))
        return respond({ error: error.message }, 400)
      return respond(
        { error: 'Não foi possível guardar. Nenhuma alteração foi aplicada.' },
        500,
      )
    } finally {
      client.release()
    }
  } catch {
    return respond(
      { error: 'Serviço temporariamente indisponível. Tente novamente.' },
      503,
    )
  }
}
export const config: Config = {
  path: ['/api/management', '/api/management/login', '/api/management/logout'],
}
