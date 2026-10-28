import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  LayoutDashboard,
  UserPlus,
  Scissors,
  Shirt,
  PackageCheck,
  TriangleAlert,
  Boxes,
  Printer,
  ChartNoAxesCombined,
  Coins,
  FileChartColumn,
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  LockKeyhole,
  LogOut,
  Menu,
  CalendarDays,
  Users,
  Layers,
  CircleHelp,
  Check,
  RefreshCw,
  Fingerprint,
  Search,
  Plus,
  Factory,
  ClipboardList,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { RecordForm } from '@/components/record-form'
import { PrintableDocument } from '@/components/printable-document'
import type { PrintDocument } from '@/components/printable-document'
import { areas, emptyData, request } from '@/lib/factory-types'
import type { FactoryData, RecordRow } from '@/lib/factory-types'
import { money, rates } from '@/lib/calculations'

const modules: {
  id: string
  name: string
  icon: LucideIcon
  description: string
  category: string
}[] = [
  {
    id: 'workers',
    name: 'Novos ingressos',
    icon: UserPlus,
    description: 'Cadastro e identificação de trabalhadores',
    category: 'PESSOAS',
  },
  {
    id: 'sewing',
    name: 'Costureiros',
    icon: Shirt,
    description: 'Fichas e produção individual por peça',
    category: 'PRODUÇÃO',
  },
  {
    id: 'cutting',
    name: 'Corte / Cortistas',
    icon: Scissors,
    description: 'Controlo de corte e fichas individuais',
    category: 'PRODUÇÃO',
  },
  {
    id: 'packaging',
    name: 'Empacotadores',
    icon: PackageCheck,
    description: 'Produção colectiva, presenças e partilhas',
    category: 'PRODUÇÃO',
  },
  {
    id: 'defects',
    name: 'Defeitos',
    icon: TriangleAlert,
    description: 'Registo e acompanhamento da qualidade',
    category: 'QUALIDADE',
  },
  {
    id: 'stock',
    name: 'Organização / Estoque',
    icon: Boxes,
    description: 'Presenças, valores diários e descontos',
    category: 'OPERAÇÕES',
  },
  {
    id: 'prints',
    name: 'Impressões',
    icon: Printer,
    description: 'Fichas, documentos e identificação',
    category: 'DOCUMENTOS',
  },
  {
    id: 'summary',
    name: 'Resumo geral',
    icon: ChartNoAxesCombined,
    description: 'Os números da fábrica num só lugar',
    category: 'GESTÃO',
  },
  {
    id: 'rates',
    name: 'Tarifas',
    icon: Coins,
    description: 'Valores de referência de cada área',
    category: 'GESTÃO',
  },
  {
    id: 'reports',
    name: 'Relatórios',
    icon: FileChartColumn,
    description: 'Consulta diária, semanal e individual',
    category: 'GESTÃO',
  },
]
const dateLabel = (day: string) =>
  new Date(`${day}T12:00:00`).toLocaleDateString('pt-AO')
const kindName: Record<string, string> = {
  packaging: 'Empacotamento colectivo',
  share: 'Parcela de empacotamento',
  stock: 'Presença / Estoque',
  adjustment: 'Adiantamento / Desconto',
  defect: 'Defeito de produção',
}

