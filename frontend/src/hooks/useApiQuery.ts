// src/hooks/useApiQuery.ts
import { useQuery, useMutation, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import api from '@/lib/api';

// Standardized API response shape (used everywhere)
export type ApiResponse<T> = {
    success: boolean;
    data: T;
    message?: string;
    errors?: Array<{ field?: string; message: string }>; // for validation errors
};

// Generic GET query hook
export function useApiQuery<T>(
    key: string[], // or any serializable query key
    url: string,
    options?: Omit<UseQueryOptions<ApiResponse<T>, Error>, 'queryKey' | 'queryFn'>
) {
    return useQuery<ApiResponse<T>, Error>({
        queryKey: key,
        queryFn: async () => {
            const response = await api.get<ApiResponse<T>>(url);
            // Optional: throw if !success (makes error handling more consistent)
            if (!response.data.success) {
                throw new Error(response.data.message || 'API request failed');
            }
            return response.data;
        },
        staleTime: 30_000, // 30 seconds - good default for most data
        retry: (failureCount, error) => {
            // Don't retry on 4xx errors (client mistakes), retry 5xx once
            const axiosError = error as any;
            if (axiosError?.response?.status >= 400 && axiosError?.response?.status < 500) {
                return false;
            }
            return failureCount < 2;
        },
        ...options,
    });
}

// Generic mutation hook (POST / PUT / DELETE)
export function useApiMutation<T, V = unknown>(
    method: 'post' | 'put' | 'delete' | 'patch',
    url: string,
    options?: UseMutationOptions<ApiResponse<T>, Error, V>
) {
    return useMutation<ApiResponse<T>, Error, V>({
        mutationFn: async (variables: V) => {
            let response;

            switch (method) {
                case 'post':
                    response = await api.post<ApiResponse<T>>(url, variables);
                    break;
                case 'put':
                    response = await api.put<ApiResponse<T>>(url, variables);
                    break;
                case 'patch':
                    response = await api.patch<ApiResponse<T>>(url, variables);
                    break;
                case 'delete':
                    response = await api.delete<ApiResponse<T>>(url);
                    break;
                default:
                    throw new Error(`Unsupported mutation method: ${method}`);
            }

            if (!response.data.success) {
                throw new Error(response.data.message || 'Mutation failed');
            }

            return response.data;
        },
        ...options,
    });
}

// Convenience wrappers (optional - makes usage cleaner)

export const useApiGet = useApiQuery; // alias

export function useApiPost<T, V = unknown>(
    url: string,
    options?: UseMutationOptions<ApiResponse<T>, Error, V>
) {
    return useApiMutation<T, V>('post', url, options);
}

export function useApiPut<T, V = unknown>(
    url: string,
    options?: UseMutationOptions<ApiResponse<T>, Error, V>
) {
    return useApiMutation<T, V>('put', url, options);
}

export function useApiPatch<T, V = unknown>(
    url: string,
    options?: UseMutationOptions<ApiResponse<T>, Error, V>
) {
    return useApiMutation<T, V>('patch', url, options);
}

export function useApiDelete<T>(
    url: string,
    options?: UseMutationOptions<ApiResponse<T>, Error, void>
) {
    return useApiMutation<T, void>('delete', url, options);
}