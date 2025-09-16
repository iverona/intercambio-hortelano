import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gray-800">
          Portal de Intercambio Hortelano
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-gray-800">
            Home
          </Link>
          <Link href="/profile" className="text-gray-600 hover:text-gray-800">
            My Profile
          </Link>
          <Button asChild>
            <Link href="/publish">Publish Product</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
