'use server'

import { cookies } from 'next/headers';
import { serviceAxios } from '@/lib/axios/axios';
import { ResponseModel } from '@/models/ResponseModel';

const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

export async function loginAction(id: string, password: string): Promise<{ success: true; role: string } | { success: false; error: string }> {
  const cookieStore = await cookies();
  try {
    const response = await serviceAxios.post(`${apiUrl}/auth/login`, { username: id, password });
    console.log('response', response);
    if (!response.data) {
      return { success: false, error: 'Invalid response from server' };
    }

    if (response.data.data.accessToken) {
      cookieStore.set('access_token', response.data.data.accessToken, {
        httpOnly: false,
        secure: false,
        path: '/',
      });
    }

    if (response.data.data.refreshToken) {
      cookieStore.set('refresh_token', response.data.data.refreshToken, {
        httpOnly: false,
        secure: false,
        path: '/',
      });
    }

    const user = response.data.user || response.data.data?.user;
    if (!user) {
      console.error('User data not found in response:', response.data);
      return { success: false, error: 'User data not found in response' };
    }

    let role: string | null = null;
    if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      role = typeof user.roles[0] === 'string' 
        ? user.roles[0] 
        : user.roles[0]?.name || user.roles[0]?.id;
    } else if (user.role) {
      role = typeof user.role === 'string' ? user.role : user.role?.name || user.role?.id;
    }

    if (!role) {
      console.error('Role not found in user data:', user);
      return { success: false, error: 'Role not found in user data' };
    }

    cookieStore.set('role', role, {
      httpOnly: false,
      secure: false,
      path: '/',
    });
    return { success: true, role };
  } catch (error: any) {
    console.error('Login error:', error);
    const message = error?.response != null
      ? new ResponseModel(error).getMessage()
      : (error?.message || 'Login failed');
    return { success: false, error: message };
  }
}

export async function logoutAction(refreshToken: string): Promise<{ success: true; data?: any } | { success: false; error: string }> {
  const cookieStore = await cookies();
  try {
    if (!refreshToken) {
      cookieStore.delete('access_token');
      cookieStore.delete('role');
      return { success: false, error: 'Refresh token is required' };
    }

    const response = await serviceAxios.post(`${apiUrl}/auth/logout`, { refreshToken });
    cookieStore.delete('access_token');
    cookieStore.delete('role');
    cookieStore.delete('refresh_token');
    return { success: true, data: response.data };
  } catch (error: any) {
    const message = error?.message || 'Logout failed';
    return { success: false, error: message };
  }
}

export async function refreshTokenAction(refreshToken: string) {
  const cookieStore = await cookies();
  try {
    const response = await serviceAxios.post(`${apiUrl}/auth/refresh-token`, { refreshToken });
    return response.data;
  } catch (error: any) {
    throw error;
  }
}

export async function naverCallbackAction(accessToken: string, refreshToken: string, user: any): Promise<{ success: true; role: string } | { success: false; error: string }> {
  const cookieStore = await cookies();
  try {
    if (accessToken) {
      cookieStore.set('access_token', accessToken, {
        httpOnly: false,
        secure: false,
        path: '/',
      });
    }

    if (refreshToken) {
      cookieStore.set('refresh_token', refreshToken, {
        httpOnly: false,
        secure: false,
        path: '/',
      });
    }

    if (!user) {
      console.error('User data not found in Naver callback');
      return { success: false, error: 'User data not found in Naver callback' };
    }

    let role: string | null = null;
    if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      role = typeof user.roles[0] === 'string' 
        ? user.roles[0] 
        : user.roles[0]?.name || user.roles[0]?.id;
    } else if (user.role) {
      role = typeof user.role === 'string' ? user.role : user.role?.name || user.role?.id;
    }

    if (!role) {
      console.error('Role not found in user data:', user);
      return { success: false, error: 'Role not found in user data' };
    }

    cookieStore.set('role', role, {
      httpOnly: false,
      secure: false,
      path: '/',
    });
    return { success: true, role };
  } catch (error: any) {
    console.error('Naver callback action error:', error);
    const message = error?.message || 'Naver callback failed';
    return { success: false, error: message };
  }
}

export async function kakaoCallbackAction(accessToken: string, refreshToken: string, user: any): Promise<{ success: true; role: string } | { success: false; error: string }> {
  const cookieStore = await cookies();
  try {
    if (accessToken) {
      cookieStore.set('access_token', accessToken, {
        httpOnly: false,
        secure: false,
        path: '/',
      });
    }

    if (refreshToken) {
      cookieStore.set('refresh_token', refreshToken, {
        httpOnly: false,
        secure: false,
        path: '/',
      });
    }

    if (!user) {
      console.error('User data not found in Kakao callback');
      return { success: false, error: 'User data not found in Kakao callback' };
    }

    let role: string | null = null;
    if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      role = typeof user.roles[0] === 'string' 
        ? user.roles[0] 
        : user.roles[0]?.name || user.roles[0]?.id;
    } else if (user.role) {
      role = typeof user.role === 'string' ? user.role : user.role?.name || user.role?.id;
    }

    if (!role) {
      console.error('Role not found in user data:', user);
      return { success: false, error: 'Role not found in user data' };
    }

    cookieStore.set('role', role, {
      httpOnly: false,
      secure: false,
      path: '/',
    });
    return { success: true, role };
  } catch (error: any) {
    console.error('Kakao callback action error:', error);
    const message = error?.message || 'Kakao callback failed';
    return { success: false, error: message };
  }
}

// Keep old function for backward compatibility
export async function setNaverAuthTokens(accessToken: string, refreshToken: string, user: any) {
  return naverCallbackAction(accessToken, refreshToken, user);
}