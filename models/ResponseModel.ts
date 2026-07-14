import { AxiosError, AxiosResponse } from "axios";

const FALLBACK_NO_RESPONSE = "An unknown error occurred";

export class ResponseModel {
    private message : string;
    private status : number;
    private error : any;
    constructor(response: AxiosResponse<any> | AxiosError<any> | null | undefined){
        // Initialize first so extractMessage() can safely setError() without being overwritten.
        this.error = this.extractErrorDetails(response);
        this.message = this.extractMessage(response);
        this.status = this.extractStatus(response);
    }

    /**
     * Extract raw error details payload from various backend shapes.
     * IMPORTANT: This returns RAW (no localization), so callers can render/log the original payload.
     */
    public extractErrorDetails(response: AxiosResponse<any> | AxiosError<any> | null | undefined): any {
        if (!response) return null;

        const res: AxiosResponse<any> | undefined =
            response instanceof AxiosError ? response.response : response;

        const responseData = res?.data;

        if (typeof responseData?.error?.message === 'string' || typeof responseData?.message === 'string') {
            return responseData?.error?.message ?? responseData?.message;
        }
        if (responseData?.detail != null) return responseData.detail;
        if (responseData?.error?.detail != null) return responseData.error.detail;
        if (responseData?.error?.details != null) return responseData.error.details;
        if (responseData?.details != null) return responseData.details;
        return null;
    }

    public extractMessage(response: AxiosResponse<any> | AxiosError<any> | null | undefined): string {
        // Không có response từ server (lỗi mạng, timeout) → fallback
        if (response instanceof AxiosError && !response.response) {
            if (response.code === 'ECONNABORTED' || response.message?.includes('timeout')) {
                return "Request timeout. Please try again.";
            }
            if (response.code === 'ERR_NETWORK' || response.message?.includes('Network Error')) {
                return "Network error. Please check your connection.";
            }
            if (response.message?.trim()) return response.message;
            return "Connection error. Please try again.";
        }

        if (!response) return FALLBACK_NO_RESPONSE;

        // Support both AxiosResponse and AxiosError (in case callers pass the error directly).
        const res: AxiosResponse<any> | undefined =
            response instanceof AxiosError ? response.response : response;

        const responseData = res?.data;

        const normalizeDetailToString = (detail: any): string | null => {
            if (typeof detail === 'string' && detail.trim().length > 0) return detail;
            if (detail && typeof detail === 'object' && typeof detail.msg === 'string' && detail.msg.trim().length > 0) {
                return detail.msg;
            }
            return null;
        };

        // 1) Ưu tiên message từ server (trả về nguyên bản, không dịch)
        if (typeof responseData?.error?.message === 'string' && responseData.error.message.trim()) {
            return responseData.error.message;
        }
        if (typeof responseData?.message === 'string' && responseData.message.trim()) {
            return responseData.message;
        }

        // 2) Response body là string
        if (typeof responseData === 'string' && responseData.trim()) {
            return responseData;
        }

        // 3) detail / details từ server
        const rootDetail = normalizeDetailToString(responseData?.detail);
        if (rootDetail) return rootDetail;

        const nestedDetail = normalizeDetailToString(responseData?.error?.detail);
        if (nestedDetail) return nestedDetail;

        // detail có thể là mảng (vd: FastAPI)
        if (Array.isArray(responseData?.detail) && responseData.detail.length > 0) {
            const first = normalizeDetailToString(responseData.detail[0]) ?? String(responseData.detail[0]);
            if (first) return first;
        }

        if (Array.isArray(responseData?.error?.details) && responseData.error.details.length > 0) {
            const first = normalizeDetailToString(responseData.error.details[0]);
            if (first) return first;
        }

        if (Array.isArray(responseData?.details) && responseData.details.length > 0) {
            const first = normalizeDetailToString(responseData.details[0]);
            if (first) return first;
        }

        // 4) Fallback khi không có message từ server
        if (res?.statusText?.trim()) return res.statusText;
        return FALLBACK_NO_RESPONSE;
    }

    public extractStatus(response: AxiosResponse<any> | AxiosError<any> | null | undefined): number {
        // Handle AxiosError without response (network errors, timeouts, etc.)
        if (response instanceof AxiosError && !response.response) {
            return 0; // Network error status
        }

        if (!response) return 500;

        const res: AxiosResponse<any> | undefined =
            response instanceof AxiosError ? response.response : response;

        const responseData = res?.data;
        if (typeof responseData?.status === 'number') return responseData.status;
        return res?.status || 500;
    }
    public getMessage(): string {
        return this.message;
    }
    public getStatus(): number {
        return this.status;
    }
    public setMessage(message: string): void {
        this.message = message;
    }
    public setStatus(status: number): void {
        this.status = status;
    }
    public getError(): any {
        return this.error;
    }
    public setError(error: any): void {
        this.error = error;
    }
    public getErrorMessgae(error: AxiosError<any> | null | undefined): string {
        if (!error) return FALLBACK_NO_RESPONSE;
        return this.extractMessage(error);
    }
}
