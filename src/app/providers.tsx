
"use client";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#13132a", color: "#e2e8f0", border: "1px solid rgba(139,92,246,0.3)" },
          success: { style: { border: "1px solid rgba(16,185,129,0.5)" } },
          error: { style: { border: "1px solid rgba(239,68,68,0.5)" } },
        }}
      />
    </SessionProvider>
  );
}
