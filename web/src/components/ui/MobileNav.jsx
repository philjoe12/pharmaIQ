'use client';
import { useState } from 'react';
import { useUserType } from '../lib/context/UserTypeContext';
export default function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);
    const { userType, setUserType } = useUserType();
    const toggleMenu = () => setIsOpen(!isOpen);
    const navItems = [
        { href: '/search', label: 'Drug Search' },
        { href: '/drugs/discovery', label: 'Drug Discovery' },
        { href: '/drugs/compare', label: 'Compare Drugs' },
    ];
    const userTypes = [
        { key: 'patient', label: 'Patient' },
        { key: 'provider', label: 'Healthcare Provider' },
        { key: 'general', label: 'General' },
    ];
    return (<>
      {/* Mobile menu button */}
      <div className="lg:hidden flex items-center">
        <button onClick={toggleMenu} className="text-gray-600 hover:text-gray-900 p-2" aria-label="Toggle navigation menu">
          <svg className={`w-6 h-6 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>) : (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>)}
          </svg>
        </button>
      </div>

      {/* Mobile menu overlay */}
      {isOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={toggleMenu}/>)}

      {/* Mobile menu drawer */}
      <div className={`
        fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-xl font-bold text-gray-900">PharmaIQ</span>
            </div>
            <button onClick={toggleMenu} className="text-gray-600 hover:text-gray-900 p-2" aria-label="Close navigation menu">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* User type selector */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">I am a:</h3>
            <div className="space-y-2">
              {userTypes.map((type) => (<button key={type.key} onClick={() => {
                setUserType(type.key);
                setIsOpen(false);
            }} className={`
                    w-full text-left px-4 py-3 rounded-lg transition-colors duration-200
                    ${userType === type.key
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:bg-gray-50 border border-transparent'}
                  `}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{type.label}</span>
                    {userType === type.key && (<svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>)}
                  </div>
                </button>))}
            </div>
          </div>

          {/* Navigation items */}
          <div className="flex-1 p-6">
            <nav className="space-y-4">
              {navItems.map((item) => (<a key={item.href} href={item.href} onClick={toggleMenu} className="block text-gray-700 hover:text-blue-600 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  {item.label}
                </a>))}
            </nav>
          </div>

          {/* Call to action */}
          <div className="p-6 border-t border-gray-200">
            <a href="/search" onClick={toggleMenu} className="block w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white text-center px-6 py-3 rounded-lg hover:from-blue-700 hover:to-teal-700 font-medium transition-all shadow-md hover:shadow-lg">
              Search Drugs Now
            </a>
          </div>

          {/* User type info */}
          <div className="p-6 bg-gray-50">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Currently viewing as: <span className="font-semibold text-gray-900">{userTypes.find(t => t.key === userType)?.label}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Content is tailored to your selected user type
              </p>
            </div>
          </div>
        </div>
      </div>
    </>);
}
