"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, PlusCircle, MessageSquare, User } from "lucide-react";
import { useCurrentLocale, useI18n } from "@/locales/provider";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { cn } from "@/lib/utils";

const BottomNavigation = () => {
  const pathname = usePathname();
  const locale = useCurrentLocale();
  const t = useI18n();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const navItems = [
    {
      href: `/${locale}`,
      icon: Home,
      label: t('nav.home'),
      isActive: (path: string) => path === `/${locale}` || path === "/" || !!path.match(/^\/[a-z]{2}$/),
    },
    {
      href: `/${locale}/products`,
      icon: ShoppingBag,
      label: t('nav.products'),
      isActive: (path: string) => path.includes("/products"),
    },
    {
      href: `/${locale}/publish`,
      icon: PlusCircle,
      label: t('nav.publish'),
      isActive: (path: string) => path.includes("/publish"),
      isCenter: true,
    },
    {
      href: `/${locale}/exchanges`,
      icon: MessageSquare,
      label: t('nav.messages'),
      isActive: (path: string) => path.includes("/exchanges"),
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      href: user ? `/${locale}/profile` : `/${locale}/login`,
      icon: User,
      label: t('nav.profile'),
      isActive: (path: string) => path.includes("/profile") || (!user && path.includes("/login")),
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg">
      <div
        className="flex items-center justify-around h-16 px-2"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive(pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[48px] min-h-[48px] rounded-xl transition-all duration-300 flex-1 max-w-[80px] relative",
                item.isCenter && "relative -mt-6",
                !item.isCenter && "px-2"
              )}
            >
              {item.isCenter ? (
                // Center publish button - prominent design
                <div className="relative">
                  <div className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
                    "bg-gradient-to-br from-green-500 to-emerald-600",
                    "hover:from-green-600 hover:to-emerald-700",
                    "active:scale-95",
                    isActive && "ring-4 ring-green-200 dark:ring-green-800"
                  )}>
                    <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                </div>
              ) : (
                // Regular navigation items
                <>
                  <div className={cn(
                    "p-2 rounded-lg transition-all duration-300 relative",
                    isActive && "bg-green-50 dark:bg-green-950/30"
                  )}>
                    <Icon
                      className={cn(
                        "w-6 h-6 transition-colors duration-300",
                        isActive
                          ? "text-green-600 dark:text-green-400"
                          : "text-gray-600 dark:text-gray-400"
                      )}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {/* Notification badge */}
                    {item.badge && (
                      <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {item.badge > 99 ? '99+' : item.badge}
                      </div>
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium transition-colors duration-300",
                    isActive
                      ? "text-green-600 dark:text-green-400"
                      : "text-gray-600 dark:text-gray-400"
                  )}>
                    {item.label}
                  </span>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
