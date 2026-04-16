import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-6xl font-bold text-gray-700 mb-4">404</h1>
      <p className="text-xl text-gray-400 mb-8">Page not found</p>
      <Link to="/" className="text-blue-500 hover:text-blue-400">Go back home</Link>
    </div>
  );
}
