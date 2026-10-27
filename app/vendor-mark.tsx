"use client";

export function VendorMark({ className = "h-[52px] w-[52px]", selected = false }: { className?: string; selected?: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className={`${className} overflow-visible drop-shadow-[0_3px_4px_rgba(0,0,0,0.7)]`} aria-hidden>
      <circle cx="24" cy="24" r="13.2" fill="#fff6ea" stroke="#ff5c00" strokeWidth="3.4" />
      <circle cx="24" cy="24" r="13.2" fill="none" stroke="#fff" strokeWidth={selected ? 2.3 : 1.3} />
      <circle cx="19.3" cy="22.6" r="1.85" fill="#2a1c12" />
      <circle cx="28.7" cy="22.6" r="1.85" fill="#2a1c12" />
      <circle cx="19.9" cy="22" r="0.5" fill="#fff" />
      <circle cx="29.3" cy="22" r="0.5" fill="#fff" />
      <path d="M19 27.2c1.4 2 3.1 3 5 3s3.6-1 5-3" fill="none" stroke="#2a1c12" strokeWidth="1.65" strokeLinecap="round" />
    </svg>
  );
}