function TextileMark({ small = false }: { small?: boolean }) {
  return (
    <svg
      viewBox="0 0 40 44"
      width={small ? 26 : 36}
      height={small ? 29 : 40}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 8 20 2l16 6v28l-16 6L4 36V8Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="m4 8 16 6 16-6M20 14v28M10 10v24l10 4 10-4V10M4 17l16 7 16-7M4 27l16 7 16-7"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}
function Empty({
  text = 'Ainda não existem registos.',
  detail = 'Os dados guardados pela Gerência aparecem aqui.',
}: {
  text?: string
  detail?: string
}) {
  return (
    <div className="empty-state">
      <ClipboardList size={29} strokeWidth={1.3} />
      <strong>{text}</strong>
      <p>{detail}</p>
    </div>
  )
}

export function FactoryApp() {
  const [page, setPage] = useState('dashboard')
  const [data, setData] = useState<FactoryData>(emptyData)
  const [authenticated, setAuthenticated] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)
  const [inviteToken, setInviteToken] = useState('')
  const [recovering, setRecovering] = useState(false)
  const [query, setQuery] = useState('')
  const [formKind, setFormKind] = useState<string | null>(null)
  const [workerFilter, setWorkerFilter] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [printDoc, setPrintDoc] = useState<PrintDocument | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  async function refresh() {
    setLoading(true)
    setError('')
    try {
      const result = await request('')
      setData(result)
      setAuthenticated(true)
    } catch (e) {
      const message = (e as Error).message
      if (message.includes('Entre com')) {
        setAuthenticated(false)
        setData(emptyData)
      } else setError(message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    async function initialise() {
      try {
        const identity = await import('@netlify/identity')
        const callback = await identity.handleAuthCallback()
        if (callback?.type === 'invite') {
          setInviteToken(callback.token ?? '')
          setLoginOpen(true)
        }
        if (callback?.type === 'recovery') {
          setRecovering(true)
          setLoginOpen(true)
        }
        await identity.hydrateSession()
      } catch {
        /* A protected API remains the source of truth for access. */
      }
      await refresh()
    }
    void initialise()
  }, [])
  function navigate(id: string) {
    setPage(id)
    setMobileOpen(false)
    setQuery('')
    setFormKind(null)
  }
  function openForm(kind: string) {
    if (!authenticated) setLoginOpen(true)
    else setFormKind(kind)
  }
  async function signIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoginBusy(true)
    setLoginError('')
    const code = new FormData(e.currentTarget).get('code')
    try {
      if (inviteToken || recovering) {
        const identity = await import('@netlify/identity')
        if (inviteToken) await identity.acceptInvite(inviteToken, String(code))
        else await identity.updateUser({ password: String(code) })
      } else await request('/login', { code })
      window.location.href = '/'
    } catch (e) {
      setLoginError(
        inviteToken || recovering
          ? 'Não foi possível definir o código. Verifique a validade da ligação e tente novamente.'
          : (e as Error).message,
      )
    } finally {
      setLoginBusy(false)
    }
  }
  async function signOut() {
    try {
      await request('/logout', {})
      const identity = await import('@netlify/identity')
      await identity.logout()
      window.location.href = '/'
    } catch (e) {
      setError((e as Error).message)
    }
  }
  const activeModule = modules.find((m) => m.id === page)
  const totalGross = data.records
    .filter((r) => ['stock', 'packaging'].includes(r.kind))
    .reduce((s, r) => s + r.grossCents, 0)
  const discounts = data.records
    .filter((r) => ['stock', 'adjustment'].includes(r.kind))
    .reduce((s, r) => s + r.discountCents, 0)
  const pendingCount = data.records.filter(
    (r) => r.kind === 'packaging' && r.status === 'Distribuição pendente',
  ).length
  const filteredRecords = data.records.filter(
    (r) =>
      (!start || r.day >= start) &&
      (!end || r.day <= end) &&
      (!workerFilter || r.workerId === Number(workerFilter)),
  )
  const selectedRecords =
    page === 'packaging'
      ? filteredRecords.filter(
          (r) =>
            r.kind === 'packaging' ||
            (workerFilter &&
              (r.kind === 'share' ||
                (r.kind === 'adjustment' &&
                  r.payload.area === 'Empacotadores'))),
        )
      : page === 'stock'
        ? filteredRecords.filter(
            (r) =>
              r.kind === 'stock' ||
              (r.kind === 'adjustment' &&
                r.payload.area === 'Organização / Estoque'),
          )
        : page === 'defects'
          ? filteredRecords.filter((r) => r.kind === 'defect')
          : filteredRecords
  const workerName = (id: number | null) =>
    data.workers.find((w) => w.id === id)?.name ?? 'Colectivo'
  function printRecords(rows: RecordRow[], title: string) {
    setPrintDoc({
      title,
      subtitle: `${start ? dateLabel(start) : 'Início'} a ${end ? dateLabel(end) : 'data actual'}${workerFilter ? ' · ' + workerName(Number(workerFilter)) : ''}`,
      columns: [
        'Data / Turno',
        'Registo / Trabalhador',
        'Produção / Presença',
        'Bruto',
        'Descontos',
        'Adiantamentos',
        'Estado',
      ],
      rows: rows.map((r) => [
        dateLabel(r.day) + ' · ' + r.shift,
        `${kindName[r.kind]} · ${workerName(r.workerId)}`,
        production(r),
        r.status === 'Distribuição pendente' && r.kind === 'share'
          ? 'Por apurar'
          : money(r.grossCents),
        money(r.discountCents),
        money(r.advanceCents),
        r.status,
      ]),
    })
  }
  function production(r: RecordRow) {
    if (r.kind === 'packaging')
      return `${r.payload.curtains ?? 0} jogos de cortinas · ${r.payload.sheets ?? 0} jogos de lençóis`
    if (r.kind === 'defect')
      return `${r.payload.quantity} peças · ${r.payload.product} · ${r.payload.description}`
    if (r.kind === 'stock' || r.kind === 'share')
      return (
        (r.payload.present ? 'Presente' : 'Ausente') +
        (r.payload.support ? ' · Apoio' : '') +
        (r.status === 'Distribuição pendente'
          ? ` · ${r.payload.numerator}/ ${r.payload.denominator} cêntimos (parcela exacta)`
          : '')
      )
    return r.payload.description ?? '—'
  }
  const navItem = (id: string, label: string, Icon: LucideIcon) => (
    <button
      key={id}
      className={`nav-item ${page === id ? 'active' : ''}`}
      onClick={() => navigate(id)}
    >
      <Icon size={18} strokeWidth={1.7} />
      <span>{label}</span>
      {page === id && <span className="nav-dot" />}
    </button>
  )
  const stats = [
    {
      label: 'Trabalhadores',
      value: authenticated ? String(data.workers.length).padStart(2, '0') : '—',
      icon: Users,
      caption: 'Todas as áreas',
    },
    {
      label: 'Produção colectiva',
      value: authenticated
        ? String(
            data.records
              .filter((r) => r.kind === 'packaging')
              .reduce(
                (s, r) =>
                  s + (r.payload.curtains ?? 0) + (r.payload.sheets ?? 0),
                0,
              ),
          )
        : '—',
      icon: Layers,
      caption: 'Jogos registados',
    },
    {
      label: 'Valor bruto',
      value: authenticated ? money(totalGross) : '—',
      icon: Coins,
      caption: 'Empacotamento e estoque',
    },
    {
      label: 'Defeitos registados',
      value: authenticated
        ? String(
            data.records
              .filter((r) => r.kind === 'defect')
              .reduce((s, r) => s + (r.payload.quantity ?? 0), 0),
          ).padStart(2, '0')
        : '—',
      icon: TriangleAlert,
      caption: 'Peças para acompanhamento',
    },
  ]
  const recordsTable = (rows: RecordRow[]) =>
    rows.length ? (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Data / Turno</th>
              <th>Trabalhador / Registo</th>
              <th>Detalhes</th>
              <th>Bruto</th>
              <th>Descontos</th>
              <th>Adiantamentos</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  {dateLabel(r.day)}
                  <small>{r.shift}</small>
                </td>
                <td>
                  {workerName(r.workerId)}
                  <small>{kindName[r.kind]}</small>
                </td>
                <td className="details-cell">{production(r)}</td>
                <td>
                  {r.status === 'Distribuição pendente' && r.kind === 'share'
                    ? 'Por apurar'
                    : money(r.grossCents)}
                </td>
                <td>{money(r.discountCents)}</td>
                <td>{money(r.advanceCents)}</td>
                <td>
                  <span
                    className={`pill ${r.status.includes('pendente') ? 'warning' : ''}`}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <Empty />
    )
  const filters = (
    <div className="filters">
      <label>
        De
        <Input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
      </label>
      <label>
        Até
        <Input
          type="date"
          value={end}
          min={start}
          onChange={(e) => setEnd(e.target.value)}
        />
      </label>
      <label>
        Trabalhador
        <select
          value={workerFilter}
          onChange={(e) => setWorkerFilter(e.target.value)}
        >
          <option value="">Todos os trabalhadores</option>
          {data.workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.number} · {w.name}
            </option>
          ))}
        </select>
      </label>
      <button
        className="outline-button"
        onClick={() => {
          setStart('')
          setEnd('')
          setWorkerFilter('')
        }}
      >
        Limpar filtros
      </button>
    </div>
  )

  return (
    <>
      <div className="app-frame">
        {mobileOpen && (
          <button
            className="mobile-backdrop"
            aria-label="Fechar navegação"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <aside className={`sidebar ${mobileOpen ? 'is-open' : ''}`}>
          <button className="brand" onClick={() => navigate('dashboard')}>
            <TextileMark />
            <span>
              DÓDOMI<small>COMERCIAL</small>
            </span>
          </button>
          <div className="workspace-label">
            <span className="workspace-symbol">
              <Factory size={17} />
            </span>
            <span>
              Gestão da fábrica<small>Unidade de Angola</small>
            </span>
            <ChevronRight size={15} />
          </div>
          <nav aria-label="Navegação principal">
            <span className="nav-caption">ESPAÇO DE TRABALHO</span>
            {navItem('dashboard', 'Painel principal', LayoutDashboard)}
            <span className="nav-caption">PESSOAS E PRODUÇÃO</span>
            {modules.slice(0, 6).map((m) => navItem(m.id, m.name, m.icon))}
            <span className="nav-caption">GESTÃO E CONTROLO</span>
            {modules.slice(6).map((m) => navItem(m.id, m.name, m.icon))}
          </nav>
          <div className="sidebar-bottom">
            <div className="security-box">
              <ShieldCheck size={21} />
              <strong>Gestão com confiança</strong>
              <p>
                Um acesso. A mesma visão.
                <br />
                Toda a informação protegida.
              </p>
            </div>
            <button className="nav-item" onClick={() => setHelpOpen(true)}>
              <CircleHelp size={18} />
              Ajuda e informações
              <ArrowUpRight size={15} />
            </button>
            <span className="sidebar-version">
              DÓDOMI COMERCIAL <span>v1.0</span>
            </span>
          </div>
        </aside>
        <div className="workspace">
          <header className="topbar">
            <div className="breadcrumb">
              <button
                className="mobile-menu icon-button"
                aria-label="Abrir navegação"
                onClick={() => setMobileOpen(true)}
              >
                <Menu size={22} />
              </button>
              <span>Espaço de trabalho</span>
              <ChevronRight size={14} />
              <strong>{activeModule?.name ?? 'Painel principal'}</strong>
            </div>
            <div className="topbar-actions">
              <span className="country">
                <span /> Angola
              </span>
              <span className="topbar-divider" />
              <button
                className="account-button"
                onClick={() =>
                  authenticated ? void signOut() : setLoginOpen(true)
                }
              >
                <span className="avatar">G</span>
                <span>
                  Gerência
                  <small>
                    {authenticated ? 'Sessão partilhada' : 'Acesso reservado'}
                  </small>
                </span>
                {authenticated ? (
                  <LogOut size={17} />
                ) : (
                  <LockKeyhole size={16} />
                )}
              </button>
            </div>
          </header>
          <main id="main-content">
            <div className="page-heading">
              <div>
                <span className="eyebrow">
                  DÓDOMI COMERCIAL / GESTÃO INTEGRADA
                </span>
                <h1>
                  {activeModule?.name ?? 'Painel principal'}
                  <span className="heading-dot">.</span>
                </h1>
                <p>
                  {page === 'dashboard'
                    ? 'Uma visão clara para gerir cada etapa da sua fábrica.'
                    : activeModule?.description}
                </p>
              </div>
              <div className="date-label">
                <CalendarDays size={17} />
                <span>
                  {new Date().toLocaleDateString('pt-AO', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'Africa/Luanda',
                  })}
                </span>
              </div>
            </div>
            {error && (
              <div className="error-banner" role="alert">
                {error}
                <button onClick={() => void refresh()}>Tentar novamente</button>
              </div>
            )}
            {page === 'dashboard' ? (
              <>
                <section className="hero-banner">
                  <div className="hero-copy">
                    <span className="hero-eyebrow">
                      <span /> CADA PEÇA CONTA. CADA PESSOA TAMBÉM.
                    </span>
                    <h2>
                      A sua fábrica.
                      <br />
                      <span>Tudo sob controlo.</span>
                    </h2>
                    <p>
                      Pessoas, produção e gestão financeira.
                      <br />
                      Ligadas num único espaço de trabalho.
                    </p>
                    <button
                      className="primary-button"
                      onClick={() =>
                        authenticated ? navigate('summary') : setLoginOpen(true)
                      }
                    >
                      {authenticated
                        ? 'Consultar resumo geral'
                        : 'Entrar na Gerência'}
                      <ArrowRight size={17} />
                    </button>
                  </div>
                  <div className="textile-art" aria-hidden="true">
                    <div className="art-orbit" />
                    <svg viewBox="0 0 440 300" fill="none">
                      <defs>
                        <linearGradient
                          id="cloth"
                          x1="100"
                          y1="60"
                          x2="340"
                          y2="260"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stopColor="#E3CB73" />
                          <stop offset="1" stopColor="#8F823E" />
                        </linearGradient>
                        <pattern
                          id="weave"
                          width="9"
                          height="9"
                          patternUnits="userSpaceOnUse"
                        >
                          <path
                            d="M0 1H9M1 0V9"
                            stroke="#fff"
                            strokeOpacity=".18"
                            strokeWidth=".6"
                          />
                        </pattern>
                      </defs>
                      <path
                        d="m111 111 165-71 108 69-166 74-107-72Z"
                        fill="#486357"
                      />
                      <path
                        d="m111 111 107 72 166-74v86l-166 74-107-70v-88Z"
                        fill="#254D3F"
                      />
                      <path
                        d="m111 135 107 72 166-74M111 159l107 72 166-74M111 183l107 72 166-74"
                        stroke="#6D8870"
                        strokeWidth="2"
                      />
                      <path
                        d="m61 88 168-66 105 66-167 72L61 88Z"
                        fill="url(#cloth)"
                      />
                      <path
                        d="m61 88 106 72 167-72v47l-167 73-106-73V88Z"
                        fill="#B9A85F"
                      />
                      <path
                        d="m61 88 168-66 105 66-167 72L61 88Z"
                        fill="url(#weave)"
                      />
                      <path
                        d="m167 160 167-72M167 160v48M74 106l93 65 154-65M74 120l93 65 154-66"
                        stroke="#D6C47A"
                        strokeWidth="1.5"
                      />
                      <path
                        d="m230 23 31 20-167 66-32-21 168-65Z"
                        fill="#F0DEA1"
                        fillOpacity=".4"
                      />
                      <path
                        d="m219 184 164-74"
                        stroke="#ADC0AA"
                        strokeDasharray="4 5"
                      />
                      <circle cx="368" cy="54" r="17" stroke="#8BA080" />
                      <path
                        d="m361 54 5 5 9-10"
                        stroke="#E6CE74"
                        strokeWidth="2"
                      />
                      <path
                        d="M48 199h55M75 173v53M349 248h24M361 236v24"
                        stroke="#9AAA84"
                        strokeOpacity=".5"
                      />
                    </svg>
                    <div className="art-caption">
                      <span className="art-caption-icon">
                        <TextileMark small />
                      </span>
                      <span>
                        Da primeira peça
                        <br />
                        <strong>ao último detalhe.</strong>
                      </span>
                    </div>
                  </div>
                  <span className="hero-number">01 — GESTÃO TÊXTIL</span>
                </section>
                <section className="stats-grid" aria-label="Indicadores gerais">
                  {stats.map((s) => (
                    <div className="stat-card" key={s.label}>
                      <div>
                        <span>{s.label}</span>
                        <s.icon size={18} />
                      </div>
                      <strong>
                        {loading ? <span className="skeleton" /> : s.value}
                      </strong>
                      <small>{s.caption}</small>
                    </div>
                  ))}
                </section>
                <section className="modules-section">
                  <div className="section-heading">
                    <div>
                      <h2>Áreas de gestão</h2>
                      <p>Seleccione uma área para começar.</p>
                    </div>
                    <span className="section-count">
                      10 módulos <span>disponíveis</span>
                    </span>
                  </div>
                  <div className="modules-grid">
                    {modules.map((m, index) => (
                      <button
                        key={m.id}
                        onClick={() => navigate(m.id)}
                        className="module-card"
                        style={{ animationDelay: `${index * 35}ms` }}
                      >
                        <div className="module-card-top">
                          <span className={`module-icon tone-${index % 4}`}>
                            <m.icon size={23} strokeWidth={1.6} />
                          </span>
                          <span className="module-number">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>
                        <h3>{m.name}</h3>
                        <p>{m.description}</p>
                        <div className="module-card-bottom">
                          <span>{m.category}</span>
                          <ArrowUpRight size={19} />
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
                <div className="dashboard-bottom">
                  <section className="activity-panel">
                    <div className="panel-heading">
                      <h2>Últimas operações</h2>
                      <button onClick={() => navigate('reports')}>
                        Ver histórico
                        <ArrowRight size={15} />
                      </button>
                    </div>
                    {data.history.length ? (
                      <div className="activity-list">
                        {data.history.slice(0, 3).map((h) => (
                          <div key={h.id}>
                            <span className="activity-check">
                              <Check size={15} />
                            </span>
                            <span>
                              <strong>{h.action}</strong>
                              <small>{h.detail}</small>
                            </span>
                            <time>
                              {new Date(h.createdAt).toLocaleDateString(
                                'pt-AO',
                              )}
                            </time>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Empty
                        text={
                          authenticated
                            ? 'O histórico começa aqui'
                            : 'O seu próximo passo começa aqui'
                        }
                        detail={
                          authenticated
                            ? 'Cada operação guardada fica registada para consulta.'
                            : 'Entre na Gerência para consultar e registar as operações da fábrica.'
                        }
                      />
                    )}
                  </section>
                  <section className="management-note">
                    <span className="note-icon">
                      <ShieldCheck size={23} />
                    </span>
                    <span className="eyebrow">ACESSO DA GERÊNCIA</span>
                    <h2>
                      Uma equipa.
                      <br />A mesma informação.
                    </h2>
                    <p>
                      Os dois gerentes trabalham com os mesmos dados e as mesmas
                      permissões.
                    </p>
                    <button
                      onClick={() =>
                        authenticated ? setHelpOpen(true) : setLoginOpen(true)
                      }
                    >
                      {authenticated
                        ? 'Sobre a sessão partilhada'
                        : 'Aceder com código'}
                      <ArrowRight size={17} />
                    </button>
                  </section>
                </div>
              </>
            ) : (
              <>
                {!authenticated && (
                  <div className="access-notice">
                    <LockKeyhole size={18} />
                    <span>
                      Os dados da fábrica estão protegidos. Entre para consultar
                      e guardar registos.
                    </span>
                    <button onClick={() => setLoginOpen(true)}>
                      Entrar na Gerência
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
                <section className="content-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>
                        {page === 'workers'
                          ? 'Trabalhadores da fábrica'
                          : activeModule?.name}
                      </h2>
                      <p>
                        {page === 'workers'
                          ? 'Um cadastro único para todas as áreas.'
                          : page === 'rates'
                            ? 'Tarifas fornecidas pela Gerência. Valores em kwanzas.'
                            : 'Informação partilhada entre os dois gerentes.'}
                      </p>
                    </div>
                    <div className="panel-actions">
                      {['workers', 'packaging', 'stock', 'defects'].includes(
                        page,
                      ) && (
                        <button
                          className="primary-button"
                          onClick={() =>
                            openForm(
                              page === 'workers'
                                ? 'worker'
                                : page === 'defects'
                                  ? 'defect'
                                  : page,
                            )
                          }
                        >
                          <Plus size={17} />
                          {page === 'workers'
                            ? 'Novo trabalhador'
                            : 'Novo registo'}
                        </button>
                      )}
                      {['stock', 'packaging'].includes(page) && (
                        <button
                          className="outline-button"
                          onClick={() => openForm('adjustment')}
                        >
                          Adiantamentos e descontos
                        </button>
                      )}
                      <button
                        className="icon-button"
                        aria-label="Actualizar dados"
                        onClick={() => void refresh()}
                      >
                        <RefreshCw
                          size={17}
                          className={loading ? 'rotating' : ''}
                        />
                      </button>
                    </div>
                  </div>
                  {page === 'workers' && (
                    <>
                      <div className="search-box">
                        <Search size={17} />
                        <Input
                          aria-label="Pesquisar trabalhador"
                          placeholder="Pesquisar por nome, número ou área…"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                      </div>
                      {data.workers.length ? (
                        <div className="table-scroll">
                          <table>
                            <thead>
                              <tr>
                                <th>Número</th>
                                <th>Nome / Função</th>
                                <th>Área</th>
                                <th>Turno</th>
                                <th>Admissão</th>
                                <th>Documentos</th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.workers
                                .filter((w) =>
                                  `${w.name} ${w.number} ${w.area}`
                                    .toLocaleLowerCase()
                                    .includes(query.toLocaleLowerCase()),
                                )
                                .map((w) => (
                                  <tr key={w.id}>
                                    <td>
                                      <span className="worker-number">
                                        {w.number}
                                      </span>
                                    </td>
                                    <td>
                                      <strong>{w.name}</strong>
                                      <small>{w.role}</small>
                                    </td>
                                    <td>{w.area}</td>
                                    <td>{w.shift}</td>
                                    <td>{dateLabel(w.admittedAt)}</td>
                                    <td>
                                      <button
                                        className="text-button"
                                        onClick={() =>
                                          setPrintDoc({
                                            title: 'Crachá de identificação',
                                            subtitle: 'DÓDOMI COMERCIAL',
                                            columns: [
                                              'Número',
                                              'Nome',
                                              'Função',
                                              'Área',
                                              'Turno',
                                            ],
                                            rows: [
                                              [
                                                w.number,
                                                w.name,
                                                w.role,
                                                w.area,
                                                w.shift,
                                              ],
                                            ],
                                          })
                                        }
                                      >
                                        Crachá
                                        <Printer size={15} />
                                      </button>
                                      <small>
                                        Contrato em duas vias: modelo pendente
                                      </small>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <Empty
                          text="Cada trabalhador começa com um cadastro"
                          detail="Registe o número individual, a função, a área, o turno e a data de admissão."
                        />
                      )}
                    </>
                  )}
                  {['sewing', 'cutting'].includes(page) && (
                    <div className="pending-model">
                      <span className="pending-icon">
                        {page === 'sewing' ? (
                          <Shirt size={35} />
                        ) : (
                          <Scissors size={35} />
                        )}
                      </span>
                      <span className="pill warning">
                        Modelo original pendente
                      </span>
                      <h3>O modelo aprovado tem o seu lugar reservado.</h3>
                      <p>
                        A ficha de{' '}
                        {page === 'sewing' ? 'costureiros' : 'cortistas'} é
                        integrada exactamente conforme o original. O registo de
                        produção e a impressão desta ficha ficam disponíveis
                        após a integração e validação.
                      </p>
                      <div className="pending-list">
                        {(page === 'sewing'
                          ? [
                              'Calendário mensal e produção diária por peça',
                              'Faltas, adiantamentos e descontos',
                              'Totais e impressão da ficha original',
                            ]
                          : [
                              'Modelo próprio dos cortistas',
                              'Produção por unidade e tarifas aprovadas',
                              'Totais e impressão da ficha original',
                            ]
                        ).map((t) => (
                          <span key={t}>
                            <LockKeyhole size={14} />
                            {t}
                          </span>
                        ))}
                      </div>
                      <button
                        className="outline-button"
                        onClick={() => navigate('rates')}
                      >
                        Consultar tarifas
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  )}
                  {['packaging', 'stock', 'defects'].includes(page) && (
                    <>
                      {filters}
                      {page === 'packaging' && (
                        <div className="info-strip">
                          40 Kz / jogo de cortinas · 40 Kz / jogo de lençóis. As
                          parcelas são consultadas filtrando por trabalhador.
                        </div>
                      )}
                      {page === 'stock' && (
                        <div className="info-strip">
                          Salário por presença. Faltas injustificadas separadas.
                          Arredondamento pendente de fórmula aprovada.
                        </div>
                      )}
                      {recordsTable(selectedRecords)}
                      {selectedRecords.length > 0 && (
                        <div className="table-footer">
                          <button
                            className="outline-button"
                            onClick={() =>
                              printRecords(
                                selectedRecords,
                                activeModule?.name ?? '',
                              )
                            }
                          >
                            <Printer size={16} />
                            Pré-visualizar impressão
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  {page === 'rates' && (
                    <>
                      <div className="table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>Área</th>
                              <th>Produto</th>
                              <th>Unidade de contagem</th>
                              <th>Tarifa</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rates.map((r) => (
                              <tr key={r.area + r.product}>
                                <td>{r.area}</td>
                                <td>{r.product}</td>
                                <td>Por {r.unit}</td>
                                <td>
                                  <strong>{money(r.cents)}</strong>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="info-strip">
                        Costureiros: contam-se peças individuais, nunca pares ou
                        jogos. Estoque: o valor diário é preenchido pela
                        Gerência. Não há alteração automática de tarifas.
                      </div>
                    </>
                  )}
                  {page === 'summary' && (
                    <>
                      <div className="info-strip">
                        <ShieldCheck size={16} /> Painel apenas de consulta. Os
                        valores são registados nas áreas de origem.
                      </div>
                      <div className="table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>Área</th>
                              <th>Produção</th>
                              <th>Bruto</th>
                              <th>Descontos</th>
                              <th>Adiantamentos</th>
                              <th>Saldo antes de arredondamento</th>
                            </tr>
                          </thead>
                          <tbody>
                            {areas.map((area) => {
                              const rows = data.records.filter((r) =>
                                area === 'Empacotadores'
                                  ? r.kind === 'packaging' ||
                                    (r.kind === 'adjustment' &&
                                      r.payload.area === area)
                                  : area === 'Organização / Estoque'
                                    ? r.kind === 'stock' ||
                                      (r.kind === 'adjustment' &&
                                        r.payload.area === area)
                                    : r.kind === 'adjustment' &&
                                      r.payload.area === area,
                              )
                              const sum = (
                                key:
                                  | 'grossCents'
                                  | 'discountCents'
                                  | 'advanceCents',
                              ) => rows.reduce((s, r) => s + r[key], 0)
                              return (
                                <tr key={area}>
                                  <td>
                                    <strong>{area}</strong>
                                  </td>
                                  <td>
                                    {area === 'Empacotadores'
                                      ? `${rows.filter((r) => r.kind === 'packaging').reduce((s, r) => s + (r.payload.curtains ?? 0) + (r.payload.sheets ?? 0), 0)} jogos`
                                      : area === 'Organização / Estoque'
                                        ? `${rows.filter((r) => r.kind === 'stock' && r.payload.present).length} presenças`
                                        : 'Modelo pendente'}
                                  </td>
                                  <td>{money(sum('grossCents'))}</td>
                                  <td>{money(sum('discountCents'))}</td>
                                  <td>{money(sum('advanceCents'))}</td>
                                  <td>
                                    {area === 'Costureiros' ||
                                    area === 'Corte / Cortistas'
                                      ? 'Pendente'
                                      : money(
                                          sum('grossCents') -
                                            sum('discountCents') -
                                            sum('advanceCents'),
                                        )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="quota-panel">
                        <h3>
                          Cota da Gerência{' '}
                          <span className="pill">Consulta transparente</span>
                        </h3>
                        <div className="calculation-preview">
                          <span>
                            Faltas injustificadas · Estoque
                            <strong>
                              {money(
                                data.records
                                  .filter((r) => r.kind === 'stock')
                                  .reduce((s, r) => s + r.discountCents, 0),
                              )}
                            </strong>
                          </span>
                          <span>
                            Redundância · Empacotamento
                            <strong>
                              {pendingCount
                                ? `${pendingCount} divisão(ões) pendente(s)`
                                : money(0)}
                            </strong>
                          </span>
                          <span>
                            Restos de arredondamento · Estoque
                            <strong>Regra pendente</strong>
                          </span>
                        </div>
                        <p className="muted">
                          Faltas no empacotamento são registadas sem criar um
                          valor fictício. A atribuição de montantes à cota por
                          essas faltas aguarda uma fórmula aprovada. Outros
                          descontos:{' '}
                          {money(
                            discounts -
                              data.records
                                .filter((r) => r.kind === 'stock')
                                .reduce((s, r) => s + r.discountCents, 0),
                          )}
                          .
                        </p>
                        <p className="muted">
                          O resumo por área apresenta a produção colectiva na
                          área de empacotamento, incluindo o apoio temporário.
                          As parcelas dos trabalhadores de apoio constam das
                          respectivas fichas de consulta.
                        </p>
                      </div>
                    </>
                  )}
                  {['reports', 'prints'].includes(page) && (
                    <>
                      {page === 'prints' && (
                        <div className="document-options">
                          <div>
                            <Printer size={24} />
                            <h3>Registos e relatórios</h3>
                            <p>
                              Pré-visualização e impressão dos dados
                              disponíveis.
                            </p>
                            <button
                              className="text-button"
                              onClick={() => navigate('reports')}
                            >
                              Consultar relatórios
                              <ArrowRight size={16} />
                            </button>
                          </div>
                          <div>
                            <Fingerprint size={24} />
                            <h3>Crachás dos trabalhadores</h3>
                            <p>Identificação associada ao número individual.</p>
                            <button
                              className="text-button"
                              onClick={() => navigate('workers')}
                            >
                              Escolher trabalhador
                              <ArrowRight size={16} />
                            </button>
                          </div>
                          <div>
                            <LockKeyhole size={24} />
                            <h3>Documentos originais</h3>
                            <p>
                              Fichas de costureiros, cortistas e contrato em
                              duas vias.
                            </p>
                            <span className="pill warning">
                              Modelos pendentes
                            </span>
                          </div>
                        </div>
                      )}
                      {filters}
                      <div className="report-actions">
                        <button
                          className="outline-button"
                          onClick={() => {
                            const today = new Date().toISOString().slice(0, 10)
                            setStart(today)
                            setEnd(today)
                          }}
                        >
                          Hoje
                        </button>
                        <button
                          className="outline-button"
                          onClick={() => {
                            const today = new Date()
                            const monday = new Date(today)
                            monday.setUTCDate(
                              today.getUTCDate() -
                                ((today.getUTCDay() + 6) % 7),
                            )
                            setStart(monday.toISOString().slice(0, 10))
                            setEnd(today.toISOString().slice(0, 10))
                          }}
                        >
                          Esta semana
                        </button>
                        <button
                          className="primary-button"
                          disabled={
                            !authenticated ||
                            !filteredRecords.length ||
                            (!!start && !!end && start > end)
                          }
                          onClick={() =>
                            printRecords(
                              filteredRecords,
                              workerFilter
                                ? 'Ficha individual de consulta — empacotamento e estoque'
                                : 'Relatório de operações',
                            )
                          }
                        >
                          <Printer size={16} />
                          Pré-visualizar e imprimir
                        </button>
                      </div>
                      {workerFilter && (
                        <div className="calculation-preview">
                          <span>
                            Bruto confirmado
                            <strong>
                              {money(
                                filteredRecords.reduce(
                                  (s, r) => s + r.grossCents,
                                  0,
                                ),
                              )}
                            </strong>
                          </span>
                          <span>
                            Descontos
                            <strong>
                              {money(
                                filteredRecords.reduce(
                                  (s, r) => s + r.discountCents,
                                  0,
                                ),
                              )}
                            </strong>
                          </span>
                          <span>
                            Adiantamentos
                            <strong>
                              {money(
                                filteredRecords.reduce(
                                  (s, r) => s + r.advanceCents,
                                  0,
                                ),
                              )}
                            </strong>
                          </span>
                          <span>
                            Saldo confirmado
                            <strong>
                              {money(
                                filteredRecords.reduce(
                                  (s, r) =>
                                    s +
                                    r.grossCents -
                                    r.discountCents -
                                    r.advanceCents,
                                  0,
                                ),
                              )}
                            </strong>
                          </span>
                        </div>
                      )}
                      {workerFilter &&
                        filteredRecords.some(
                          (r) => r.status === 'Distribuição pendente',
                        ) && (
                          <div className="info-strip">
                            Há parcelas pendentes. O saldo confirmado não inclui
                            essas parcelas.
                          </div>
                        )}
                      {recordsTable(filteredRecords)}
                      {page === 'reports' && (
                        <div className="history-section">
                          <h3>Histórico de operações</h3>
                          <p className="muted">
                            A conta partilhada identifica as operações como
                            Gerência. Não distingue os dois gerentes.
                          </p>
                          {data.history.length ? (
                            <div className="table-scroll">
                              <table>
                                <thead>
                                  <tr>
                                    <th>Data e hora</th>
                                    <th>Operação</th>
                                    <th>Detalhe</th>
                                    <th>Responsável</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {data.history.map((h) => (
                                    <tr key={h.id}>
                                      <td>
                                        {new Date(h.createdAt).toLocaleString(
                                          'pt-AO',
                                          { timeZone: 'Africa/Luanda' },
                                        )}
                                      </td>
                                      <td>{h.action}</td>
                                      <td>{h.detail}</td>
                                      <td>Gerência</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <Empty text="Sem operações registadas" />
                          )}
                        </div>
                      )}
                    </>
                  )}
                </section>
              </>
            )}
            <footer className="footer">
              <span>
                <TextileMark small />
                DÓDOMI COMERCIAL <span>Gestão Integrada da Fábrica Têxtil</span>
              </span>
              <span>
                <ShieldCheck size={14} /> Feito para uma gestão mais clara
              </span>
            </footer>
          </main>
        </div>
      </div>
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="factory-dialog login-dialog">
          <span className="dialog-icon">
            <LockKeyhole size={27} />
          </span>
          <DialogTitle>
            {inviteToken || recovering
              ? 'Definir código da Gerência'
              : 'Entrada da Gerência'}
          </DialogTitle>
          <DialogDescription>
            Um único código de acesso para os dois gerentes, com as mesmas
            permissões.
          </DialogDescription>
          <form onSubmit={signIn}>
            <label className="field">
              Código de acesso
              <Input
                autoFocus
                required
                name="code"
                type="password"
                autoComplete={
                  inviteToken || recovering
                    ? 'new-password'
                    : 'current-password'
                }
                minLength={inviteToken || recovering ? 12 : 1}
                placeholder="Introduza o código partilhado"
                maxLength={200}
              />
            </label>
            {loginError && (
              <p className="form-error" role="alert">
                {loginError}
              </p>
            )}
            <button
              className="primary-button"
              type="submit"
              disabled={loginBusy}
            >
              {loginBusy ? 'A validar…' : 'Entrar em segurança'}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="form-note">
            <ShieldCheck size={16} />O código é validado no servidor. O acesso
            depende da activação da conta da Gerência.
          </p>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!formKind}
        onOpenChange={(open) => {
          if (!open) setFormKind(null)
        }}
      >
        <DialogContent className="factory-dialog entry-dialog">
          <DialogTitle>
            {formKind === 'worker'
              ? 'Novo trabalhador'
              : formKind === 'packaging'
                ? 'Empacotamento colectivo'
                : formKind === 'stock'
                  ? 'Presença de Organização / Estoque'
                  : formKind === 'adjustment'
                    ? 'Adiantamento ou desconto'
                    : 'Registar defeito'}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados reais. Os cálculos e a gravação são validados no
            servidor.
          </DialogDescription>
          {formKind && (
            <RecordForm
              key={formKind}
              kind={formKind}
              ledgerArea={
                page === 'stock' ? 'Organização / Estoque' : 'Empacotadores'
              }
              workers={data.workers}
              onSaved={refresh}
              authenticated={authenticated}
              onLogin={() => setLoginOpen(true)}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="factory-dialog">
          <DialogTitle>Gestão integrada, com transparência</DialogTitle>
          <DialogDescription>
            Estado dos módulos e documentos da fábrica.
          </DialogDescription>
          <p>
            O cadastro, os defeitos, as presenças de estoque e o empacotamento
            colectivo utilizam uma base de dados online. É necessário activar a
            conta partilhada da Gerência para guardar e consultar dados.
          </p>
          <p>
            As fichas originais dos costureiros e cortistas e o contrato
            aguardam integração. O arredondamento do estoque, as divisões não
            exactas e os valores de faltas do empacotamento aguardam uma fórmula
            aprovada.
          </p>
          <p>
            Nenhuma destas pendências altera automaticamente a produção ou cria
            valores para a Gerência.
          </p>
        </DialogContent>
      </Dialog>
      {printDoc && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setPrintDoc(null)
          }}
        >
          <DialogContent className="factory-dialog print-dialog">
            <DialogTitle>{printDoc.title}</DialogTitle>
            <DialogDescription>
              Confira os dados antes de imprimir. Os documentos originais
              pendentes não são substituídos por este relatório.
            </DialogDescription>
            <div className="print-preview">
              <h3>DÓDOMI COMERCIAL</h3>
              <p>{printDoc.subtitle}</p>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      {printDoc.columns.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {printDoc.rows.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <button className="primary-button" onClick={() => window.print()}>
              <Printer size={16} />
              Imprimir documento
            </button>
          </DialogContent>
        </Dialog>
      )}
      {printDoc && <PrintableDocument document={printDoc} />}
    </>
  )
}
