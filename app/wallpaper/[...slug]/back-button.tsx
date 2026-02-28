"use client";

import { useRouter } from "next/navigation";

export function BackButton({ fallbackHref }: { fallbackHref: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      className="back-link back-link-button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }
        router.push(fallbackHref);
      }}
    >
      Back to gallery
    </button>
  );
}
