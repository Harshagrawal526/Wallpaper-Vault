"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BossCabinButton() {
  const router = useRouter();
  const [opening, setOpening] = useState(false);

  return (
    <button
      type="button"
      className="inline-block rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-textMain transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={opening}
      onClick={() => {
        setOpening(true);
        router.push("/admin/login");
      }}
    >
      {opening ? "Opening Boss Cabin..." : "Boss Cabin"}
    </button>
  );
}
