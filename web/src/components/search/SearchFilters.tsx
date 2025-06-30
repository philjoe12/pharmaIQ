'use client'

import { useState } from 'react'

interface SearchFiltersProps {
  onFilterChange: (filters: SearchFilters) => void
}

interface SearchFilters {
  category?: string
  manufacturer?: string
  prescription?: boolean
}

export function SearchFilters({ onFilterChange }: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>({})

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold">Filters</h3>
      
      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <select
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="">All Categories</option>
          <option value="pain-relief">Pain Relief</option>
          <option value="antibiotics">Antibiotics</option>
          <option value="cardiovascular">Cardiovascular</option>
        </select>
      </div>
      
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            onChange={(e) => handleFilterChange('prescription', e.target.checked)}
            className="mr-2"
          />
          Prescription Only
        </label>
      </div>
    </div>
  )
}