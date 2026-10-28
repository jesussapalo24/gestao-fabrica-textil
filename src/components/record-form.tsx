import { useRef, useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { Save, Info } from 'lucide-react'
import { areas, request } from '@/lib/factory-types'
import type { Worker } from '@/lib/factory-types'
import { money, packaging } from '@/lib/calculations'
import { Input } from '@/components/ui/input'

export function RecordForm({
  kind,
  workers,
  onSaved,
  authenticated,
  onLogin,
  ledgerArea,
}: {
  ledgerArea: string
  kind: string
  workers: Worker[]
  onSaved: () => Promise<void>
  authenticated: boolean
  onLogin: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [attendance, setAttendance] = useState<
    Record<number, { included: boolean; present: boolean; support: boolean }>
  >({})
  const [shift, setShift] = useState('Dia')
  const [curtains, setCurtains] = useState(0)
  const [sheets, setSheets] = useState(0)
  const requestId = useRef('')
  const presentCount = Object.values(attendance).filter(
    (a) => a.included && a.present,
  ).length
  const preview = packaging(curtains, sheets, presentCount)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (!authenticated) {
      onLogin()
      return
    }
    const form = event.currentTarget
    const f = new FormData(form)
    const str = (key: string) => String(f.get(key) ?? '')
    const num = (key: string) => Number(str(key))
    const cents = (key: string) => Math.round(num(key) * 100)
    if (!requestId.current) requestId.current = crypto.randomUUID()
    let body: object
    if (kind === 'worker')
      body = {
        kind,
        number: str('number'),
        name: str('name'),
        role: str('role'),
        area: str('area'),
        shift: str('shift'),
        admittedAt: str('admittedAt'),
      }
    else {
      const common = {
        kind,
        day: str('day'),
        shift: str('shift'),
        requestId: requestId.current,
      }
      if (kind === 'packaging')
        body = {
          ...common,
          curtains: num('curtains'),
          sheets: num('sheets'),
          attendance: Object.entries(attendance)
            .filter(([, a]) => a.included)
            .map(([id, a]) => ({
              workerId: Number(id),
              present: a.present,
              support: a.support,
            })),
        }
      else if (kind === 'stock')
        body = {
          ...common,
          workerId: num('workerId'),
          present: str('presence') === 'Presente',
          justified: str('presence') === 'Falta justificada',
          dailyCents: cents('daily'),
          absenceCents: cents('absence'),
        }
      else if (kind === 'adjustment')
        body = {
          ...common,
          area: ledgerArea,
          workerId: num('workerId'),
          advanceCents: cents('advance'),
          discountCents: cents('discount'),
          description: str('description'),
        }
      else
        body = {
          ...common,
          workerId: num('workerId') || null,
          product: str('product'),
          quantity: num('quantity'),
          description: str('description'),
        }
    }
    setBusy(true)
    try {
      await request('', body)
      requestId.current = ''
      await onSaved()
      setSuccess('Registo guardado na base de dados partilhada.')
      form.reset()
      setAttendance({})
      setCurtains(0)
      setSheets(0)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const field = (
    label: string,
    name: string,
    type = 'text',
    extra: object = {},
  ) => (
    <label className="field">
      {label}
      <Input required name={name} type={type} {...extra} />
    </label>
  )
  const workerSelect = (optional = false) => (
    <label className="field">
      Trabalhador
      <select required={!optional} name="workerId">
        <option value="">
          {optional ? 'Sem trabalhador associado' : 'Seleccionar trabalhador'}
        </option>
        {workers
          .filter(
            (w) =>
              !(
                kind === 'stock' ||
                (kind === 'adjustment' &&
                  ledgerArea === 'Organização / Estoque')
              ) || w.area === 'Organização / Estoque',
          )
          .map((w) => (
            <option key={w.id} value={w.id}>
              {w.number} · {w.name}
            </option>
          ))}
      </select>
    </label>
  )
  return (
    <form onSubmit={submit} className="entry-form">
      <div className="form-grid">
        {kind === 'worker' ? (
          <>
            {field('Número individual único', 'number', 'text', {
              maxLength: 30,
              placeholder: 'Ex.: DC-001',
            })}
            {field('Nome completo', 'name', 'text', {
              minLength: 3,
              maxLength: 120,
            })}
            {field('Função', 'role', 'text', {
              placeholder: 'Ex.: Empacotador',
              minLength: 2,
              maxLength: 80,
            })}
            <label className="field">
              Área
              <select name="area">
                {areas.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
            {field('Data de admissão', 'admittedAt', 'date')}
          </>
        ) : (
          <>
            {field('Data do registo', 'day', 'date', {
              defaultValue: new Date().toISOString().slice(0, 10),
            })}
          </>
        )}
        <label className="field">
          Turno
          <select
            name="shift"
            value={shift}
            onChange={(e) => {
              setShift(e.target.value)
              setAttendance({})
            }}
          >
            <option>Dia</option>
            <option>Noite</option>
          </select>
        </label>
        {kind === 'packaging' && (
          <>
            {field('Jogos de cortinas', 'curtains', 'number', {
              min: 0,
              max: 100000,
              step: 1,
              value: curtains,
              onChange: (e: ChangeEvent<HTMLInputElement>) =>
                setCurtains(Number(e.target.value)),
            })}
            {field('Jogos de lençóis', 'sheets', 'number', {
              min: 0,
              max: 100000,
              step: 1,
              value: sheets,
              onChange: (e: ChangeEvent<HTMLInputElement>) =>
                setSheets(Number(e.target.value)),
            })}
          </>
        )}
        {kind === 'stock' && (
          <>
            {workerSelect()}
            <label className="field">
              Presença
              <select name="presence">
                <option>Presente</option>
                <option>Falta justificada</option>
                <option>Falta injustificada</option>
              </select>
            </label>
            {field('Valor diário (Kz)', 'daily', 'number', {
              min: 0,
              step: 0.01,
              defaultValue: 0,
            })}
            {field(
              'Desconto por falta injustificada (Kz)',
              'absence',
              'number',
              { min: 0, step: 0.01, defaultValue: 0 },
            )}
          </>
        )}
        {kind === 'defect' && (
          <>
            {workerSelect(true)}
            {field('Produto', 'product', 'text', {
              minLength: 2,
              maxLength: 100,
            })}
            {field('Peças com defeito', 'quantity', 'number', {
              min: 1,
              step: 1,
              max: 100000,
            })}
            {field('Descrição do defeito', 'description', 'text', {
              minLength: 3,
              maxLength: 2000,
            })}
          </>
        )}
        {kind === 'adjustment' && (
          <>
            {workerSelect()}
            {field('Adiantamento (Kz)', 'advance', 'number', {
              min: 0,
              step: 0.01,
              defaultValue: 0,
            })}
            {field('Outro desconto (Kz)', 'discount', 'number', {
              min: 0,
              step: 0.01,
              defaultValue: 0,
            })}
            {field('Justificação', 'description', 'text', {
              minLength: 3,
              maxLength: 500,
            })}
          </>
        )}
      </div>
      {kind === 'packaging' && (
        <>
          <h3 className="subheading">
            Presenças do turno{' '}
            <span>Inclua os ausentes para registar a falta</span>
          </h3>
          <div className="attendance-list">
            {!workers.length && (
              <p className="muted">
                Cadastre os trabalhadores para preencher as presenças.
              </p>
            )}
            {workers.map((w) => {
              const a = attendance[w.id] ?? {
                included: false,
                present: true,
                support: w.area !== 'Empacotadores' || w.shift !== shift,
              }
              const update = (p: Partial<typeof a>) =>
                setAttendance((previous) => ({
                  ...previous,
                  [w.id]: { ...a, ...p },
                }))
              return (
                <div className="attendance-row" key={w.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={a.included}
                      onChange={(e) => update({ included: e.target.checked })}
                    />
                    <span>
                      <strong>{w.name}</strong>
                      <small>
                        N.º {w.number} · {w.area} · {w.shift}
                      </small>
                    </span>
                  </label>
                  <select
                    aria-label={`Presença de ${w.name}`}
                    disabled={!a.included}
                    value={a.present ? 'Presente' : 'Ausente'}
                    onChange={(e) =>
                      update({ present: e.target.value === 'Presente' })
                    }
                  >
                    <option>Presente</option>
                    <option>Ausente</option>
                  </select>
                  <label>
                    <input
                      type="checkbox"
                      checked={a.support}
                      disabled={!a.included}
                      onChange={(e) => update({ support: e.target.checked })}
                    />
                    Apoio
                  </label>
                </div>
              )
            })}
          </div>
          <div className="calculation-preview">
            <span>
              Bruto colectivo<strong>{money(preview.grossCents)}</strong>
            </span>
            <span>
              Presentes<strong>{presentCount}</strong>
            </span>
            <span>
              Parcela individual
              <strong>
                {preview.shareCents === null
                  ? 'Pendente'
                  : money(preview.shareCents)}
              </strong>
            </span>
            <span>
              Redundância
              <strong>
                {preview.redundancyCents === null
                  ? 'Por apurar'
                  : money(preview.redundancyCents)}
              </strong>
            </span>
          </div>
          <p className="form-note">
            <Info size={15} /> Divisões não exactas ficam pendentes da fórmula
            de redundância. A produção é conservada sem arredondamentos
            automáticos.
          </p>
        </>
      )}
      {kind === 'stock' && (
        <p className="form-note">
          <Info size={16} /> Somam-se os valores dos dias presentes. Faltas
          injustificadas ficam separadas na cota da Gerência. Arredondamento
          pendente de aprovação; nenhum resto é calculado.
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="form-success" role="status">
          {success}
        </p>
      )}
      <div className="form-actions">
        <span>Os registos ficam no histórico de operações.</span>
        <button className="primary-button" type="submit" disabled={busy}>
          <Save size={17} />
          {busy ? 'A guardar…' : 'Guardar registo'}
        </button>
      </div>
    </form>
  )
}
