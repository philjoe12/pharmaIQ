'use client';

import { useState, useEffect } from 'react';
import { User, Stethoscope, Users, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export type UserType = 'patient' | 'provider' | 'general';

interface UserTypeOption {
  value: UserType;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  features: string[];
  audience: string;
}

const userTypeOptions: UserTypeOption[] = [
  {
    value: 'patient',
    label: 'Patient',
    description: 'I am looking for information about my medications',
    icon: User,
    features: [
      'Patient-friendly explanations',
      'Side effect information',
      'Drug interaction warnings',
      'When to contact your doctor',
      'Simplified dosing instructions'
    ],
    audience: 'Patients and caregivers seeking easy-to-understand medication information'
  },
  {
    value: 'provider',
    label: 'Healthcare Provider',
    description: 'I am a healthcare professional',
    icon: Stethoscope,
    features: [
      'Clinical prescribing information',
      'Pharmacokinetics data',
      'Contraindications and warnings',
      'Drug interaction details',
      'Dosing guidelines and adjustments',
      'Clinical trial data'
    ],
    audience: 'Doctors, nurses, pharmacists, and other healthcare professionals'
  },
  {
    value: 'general',
    label: 'General Information',
    description: 'I want comprehensive drug information',
    icon: Users,
    features: [
      'Balanced medical information',
      'General drug facts',
      'Uses and benefits',
      'Common side effects',
      'Basic safety information'
    ],
    audience: 'General public, students, researchers, and educators'
  }
];

interface UserTypeSelectorProps {
  currentUserType?: UserType;
  onUserTypeChange: (userType: UserType) => void;
  showAsModal?: boolean;
  compact?: boolean;
}

export function UserTypeSelector({ 
  currentUserType, 
  onUserTypeChange, 
  showAsModal = false,
  compact = false 
}: UserTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<UserType>(currentUserType || 'general');
  const [isVisible, setIsVisible] = useState(showAsModal);

  useEffect(() => {
    if (currentUserType) {
      setSelectedType(currentUserType);
    }
  }, [currentUserType]);

  const handleSelect = (userType: UserType) => {
    setSelectedType(userType);
    onUserTypeChange(userType);
    if (showAsModal) {
      setIsVisible(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">View as:</span>
        <select
          value={selectedType}
          onChange={(e) => handleSelect(e.target.value as UserType)}
          className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {userTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Personalize Your Experience
        </h2>
        <p className="text-gray-600">
          Choose your role to see the most relevant drug information for you
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {userTypeOptions.map((option) => {
          const IconComponent = option.icon;
          const isSelected = selectedType === option.value;
          
          return (
            <Card
              key={option.value}
              className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isSelected 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:ring-1 hover:ring-gray-300'
              }`}
              onClick={() => handleSelect(option.value)}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${
                    isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {option.label}
                  </h3>
                </div>
                
                <p className="text-gray-600 mb-4 text-sm">
                  {option.description}
                </p>
                
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2 font-medium">
                    {option.audience}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-700">Features include:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {option.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        {feature}
                      </li>
                    ))}
                    {option.features.length > 3 && (
                      <li className="text-gray-400">
                        +{option.features.length - 3} more features
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {showAsModal && (
        <div className="flex justify-center pt-4">
          <Button 
            onClick={() => setIsVisible(false)}
            className="px-8 py-2"
          >
            Continue with {userTypeOptions.find(opt => opt.value === selectedType)?.label}
          </Button>
        </div>
      )}
    </div>
  );

  if (showAsModal && isVisible) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {content}
          </div>
        </div>
      </div>
    );
  }

  if (showAsModal && !isVisible) {
    return null;
  }

  return content;
}