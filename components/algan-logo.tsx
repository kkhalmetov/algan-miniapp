import type { CSSProperties } from 'react';

const markMask: CSSProperties = {
  WebkitMaskImage: "url('/algan-mark.svg')",
  maskImage: "url('/algan-mark.svg')",
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
};

export function AlganMark({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`inline-block shrink-0 bg-current ${className}`} style={markMask} />;
}

export function AlganLogo({
  light = false,
  className = '',
  markClassName = 'h-9 w-9',
  wordmarkClassName = 'text-lg',
}: {
  light?: boolean;
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 font-black tracking-[-0.04em] ${light ? 'text-white' : 'text-[#173c31]'} ${className}`}
      aria-label="Algan"
    >
      <AlganMark className={`${markClassName} ${light ? 'text-[#d9ed9a]' : 'text-[#1f5c49]'}`} />
      <span className={wordmarkClassName}>algan</span>
    </div>
  );
}
