
"use client";
import Link from "next/link";
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-8xl mb-4">🍪</div>
        <h1 className="text-4xl font-black text-white mb-2">404</h1>
        <p className="text-slate-400 mb-6">Page not found</p>
        <Link href="/" className="btn-primary px-6 py-3 inline-block">Go Home</Link>
      </div>
    </div>
  );
}
