import React from 'react';
import { Leaf } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AuthLayout({ children, title }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-center mb-8">
          <Leaf className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-semibold text-center text-gray-800 mb-8">{title}</h1>
        {children}
      </div>
    </div>
  );
}