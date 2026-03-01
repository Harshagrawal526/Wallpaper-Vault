"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  idleText,
  pendingText,
  className
}: {
  idleText: string;
  pendingText: string;
  className: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingText : idleText}
    </button>
  );
}
