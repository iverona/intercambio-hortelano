"use client";

import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  User, 
  LogOut, 
  Search, 
  Flower2, 
  ArrowRightLeft 
} from "lucide-react";
import Filter from "./Filter";
import { useFilters } from "@/context/FilterContext";
import { Input } from "@/components/ui/input";
import NotificationBell from "./NotificationBell";
import { useCurrentLocale, useI18n } from "@/locales/provider";

const Header = () => {
  const t = useI18n();
  const locale = useCurrentLocale();
  const { user, loading } = useAuth();
  const router = useRouter();
  const { filters, setFilters } = useFilters();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.email) return "U";
    const email = user.email;
    const name = email.split("@")[0];
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto px-4 py-3 md:py-4 flex justify-between items-center gap-2 md:gap-4">
        {/* Logo - hidden on mobile */}
        <Link href={`/${locale}`} className="hidden md:block text-2xl font-bold text-gray-800">
          <Image
            src="/header-logo.png"
            alt="Logo"
            width={52}
            height={40}
            priority
          />
        </Link>
        <nav className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
          {/* Search bar - full width on mobile */}
          <div className="relative flex-1 md:flex-initial">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('header.search_placeholder')}
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
              value={filters.searchTerm}
              onChange={(e) =>
                setFilters({ ...filters, searchTerm: e.target.value })
              }
            />
          </div>
          {/* Filter button - hidden on mobile */}
          <div className="hidden md:block">
            <Filter onFilterChange={setFilters} />
          </div>
          {/* Home link - hidden on mobile */}
          <Link href={`/${locale}`} className="hidden md:block text-gray-600 hover:text-gray-800">
            {t('header.home')}
          </Link>
          {/* Publish button - hidden on mobile */}
          {user && (
            <Button asChild className="hidden md:inline-flex">
              <Link href={`/${locale}/publish`}>{t('header.publish')}</Link>
            </Button>
          )}
          {/* Notification bell and user menu - hidden on mobile */}
          {!loading &&
            (user ? (
              <div className="hidden md:flex items-center gap-4">
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
                      <AvatarImage src={user.photoURL || undefined} alt={user.email || "User"} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/profile`} className="flex items-center cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>{t('header.profile')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/my-garden`} className="flex items-center cursor-pointer">
                        <Flower2 className="mr-2 h-4 w-4" />
                        <span>{t('header.my_garden')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/exchanges`} className="flex items-center cursor-pointer">
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        <span>{t('header.my_exchanges')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="flex items-center cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t('header.logout')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button asChild className="hidden md:inline-flex">
                <Link href={`/${locale}/login`}>{t('header.login')}</Link>
              </Button>
            ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
