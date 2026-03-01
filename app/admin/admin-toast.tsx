"use client";

import { useEffect, useState } from "react";

export function AdminToast({ success, error }: { success?: string; error?: string }) {
  const message = success ? `Success: ${success}` : error ? `Error: ${error}` : "";
  const tone = success ? "success" : error ? "error" : "none";
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    if (!message) {
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message || !visible) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-semibold shadow-card ${
        tone === "success" ? "bg-emerald-500/90 text-white" : "bg-red-500/90 text-white"
      }`}
    >
      {message}
    </div>
  );
}
