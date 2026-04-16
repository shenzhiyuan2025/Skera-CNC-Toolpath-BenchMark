import React from 'react';
import { Navbar } from './Navbar';
import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="flex min-h-screen bg-[#1E1E1E] text-white">
      <Navbar />
      <main className="flex-1 ml-20 min-h-screen relative overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
