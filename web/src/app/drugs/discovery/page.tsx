'use client';

import { useState, useEffect } from 'react';
import { Metadata } from 'next';
import { SmartDrugDiscovery } from '@/components/discovery/SmartDrugDiscovery';

export default function DrugDiscoveryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Smart Drug Discovery
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover medications using natural language search, explore by medical conditions, 
            and get AI-powered insights tailored to your needs.
          </p>
        </div>
        
        <SmartDrugDiscovery />
      </div>
    </div>
  );
}