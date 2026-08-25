import type { CSSProperties } from 'react';

const createMask = (url: string): CSSProperties => ({
  WebkitMaskImage: `url('${url}')`,
  maskImage: `url('${url}')`,
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
});

const markMask = createMask('/algan-mark.svg?v=2');
const wordmarkMask = createMask('/algan-wordmark.svg');

export function AlganMark({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`inline-block shrink-0 bg-current ${className}`} style={markMask} />;
}

export function AlganWordmark({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`inline-block shrink-0 bg-current ${className}`} style={wordmarkMask} />;
}

export function AlganLogo({
  light = false,
  className = '',
  markClassName = 'h-9 w-9',
  wordmarkClassName = 'h-6 w-[73px]',
}: {
  light?: boolean;
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 ${light ? 'text-[#d9ed9a]' : 'text-[#1f5c49]'} ${className}`}
      aria-label="Algan"
    >
      <AlganMark className={markClassName} />
      <AlganWordmark className={wordmarkClassName} />
    </div>
  );
}
