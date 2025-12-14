"use client";

import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import Link from "next/link";
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
  ArrowRightLeft,
  Menu,
  Leaf
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
    <header className="sticky top-0 z-50 w-full border-b border-[#879385]/20 dark:border-[#879385]/10 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">

        {/* Logo Section */}
        <Link href={`/${locale}`} className="flex items-center gap-2 group">
          <Leaf className="text-[#879385] w-8 h-8 group-hover:rotate-12 transition-transform" />
          <span className="font-display font-bold text-3xl text-gray-700 dark:text-gray-100">EcoAnuncios</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-8 items-center">
          <Link href={`/${locale}`} className="text-gray-600 dark:text-gray-300 hover:text-[#879385] font-semibold text-lg font-sans">
            {t('header.home')}
          </Link>
          <Link href={`/${locale}/products`} className="text-gray-600 dark:text-gray-300 hover:text-[#879385] font-semibold text-lg font-sans">
            Anuncios
          </Link>
          <Link href={`/${locale}/producers`} className="text-gray-600 dark:text-gray-300 hover:text-[#879385] font-semibold text-lg font-sans">
            Comunidad
          </Link>

          {/* User Section or Login Button */}
          {!loading && (
            user ? (
              <div className="flex items-center gap-4 ml-4">
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="cursor-pointer hover:opacity-80 transition-opacity border-2 border-[#879385]/20">
                      <AvatarImage src={user.photoURL || undefined} alt={user.email || "User"} />
                      <AvatarFallback className="bg-[#879385] text-white font-hand text-xl pt-1">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-[#FDFBF7] dark:bg-[#3E3B34] border-[#879385]/20">
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/profile`} className="flex items-center cursor-pointer font-sans">
                        <User className="mr-2 h-4 w-4" />
                        <span>{t('header.profile')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/my-garden`} className="flex items-center cursor-pointer font-sans">
                        <Flower2 className="mr-2 h-4 w-4" />
                        <span>{t('header.my_garden')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/exchanges`} className="flex items-center cursor-pointer font-sans">
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        <span>{t('header.my_exchanges')}</span>
                      </Link>
                    </DropdownMenuItem>
                    {/* Publish Option in Menu for Quick Access */}
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/publish`} className="flex items-center cursor-pointer font-sans text-[#879385] font-bold">
                        <Leaf className="mr-2 h-4 w-4" />
                        <span>{t('header.publish')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#879385]/20" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center cursor-pointer text-red-600 focus:text-red-600 font-sans"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t('header.logout')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button asChild className="bg-[#879385] text-white px-6 py-2 rounded-full font-display text-2xl hover:bg-[#7a8578] shadow-md transition-all h-auto pb-1">
                <Link href={`/${locale}/login`}>
                  Login
                </Link>
              </Button>
            )
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-gray-600 dark:text-gray-300">
          <Menu className="w-8 h-8" />
        </button>
      </div>
    </header>
  );
};

export default Header;
