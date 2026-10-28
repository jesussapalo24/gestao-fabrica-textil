# DÓDOMI COMERCIAL — arquitectura

Aplicação TanStack Start / React / TypeScript em português de Angola. A rota `src/routes/index.tsx` monta `FactoryApp`. O documento e metadados estão em `src/routes/__root.tsx`. O design usa verde profundo, amarelo e cartões claros. `src/styles.css` contém o tema, responsividade, impressão e redução de movimento.

## Organização

- `src/components/factory-app.tsx`: painel, navegação, filtros, consultas, sessão, pré-visualização e documento de impressão.
- `src/components/record-form.tsx`: formulários de cadastro, empacotamento, estoque, defeitos e ajustes.
- `src/components/ui`: componentes Radix / shadcn.
- `src/lib/calculations.ts`: cálculos puros e tarifas em cêntimos; testes adjacentes.
- `src/lib/factory-types.ts`: tipos de dados e cliente HTTP.
- `netlify/functions/management.mts`: API autenticada, validação Zod, autenticação Identity e transacções.
- `netlify/functions/identity-policy.mts`: recusa de registo público.
- `db/schema.ts`: schema Drizzle para trabalhadores, registos, auditoria e tentativas de entrada.
- `db/index.ts`: fábrica do cliente Drizzle para consultas. As gravações atómicas usam o pool de `@netlify/database`.
- `drizzle.config.ts` e `netlify/database/migrations`: migrações aplicadas pela plataforma.

## Convenções e decisões

Não exponha o email configurado nem o código partilhado. A API usa `@netlify/identity` e autoriza apenas o email de execução `GERENCIA_EMAIL`; não há credenciais no código. A conta é criada por convite. Os dois gerentes têm as mesmas permissões e o histórico identifica a conta partilhada como Gerência. Cookies de sessão pertencem ao Identity; o código não é persistido pela aplicação. Pedidos de gravação exigem a mesma origem.

Dinheiro: cêntimos inteiros. Não inventar fórmulas. Divisões não exactas no empacotamento ficam pendentes; as fracções são conservadas. O estoque não arredonda sem confirmação. Faltas injustificadas de estoque são uma cota separada; não se presume uma cota monetária para faltas de empacotamento. Apoio de outras áreas recebe uma parcela individual na ficha de consulta, enquanto a produção colectiva aparece no resumo da área de empacotamento. Nunca somar bruto colectivo e parcelas como se fossem produções distintas.

Fichas originais de costureiros/cortistas e contrato em duas vias estão pendentes. Não criar substitutos. Crachás e relatórios de consulta são documentos distintos. A produção destes dois sectores permanece bloqueada até integração dos modelos aprovados.

Os registos são imutáveis nesta versão. Não implementar remoções ou alterações que modifiquem produção silenciosamente; correcções futuras precisam de eventos auditados. As restrições únicas e transacções impedem duplicação de turnos e gravações parciais. Ao mudar o schema, gerar uma nova migração; não executar migrações manualmente.

O estado de interface pode estar em React; os dados definitivos pertencem exclusivamente ao Postgres online. Não usar localStorage para dados da fábrica. Não introduzir dados fictícios em produção. No ambiente do agente, não executar builds, servidores, testes ou validação local se as instruções da plataforma os proibirem. Os testes adicionados e a impressão ainda requerem validação operacional.
