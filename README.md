# DÓDOMI COMERCIAL

Aplicação de gestão integrada para uma fábrica têxtil em Angola, com interface em português, navegação responsiva e acesso partilhado pela Gerência.

## Tecnologias

React 19, TypeScript, TanStack Start, Vite, Tailwind CSS, Lucide, Netlify Functions, Netlify Identity e Netlify Database (Postgres), com schema Drizzle ORM. A base de dados é partilhada; os dados definitivos não são guardados no navegador.

## Utilização local

Com Node 22.13+ ou 24 e pnpm, instale as dependências com `pnpm install`. Use `netlify dev --port 8889` num projecto associado ao Netlify para emular Functions, Identity e Database. A implantação aplica as migrações de `netlify/database/migrations`; não as aplique manualmente.

## Activação do acesso

Antes de utilizar dados reais, configure Identity para aceitar apenas convites. Convide uma única conta de correio controlada pela Gerência no painel Netlify. Defina a variável de execução `GERENCIA_EMAIL` com esse endereço, exclusivamente no painel de configuração. Nunca coloque credenciais no repositório.

O convite é processado na mesma entrada da aplicação e permite definir o código partilhado (mínimo de 12 caracteres na activação). Os dois gerentes utilizam esse código, sem fornecer email na entrada diária. O código é a palavra-passe da conta Identity; a validação é realizada no servidor. Não existe um código predefinido. Apenas a conta correspondente ao endereço configurado acede à API. O serviço Identity foi activado, mas o convite e a configuração da conta requerem o responsável do projecto.

A recuperação do código é iniciada pelo responsável através da gestão Identity. A aplicação processa a ligação de recuperação e permite definir o novo código. As sessões têm a expiração e a renovação do Identity. O início da sessão tem limite persistente de oito tentativas por endereço IP por intervalo de 15 minutos, além dos limites do Identity. O registo público é recusado. As operações são atribuídas à Gerência; um código partilhado não permite distinguir qual dos dois gerentes executou a operação.

## Módulos disponíveis

O painel tem dez áreas. O cadastro mantém números individuais únicos, função, área, turno e admissão, e permite imprimir a identificação. O empacotamento regista a produção por data e turno, presentes, ausentes e apoio. O estoque regista os valores diários e os descontos por falta injustificada. Existem registo de defeitos, tarifas de consulta, resumo por área, relatórios com filtros por trabalhador e período, consulta individual e histórico das operações. Os relatórios têm pré-visualização e estilos de impressão A4 horizontal.

A gravação de uma operação, as suas parcelas individuais e o histórico são atómicos. Uma restrição única impede duplicar o empacotamento de uma data e turno ou a presença de estoque do mesmo trabalhador. Os registos são acrescentados sem edição ou remoção silenciosa; um fluxo de correcções auditadas é uma melhoria futura.

## Regras preservadas e pendências

Os valores monetários são guardados em cêntimos inteiros. O empacotamento calcula 40 Kz por jogo. As divisões exactas são distribuídas aos presentes, incluindo apoio. As divisões que não são exactas ao cêntimo conservam o bruto e a fracção exacta de cada parcela, mas ficam pendentes sem criar um valor de redundância nem um saldo fictício. Não se presume qualquer arredondamento para múltiplos de 50 Kz. Os ausentes ficam identificados e não recebem parcelas. A atribuição de montantes de faltas à cota da Gerência no empacotamento aguarda uma fórmula aprovada.

O estoque soma o valor diário dos presentes, separa o desconto manual das faltas injustificadas na cota da Gerência e não calcula restos de arredondamento sem fórmula aprovada. Os saldos apresentados são anteriores a esse arredondamento. Adiantamentos e outros descontos são lançamentos explícitos. A produção nunca é criada ou retirada a partir de defeitos ou faltas.

As fichas originais dos costureiros e cortistas e o contrato para duas vias aguardam os documentos aprovados. Os respectivos registos de produção e impressões estão bloqueados; os relatórios de consulta não substituem esses modelos. As tarifas fornecidas estão disponíveis para consulta.

## Verificação

Foram acrescentados testes de cálculo em `src/lib/calculations.test.ts`, incluindo conservação de valores, divisões não exactas, ausência de presentes, presença e desconto. Foram também acrescentados testes de conteúdo dos documentos de impressão em `src/components/printable-document.test.tsx`. Estes testes não foram executados nesta sessão; a validação automática da plataforma é posterior às alterações. Antes de operação real, execute os testes com `pnpm test` e confirme no navegador a entrada, a gravação simultânea, a impressão A4, as quebras de página e a activação por convite. A impressão física e o funcionamento com a conta real ainda não foram validados.
