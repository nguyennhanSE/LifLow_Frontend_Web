'use client'
import { toast } from "sonner";
import { loginAction, logoutAction, naverCallbackAction } from "./auth.action";

export function useAuthHook() {
    async function handleLogin(username: string, password: string) {
        const result = await loginAction(username, password);
        if (!result.success) {
            toast.error(result.error || '로그인에 실패했습니다');
            return false;
        }
        if (result.role === 'ADMIN') {
            window.location.href = '/admin/members';
        } else {
            window.location.href = '/';
        }
        return true;
    }

    async function handleLogout(refreshToken: string) {
        const result = await logoutAction(refreshToken);
        if (!result.success) {
            toast.error(result.error || '로그아웃에 실패했습니다');
            return null;
        }
        return result.data;
    }

    async function handleNaverCallback(encodedResult: string) {
        try {
            const resultJson = atob(encodedResult);
            const result = JSON.parse(resultJson);
            console.log('result', result)
            
            if (!result.accessToken || !result.refreshToken || !result.user) {
                toast.error('Invalid callback result');
                return false;
            }

            const actionResult = await naverCallbackAction(
                result.accessToken,
                result.refreshToken,
                result.user
            );

            if (!actionResult.success) {
                toast.error(actionResult.error || '네이버 로그인에 실패했습니다');
                return false;
            }

            if (actionResult.role === 'ADMIN') {
                window.location.href = '/admin/members';
            } else {
                window.location.href = '/';
            }

            return true;
        } catch (error: any) {
            console.error('Naver callback error:', error);
            toast.error('네이버 로그인에 실패했습니다');
            return false;
        }
    }

    async function handleNaverLogin() {
        // try {
        //     const result = await naverLoginAction();
        //     return result;
        // }
        // catch (error: any) {
        //     toast.error(error?.message ?? '네이버 로그인에 실패했습니다');
        // }
    }
    async function handleKakaoLogin() {
        // try {
        //     const result = await kakaoLoginAction();
        //     return result;
        // }
        // catch (error: any) {
        //     toast.error(error?.message ?? '카카오 로그인에 실패했습니다');
        // }
    }
    return { handleLogin, handleLogout, handleNaverLogin, handleKakaoLogin, handleNaverCallback }
}