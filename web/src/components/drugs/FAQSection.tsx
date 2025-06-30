'use client'

import { useState } from 'react'

interface FAQ {
  question: string
  answer: string
}

interface FAQSectionProps {
  faqs: FAQ[]
}

export function FAQSection({ faqs }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (!faqs.length) {
    return (
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
        <p className="text-gray-500">No FAQs available.</p>
      </section>
    )
  }

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
      <div className="space-y-2">
        {faqs.map((faq, index) => (
          <div key={index} className="border rounded-lg">
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-4 py-3 text-left font-medium flex justify-between items-center hover:bg-gray-50"
            >
              {faq.question}
              <span className="text-xl">{openIndex === index ? '' : '+'}</span>
            </button>
            {openIndex === index && (
              <div className="px-4 pb-3 border-t">
                <p className="text-gray-700 pt-3">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}