export interface PrintDocument {
  title: string
  subtitle: string
  columns: string[]
  rows: string[][]
}

export function PrintableDocument({ document }: { document: PrintDocument }) {
  return (
    <article className="print-document">
      <header>
        <h1>DÓDOMI COMERCIAL</h1>
        <p>Gestão Integrada da Fábrica Têxtil · Angola</p>
      </header>
      <h2>{document.title}</h2>
      <p>{document.subtitle}</p>
      <table>
        <thead>
          <tr>
            {document.columns.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {document.rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <footer>
        Documento de consulta · Valores pendentes não constituem saldo
        definitivo · Gerência
      </footer>
    </article>
  )
}
