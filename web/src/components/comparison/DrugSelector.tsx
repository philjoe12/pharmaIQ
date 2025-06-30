'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface Drug {
  id: string
  name: string
  genericName?: string
}

interface DrugSelectorProps {
  availableDrugs: Drug[]
  onDrugsSelected: (drugs: Drug[]) => void
  maxSelection?: number
}

export function DrugSelector({ availableDrugs, onDrugsSelected, maxSelection = 3 }: DrugSelectorProps) {
  const [selectedDrugs, setSelectedDrugs] = useState<Drug[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const filteredDrugs = availableDrugs.filter(drug =>
    drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (drug.genericName && drug.genericName.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleDrugSelect = (drug: Drug) => {
    if (selectedDrugs.find(d => d.id === drug.id)) {
      const newSelection = selectedDrugs.filter(d => d.id !== drug.id)
      setSelectedDrugs(newSelection)
    } else if (selectedDrugs.length < maxSelection) {
      const newSelection = [...selectedDrugs, drug]
      setSelectedDrugs(newSelection)
    }
  }

  const handleCompare = () => {
    onDrugsSelected(selectedDrugs)
  }

  return (
    <div className="space-y-4">
      <div>
        <input
          type="text"
          placeholder="Search drugs to compare..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div className="max-h-60 overflow-y-auto border rounded-md">
        {filteredDrugs.map((drug) => (
          <div
            key={drug.id}
            onClick={() => handleDrugSelect(drug)}
            className={`p-3 cursor-pointer border-b hover:bg-gray-50 ${
              selectedDrugs.find(d => d.id === drug.id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
            }`}
          >
            <div className="font-medium">{drug.name}</div>
            {drug.genericName && (
              <div className="text-sm text-gray-600">{drug.genericName}</div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">
          {selectedDrugs.length} of {maxSelection} drugs selected
        </span>
        <Button 
          onClick={handleCompare} 
          disabled={selectedDrugs.length < 2}
        >
          Compare Drugs
        </Button>
      </div>
    </div>
  )
}