export type UserType = 'patient' | 'provider' | 'general';
interface UserTypeSelectorProps {
    currentUserType?: UserType;
    onUserTypeChange: (userType: UserType) => void;
    showAsModal?: boolean;
    compact?: boolean;
}
export declare function UserTypeSelector({ currentUserType, onUserTypeChange, showAsModal, compact }: UserTypeSelectorProps): import("react").JSX.Element | null;
export {};
