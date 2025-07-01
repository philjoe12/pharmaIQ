export interface DrugForComparison {
  setId: string;
  drugName: string;
  genericName?: string;
  manufacturer?: string;
  labeler?: string;
  slug: string;
  label: any;
  aiContent?: any;
}

export interface ComparisonTableProps {
  drugs: DrugForComparison[]
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
    { key: 'drugName', label: 'Brand Name' },
    { key: 'genericName', label: 'Generic Name' },
    { key: 'manufacturer', label: 'Manufacturer' },
    { key: 'drugClass', label: 'Drug Class' },
    { key: 'dosageForm', label: 'Dosage Form' },
    { key: 'indications', label: 'Indications' },
    { key: 'contraindications', label: 'Contraindications' },
    { key: 'warnings', label: 'Warnings' },
  ]

  const renderCellValue = (drug: DrugForComparison, field: any) => {
    if (field.key === 'drugName') {
      return drug.drugName || 'N/A';
    }
    if (field.key === 'genericName') {
      return drug.genericName || drug.label?.genericName || 'N/A';
    }
    if (field.key === 'manufacturer') {
      return drug.manufacturer || drug.labeler || 'N/A';
    }
    if (field.key === 'drugClass') {
      return drug.label?.pharmacologicClass || 'N/A';
    }
    if (field.key === 'dosageForm') {
      return drug.label?.dosageFormsAndStrengths || 'N/A';
    }
    if (field.key === 'indications') {
      const indications = drug.label?.indicationsAndUsage;
      if (indications) {
        // Strip HTML and truncate
        const text = indications.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        return text.length > 200 ? text.substring(0, 200) + '...' : text;
      }
      return 'N/A';
    }
    if (field.key === 'contraindications') {
      const contraindications = drug.label?.contraindications;
      if (contraindications) {
        const text = contraindications.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        return text.length > 200 ? text.substring(0, 200) + '...' : text;
      }
      return 'N/A';
    }
    if (field.key === 'warnings') {
      const warnings = drug.label?.warningsAndPrecautions;
      if (warnings) {
        const text = warnings.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        return text.length > 200 ? text.substring(0, 200) + '...' : text;
      }
      return 'N/A';
    }
    
    return 'N/A';
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
              <th key={drug.setId} className="border border-gray-300 px-4 py-2 bg-gray-100 text-left">
                {drug.drugName}
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
                <td key={`${drug.setId}-${field.key}`} className="border border-gray-300 px-4 py-2 align-top">
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