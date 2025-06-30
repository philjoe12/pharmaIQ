export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
}
export interface ApiError {
    message: string;
    status: number;
    details?: any;
}
declare class ApiClient {
    private baseUrl;
    constructor(baseUrl?: string);
    private request;
    private requestWithRetry;
    get<T>(endpoint: string): Promise<ApiResponse<T>>;
    post<T>(endpoint: string, data: any): Promise<ApiResponse<T>>;
    put<T>(endpoint: string, data: any): Promise<ApiResponse<T>>;
    delete<T>(endpoint: string): Promise<ApiResponse<T>>;
}
export declare const apiClient: ApiClient;
export {};
