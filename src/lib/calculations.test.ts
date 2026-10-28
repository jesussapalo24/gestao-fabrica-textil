import { describe, it, expect } from 'vitest'
import { packaging, stock, rates } from './calculations'

describe('Cálculo colectivo sem alterar a produção', () => {
  it('aplica 40 Kz a cada jogo e distribui uma divisão exacta', () => {
    const result = packaging(12, 8, 4)
    expect(result).toMatchObject({
      grossCents: 80000,
      shareCents: 20000,
      redundancyCents: 0,
      status: 'Distribuído',
    })
    expect(result.shareCents! * 4 + result.redundancyCents!).toBe(
      result.grossCents,
    )
  })
  it('mantém a divisão não exacta pendente, sem inventar arredondamentos', () => {
    expect(packaging(1, 0, 3)).toMatchObject({
      grossCents: 4000,
      shareCents: null,
      redundancyCents: null,
      numerator: 4000,
      denominator: 3,
      status: 'Distribuição pendente',
    })
  })
  it('não aplica múltiplos de 50 Kz às parcelas exactas', () => {
    expect(packaging(1, 0, 2).shareCents).toBe(2000)
  })
  it('não distribui sem presentes nem divide por zero', () => {
    expect(packaging(10, 5, 0)).toMatchObject({
      grossCents: 60000,
      shareCents: null,
    })
  })
  it('aceita produção zero explicitamente registada', () => {
    expect(packaging(0, 0, 2)).toMatchObject({
      grossCents: 0,
      shareCents: 0,
      redundancyCents: 0,
    })
  })
})
describe('Estoque e tarifas em cêntimos', () => {
  it('soma apenas o valor diário da presença', () => {
    expect(stock(true, 123456, 5000)).toEqual({
      grossCents: 123456,
      discountCents: 0,
    })
  })
  it('separa o desconto de uma falta injustificada', () => {
    expect(stock(false, 123456, 27550)).toEqual({
      grossCents: 0,
      discountCents: 27550,
    })
  })
  it('não calcula um desconto para falta justificada', () => {
    expect(stock(false, 123456, 0)).toEqual({ grossCents: 0, discountCents: 0 })
  })
  it('preserva as tarifas de corte sem erro de ponto flutuante', () => {
    expect(
      rates.filter((r) => r.area === 'Corte / Cortistas').map((r) => r.cents),
    ).toEqual([280, 80])
  })
})
