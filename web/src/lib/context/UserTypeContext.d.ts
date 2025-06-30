import { ReactNode } from 'react';
export type UserType = 'patient' | 'provider' | 'general';
interface UserTypeContextType {
    userType: UserType;
    setUserType: (type: UserType) => void;
    hasSetPreference: boolean;
    showUserTypeSelector: boolean;
    setShowUserTypeSelector: (show: boolean) => void;
}
interface UserTypeProviderProps {
    children: ReactNode;
}
export declare function UserTypeProvider({ children }: UserTypeProviderProps): import("react").JSX.Element;
export declare function useUserType(): UserTypeContextType;
export declare function useEffectiveUserType(): UserType;
export {};
