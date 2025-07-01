'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export type UserType = 'patient' | 'provider' | 'general';

interface UserTypeContextType {
  userType: UserType;
  setUserType: (type: UserType) => void;
  hasSetPreference: boolean;
  showUserTypeSelector: boolean;
  setShowUserTypeSelector: (show: boolean) => void;
}

const UserTypeContext = createContext<UserTypeContextType | undefined>(undefined);

const USER_TYPE_STORAGE_KEY = 'pharmaiq_user_type';
const USER_PREFERENCE_SET_KEY = 'pharmaiq_user_preference_set';

interface UserTypeProviderProps {
  children: ReactNode;
}

export function UserTypeProvider({ children }: UserTypeProviderProps) {
  const [userType, setUserTypeState] = useState<UserType>('general');
  const [hasSetPreference, setHasSetPreference] = useState(false);
  const [showUserTypeSelector, setShowUserTypeSelector] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize user type from various sources
  useEffect(() => {
    // Always initialize on client side
    if (typeof window === 'undefined') {
      setIsInitialized(true);
      return;
    }

    // 1. Check URL parameter first (highest priority)
    const urlUserType = searchParams.get('userType') as UserType;
    if (urlUserType && ['patient', 'provider', 'general'].includes(urlUserType)) {
      setUserTypeState(urlUserType);
      setIsInitialized(true);
      return;
    }

    // 2. Check localStorage for saved preference
    try {
      const savedUserType = localStorage.getItem(USER_TYPE_STORAGE_KEY) as UserType;
      const preferenceSet = localStorage.getItem(USER_PREFERENCE_SET_KEY) === 'true';
      
      if (savedUserType && ['patient', 'provider', 'general'].includes(savedUserType)) {
        setUserTypeState(savedUserType);
        setHasSetPreference(preferenceSet);
      } else {
        // 3. First-time user - show selector after a brief delay
        setHasSetPreference(false);
        setTimeout(() => {
          setShowUserTypeSelector(true);
        }, 2000);
      }
    } catch (e) {
      console.error('Error accessing localStorage:', e);
    }
    
    setIsInitialized(true);
  }, [searchParams]);

  const setUserType = (type: UserType) => {
    setUserTypeState(type);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_TYPE_STORAGE_KEY, type);
      localStorage.setItem(USER_PREFERENCE_SET_KEY, 'true');
    }
    
    setHasSetPreference(true);
    setShowUserTypeSelector(false);

    // Update URL if we're on a drug page and no userType param exists
    const currentPath = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    
    if (currentPath.includes('/drugs/') && !urlParams.has('userType')) {
      urlParams.set('userType', type);
      const newUrl = `${currentPath}?${urlParams.toString()}`;
      router.replace(newUrl, { scroll: false });
    }
  };

  // Don't render children until we've initialized the user type
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <UserTypeContext.Provider
      value={{
        userType,
        setUserType,
        hasSetPreference,
        showUserTypeSelector,
        setShowUserTypeSelector,
      }}
    >
      {children}
    </UserTypeContext.Provider>
  );
}

export function useUserType() {
  const context = useContext(UserTypeContext);
  if (context === undefined) {
    throw new Error('useUserType must be used within a UserTypeProvider');
  }
  return context;
}

// Hook for getting user type with URL parameter override
export function useEffectiveUserType(): UserType {
  const { userType } = useUserType();
  const searchParams = useSearchParams();
  
  const urlUserType = searchParams.get('userType') as UserType;
  if (urlUserType && ['patient', 'provider', 'general'].includes(urlUserType)) {
    return urlUserType;
  }
  
  return userType;
}