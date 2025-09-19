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
  ArrowRightLeft 
} from "lucide-react";
import Filter from "./Filter";
import { useFilters } from "@/context/FilterContext";
import { Input } from "@/components/ui/input";
import NotificationBell from "./NotificationBell";

const Header = () => {
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
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gray-800">
          Portal de Intercambio Hortelano
        </Link>
        <nav className="flex items-center gap-4">
          <div className="relative flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for tomatoes, honey..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
              value={filters.searchTerm}
              onChange={(e) =>
                setFilters({ ...filters, searchTerm: e.target.value })
              }
            />
          </div>
          <Filter onFilterChange={setFilters} />
          <Link href="/" className="text-gray-600 hover:text-gray-800">
            Home
          </Link>
          {user && (
            <Button asChild>
              <Link href="/publish">Publish Product</Link>
            </Button>
          )}
          {!loading &&
            (user ? (
              <>
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
                      <Link href="/profile" className="flex items-center cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/my-garden" className="flex items-center cursor-pointer">
                        <Flower2 className="mr-2 h-4 w-4" />
                        <span>My Garden</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/exchanges" className="flex items-center cursor-pointer">
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        <span>My Exchanges</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="flex items-center cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild>
                <Link href="/login">Login</Link>
              </Button>
            ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
