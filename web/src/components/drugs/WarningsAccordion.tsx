'use client'

import { useState } from 'react'

interface Warning {
  title: string
  content: string
  severity: 'high' | 'medium' | 'low'
}

interface WarningsAccordionProps {
  warnings: Warning[]
}

export function WarningsAccordion({ warnings }: WarningsAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (!warnings.length) {
    return (
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Warnings & Precautions</h2>
        <p className="text-gray-500">No warnings available.</p>
      </section>
    )
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-50'
      case 'medium': return 'border-yellow-500 bg-yellow-50'
      case 'low': return 'border-blue-500 bg-blue-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4">Warnings & Precautions</h2>
      <div className="space-y-2">
        {warnings.map((warning, index) => (
          <div key={index} className={`border rounded-lg ${getSeverityColor(warning.severity)}`}>
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-4 py-3 text-left font-medium flex justify-between items-center"
            >
              {warning.title}
              <span className="text-xl">{openIndex === index ? '' : '+'}</span>
            </button>
            {openIndex === index && (
              <div className="px-4 pb-3">
                <p className="text-gray-700">{warning.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}