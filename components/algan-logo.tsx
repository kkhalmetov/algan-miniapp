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

const wordmarkMask = createMask('/algan-wordmark.svg');

export function AlganMark({ light = false, className = '' }: { light?: boolean; className?: string }) {
  return (
    // The SVG is a tiny immutable brand asset; preserving it as-authored avoids an image optimizer request on splash.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      aria-hidden="true"
      alt=""
      src={light ? '/algan-mark-light.svg?v=3' : '/algan-mark.svg?v=3'}
      className={`inline-block shrink-0 object-contain ${className}`}
    />
  );
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
      className={`flex items-center gap-2 ${light ? 'text-highlight' : 'text-brand'} ${className}`}
      aria-label="Algan"
    >
      <AlganMark light={light} className={markClassName} />
      <AlganWordmark className={wordmarkClassName} />
    </div>
  );
}
