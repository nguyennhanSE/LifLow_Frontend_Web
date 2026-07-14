'use server'

import { cookies } from 'next/headers';
import { createAxiosService } from './axios.factory';

export const getCookie = async (name: string): Promise<string | null> => {
  const cookieStore = await cookies();
  return cookieStore.get(name)?.value ?? null;
};

export const serviceAxios = createAxiosService(getCookie);
