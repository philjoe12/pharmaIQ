export interface DrugComparison {
  id: string
  name: string
  genericName?: string
  manufacturer: string
  drugClass: string
  indications: string[]
  commonSideEffects: string[]
  dosageForm: string
}

export interface ComparisonTableProps {
  drugs: DrugComparison[]
}

export function ComparisonTable({ drugs }: ComparisonTableProps) {
  if (!drugs.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Select drugs to compare them side by side.</p>
      </div>
    )
  }

  const comparisonFields = [
    { key: 'name', label: 'Brand Name' },
    { key: 'genericName', label: 'Generic Name' },
    { key: 'manufacturer', label: 'Manufacturer' },
    { key: 'drugClass', label: 'Drug Class' },
    { key: 'dosageForm', label: 'Dosage Form' },
    { key: 'indications', label: 'Indications' },
    { key: 'commonSideEffects', label: 'Common Side Effects' },
  ]

  const renderCellValue = (drug: DrugComparison, field: any) => {
    const value = drug[field.key as keyof DrugComparison]
    
    if (Array.isArray(value)) {
      return (
        <ul className="list-disc list-inside text-sm">
          {value.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )
    }
    
    return value || 'N/A'
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-2 bg-gray-100 text-left w-48">
              Comparison
            </th>
            {drugs.map((drug) => (
              <th key={drug.id} className="border border-gray-300 px-4 py-2 bg-gray-100 text-left">
                {drug.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparisonFields.map((field) => (
            <tr key={field.key}>
              <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50">
                {field.label}
              </td>
              {drugs.map((drug) => (
                <td key={`${drug.id}-${field.key}`} className="border border-gray-300 px-4 py-2 align-top">
                  {renderCellValue(drug, field)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}