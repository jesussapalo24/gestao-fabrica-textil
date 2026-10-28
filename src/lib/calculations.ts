// Money is stored as integer cêntimos. No rounding rule is inferred.
export function packaging(curtains: number, sheets: number, present: number) {
  const grossCents = (curtains + sheets) * 4000
  const exact = present > 0 && grossCents % present === 0
  return {
    grossCents,
    shareCents: exact ? grossCents / present : null,
    status: exact ? 'Distribuído' : 'Distribuição pendente',
    redundancyCents: exact ? 0 : null,
    numerator: grossCents,
    denominator: present,
  }
}
export function stock(
  present: boolean,
  dailyCents: number,
  absenceCents: number,
) {
  return {
    grossCents: present ? dailyCents : 0,
    discountCents: present ? 0 : absenceCents,
  }
}
export const money = (cents: number) =>
  new Intl.NumberFormat('pt-AO', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(cents / 100) + ' Kz'
export const rates = [
  { area: 'Costureiros', product: 'Cortina normal', unit: 'peça', cents: 4000 },
  {
    area: 'Costureiros',
    product: 'Cortina luxo / especial',
    unit: 'peça',
    cents: 6000,
  },
  { area: 'Costureiros', product: 'Lençol', unit: 'peça', cents: 3000 },
  { area: 'Costureiros', product: 'Fronha', unit: 'peça', cents: 2000 },
  {
    area: 'Corte / Cortistas',
    product: 'Cortina, lençol e edredão',
    unit: 'unidade',
    cents: 280,
  },
  { area: 'Corte / Cortistas', product: 'Fronha', unit: 'unidade', cents: 80 },
  {
    area: 'Empacotadores',
    product: 'Jogo de cortinas',
    unit: 'jogo',
    cents: 4000,
  },
  {
    area: 'Empacotadores',
    product: 'Jogo de lençóis',
    unit: 'jogo',
    cents: 4000,
  },
]
