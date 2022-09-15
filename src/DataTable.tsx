const DataTable = ({headers, data, cellRenderer}: {
  headers: Array<{ title: string, key: string, className: string }>,
  cellRenderer: (key: string, value: any) => React.ReactNode,
  data: Array<any>
}) => {
  return (
    <table>
      <thead>
      <tr>
        ${headers.map(header => <th className={header.className}>${header.title}</th>)}
      </tr>
      </thead>
      <tbody>
      ${data.map(row => <tr>{headers.map(header => <td>${cellRenderer(row[header.key], row)}</td>)}
      </tr>)}
      </tbody>
    </table>);
}

export default DataTable;
