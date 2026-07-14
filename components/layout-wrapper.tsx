'use client'

import { usePathname, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNav } from "@/components/bottom-nav"
import { PwaInstallPrompt } from "@/components/pwa-install-prompt"
import { useContext, useEffect, useState } from "react"
import { NotificationContext, NotificationContextValue, RecipeNotification } from "@/app/providers/globalSSEProvider"
import { CheckCircle, ChefHat, X, XCircle } from "lucide-react"
import { useTranslation } from 'react-i18next'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.includes('/admin') || false
  const isSignRoute = pathname?.includes('/sign') || false
  const isFindRoute = pathname?.includes('/find') || false
  const isFindPasswordRoute = pathname?.includes('/find-password') || false
  const showChrome = !isAdminRoute && !isSignRoute && !isFindRoute && !isFindPasswordRoute

  return (
    <>
      {showChrome && <Header />}
      <main className={`min-w-0 overflow-x-hidden ${showChrome ? 'md:pb-0 pb-16' : ''}`}>
        {children}
      </main>

      {showChrome && <Footer />}
      {showChrome && <BottomNav />}
      {showChrome && <PwaInstallPrompt />}

      <RecipeNotificationModal />
    </>
  )
}


function RecipeNotificationModal() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const { notifications, status } = useContext(NotificationContext) as NotificationContextValue;
  const [currentNotif, setCurrentNotif] = useState<RecipeNotification | null>(null)
  const isAdminRoute = pathname?.includes('/admin') || false
  const isRecipePage = pathname === '/my-page/recipe'

  // Hiện modal khi có notification mới
  useEffect(() => {
    if (notifications.length === 0 || isAdminRoute) return;
    setCurrentNotif(notifications[0]); // notification mới nhất
  }, [notifications, isAdminRoute]);

  if (!currentNotif) return null;

  const isApproved = currentNotif.type === 'RECIPE_APPROVED';

  const handleStayHere = () => setCurrentNotif(null);

  const handleGoToRecipe = () => {
    setCurrentNotif(null);
    router.push('/my-page/recipe');
  };

  const handleReload = () => {
    setCurrentNotif(null);
    window.location.reload();
  };

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay mờ */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleStayHere}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header strip màu theo loại notification */}
        <div className={`h-1.5 w-full ${isApproved ? 'bg-green-500' : 'bg-red-400'}`} />

        {/* Nút đóng */}
        <button
          onClick={handleStayHere}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="px-8 py-8">
          {/* Icon */}
          <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full
            ${isApproved ? 'bg-green-100' : 'bg-red-100'}`}
          >
            {isApproved
              ? <CheckCircle className="text-green-500" size={32} />
              : <XCircle className="text-red-400" size={32} />
            }
          </div>

          {/* Text */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ChefHat size={16} className="text-gray-400" />
              <span className="text-xs font-medium uppercase tracking-widest text-gray-400">
                {t('recipeUpdate', 'Recipe Update')}
              </span>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {currentNotif.title}
            </h2>

            <p className="text-gray-500 text-sm leading-relaxed">
              {currentNotif.message}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            {isRecipePage ? (
              // Đang ở /my-page/recipe → chỉ 1 nút reload
              <button
                onClick={handleReload}
                className={`w-full rounded-xl py-3 px-4 font-semibold text-white transition-all
                  active:scale-95 ${isApproved
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-400 hover:bg-red-500'
                  }`}
              >
                {t('refreshPage', 'Refresh Page')}
              </button>
            ) : (
              <>
                {/* Go to recipe page */}
                <button
                  onClick={handleGoToRecipe}
                  className={`w-full rounded-xl py-3 px-4 font-semibold text-white transition-all
                    active:scale-95 ${isApproved
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-400 hover:bg-red-500'
                    }`}
                >
                  {t('goToRecipePage', 'Go to Recipe Page')}
                </button>

                {/* Stay here */}
                <button
                  onClick={handleStayHere}
                  className="w-full rounded-xl py-3 px-4 font-semibold text-gray-500
                    bg-gray-100 hover:bg-gray-200 transition-all active:scale-95"
                >
                  {t('stayHere', 'Stay Here')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}