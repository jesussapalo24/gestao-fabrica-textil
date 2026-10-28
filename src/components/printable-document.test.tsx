import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PrintableDocument } from './printable-document'

describe('Documento de impressão', () => {
  it('conserva os valores pendentes e a identificação na impressão', () => {
    render(
      <PrintableDocument
        document={{
          title: 'Ficha individual de consulta',
          subtitle: 'DC-018 · Outubro de 2026',
          columns: ['Trabalhador', 'Parcela', 'Estado'],
          rows: [['DC-018', 'Por apurar', 'Distribuição pendente']],
        }}
      />,
    )
    expect(
      screen.getByRole('heading', { name: 'DÓDOMI COMERCIAL' }),
    ).toBeInTheDocument()
    expect(screen.getByText('DC-018 · Outubro de 2026')).toBeInTheDocument()
    const table = screen.getByRole('table')
    expect(within(table).getAllByRole('columnheader')).toHaveLength(3)
    expect(within(table).getByText('Por apurar')).toBeInTheDocument()
    expect(within(table).getByText('Distribuição pendente')).toBeInTheDocument()
    expect(
      screen.getByText(/Valores pendentes não constituem saldo definitivo/),
    ).toBeInTheDocument()
  })
  it('trata os nomes e descrições como texto, incluindo caracteres especiais', () => {
    render(
      <PrintableDocument
        document={{
          title: 'Relatório diário',
          subtitle: 'Consulta',
          columns: ['Descrição'],
          rows: [['Cortina <luxo> & especial']],
        }}
      />,
    )
    expect(screen.getByRole('cell').textContent).toBe(
      'Cortina <luxo> & especial',
    )
    expect(screen.getByRole('cell').querySelector('luxo')).toBeNull()
  })
})
