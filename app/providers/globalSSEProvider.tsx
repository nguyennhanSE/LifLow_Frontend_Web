// providers/GlobalSSEProvider.tsx
'use client';

import { toast } from "@/components/ui/use-toast";
import { useSSE } from "@/hooks/use-SSE/SSE.hook";
import { createContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

export interface RecipeNotification {
  type: 'RECIPE_APPROVED' | 'RECIPE_REJECTED';
  title: string;
  message: string;
  recipeId?: string;
}

export interface NotificationContextValue {
  notifications: RecipeNotification[];
  status: 'idle' | 'connecting' | 'connected' | 'error' | 'closed';
}
    
export const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  status: 'idle',
});

export function GlobalSSEProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<RecipeNotification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // get userId
    const accessToken = Cookies.get('access_token') || '';
    if (!accessToken) return;

    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const userId = payload.sub;
    if (!userId) return;
    setUserId(userId);
  }), [];

  const { status } = useSSE<RecipeNotification>({
    userId: userId ?? '',
    enabled: !!userId,            // ← chỉ mở khi đã đăng nhập
    onMessage: (data) => {
      setNotifications(prev => [data, ...prev]);

      // Hiện toast ngay lập tức dù đang ở trang nào
    //   toast({
    //     title: data.title,
    //     description: data.message,
    //   });
    },
  });

  return (
    <NotificationContext.Provider value={{ notifications, status }}>
      {children}
    </NotificationContext.Provider>
  );
}