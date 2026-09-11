import type { SVGProps } from 'react';

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & { size?: number };

/** Algan's 24 px icon grid: soft corners, open counters, optional ink wash. */
function icon(name: string, path: string, wash?: string) {
  return function AlganIcon({ size = 24, strokeWidth = 1.8, fill = 'none', ...props }: IconProps) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" data-icon={name} {...props}>
      {wash && <path d={wash} fill="currentColor" stroke="none" opacity=".12" />}
      <path d={path} fill={fill} />
    </svg>;
  };
}

export const ArrowLeft = icon('arrow-left', 'M20 12H4m7-7-7 7 7 7');
export const ArrowUpRight = icon('arrow-up-right', 'M6 18 18 6M6 6h12v12');
export const ChevronDown = icon('chevron-down', 'm6 9 6 6 6-6');
export const ChevronRight = icon('chevron-right', 'm9 6 6 6-6 6');
export const Check = icon('check', 'm5 12 4.5 4.5L19 7');
export const X = icon('close', 'm6 6 12 12M18 6 6 18');
export const Plus = icon('plus', 'M5 12h14M12 5v14');
export const Minus = icon('minus', 'M5 12h14');
export const Search = icon('search', 'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm-2 5 6 6');
export const LoaderCircle = icon('loading', 'M21 12a9 9 0 1 1-9-9');
export const Heart = icon('heart', 'M12 20S3 14.6 3 8.7C3 3.5 9 2.5 12 7c3-4.5 9-3.5 9 1.7C21 14.6 12 20 12 20Z', 'M12 20S3 14.6 3 8.7C3 3.5 9 2.5 12 7c3-4.5 9-3.5 9 1.7C21 14.6 12 20 12 20Z');
export const Home = icon('home', 'm3 10 9-7 9 7M5 9v11h5v-6h4v6h5V9', 'm5 9 7-5 7 5v11h-5v-6h-4v6H5Z');
export const ShoppingBag = icon('shopping-bag', 'M5 8h14l1 12H4L5 8Zm3 0V6a4 4 0 0 1 8 0v2M9 13c0 4 6 4 6 0', 'M5 8h14l1 12H4Z');
export const UserRound = icon('user', 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2c0-8 16-8 16 0v2', 'M4 21v-2c0-8 16-8 16 0v2Z');
export const Package = icon('box', 'm3 7 9-4 9 4v11l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v11M7 5l10 4v4', 'm3 7 9 4 9-4v11l-9 4-9-4Z');
export const PackageCheck = icon('box-check', 'm3 7 9-4 9 4M3 7l9 4 9-4M3 7v11l9 4V11m4 6 2 2 4-4', 'm3 7 9 4v11l-9-4Z');
export const MapPin = icon('map-pin', 'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Zm-4 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z', 'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z');
export const Clock3 = icon('clock', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l4 2', 'M12 3v9l7.8 4.5A9 9 0 0 0 12 3Z');
export const CalendarDays = icon('calendar', 'M4 5h16v16H4V5Zm4-3v6m8-6v6M4 10h16M8 14h1m6 0h1m-8 4h1m6 0h1', 'M4 5h16v5H4Z');
export const Star = icon('star', 'm12 3 2.8 5.6 6.2.9-4.5 4.4 1.1 6.1-5.6-2.9L6.4 20l1.1-6.1L3 9.5l6.2-.9L12 3Z');
export const Sparkles = icon('sparkles', 'm14 3 2.3 6.7L23 12l-6.7 2.3L14 21l-2.3-6.7L5 12l6.7-2.3L14 3ZM4 2v5M1.5 4.5h5M4 17v5m-2.5-2.5h5');
export const LayoutGrid = icon('grid', 'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z', 'M3 3h7v7H3Zm11 11h7v7h-7Z');
export const Coffee = icon('coffee', 'M3 8h13v7c0 7-13 7-13 0V8Zm13 1h2c5 0 5 7-2 7M6 3v2m6-2v2M2 22h17', 'M3 8h13v7c0 7-13 7-13 0Z');
export const Croissant = icon('croissant', 'M8 5c3-2 5-2 8 0l2 9c-4 3-8 3-12 0l2-9Zm0 1L4 8l-1 7 3 2 2-2m8-9 4 2 1 7-3 2-2-2M4 16l-2 5 6-2m12-3 2 5-6-2', 'M8 5c3-2 5-2 8 0l2 9c-4 3-8 3-12 0Z');
export const Cookie = icon('cookie', 'M21 13a9 9 0 1 1-10-10c-1 4 1 6 4 6 0 3 3 5 6 4ZM8 9h.1M7 15h.1M13 17h.1M12 12h.1', 'M21 13a9 9 0 1 1-10-10c-1 4 1 6 4 6 0 3 3 5 6 4Z');
export const Leaf = icon('leaf', 'M20 3C7 2 1 9 5 16c8 8 17 0 15-13ZM3 21 16 8', 'M20 3C7 2 1 9 5 16c8 8 17 0 15-13Z');
export const SlidersHorizontal = icon('filters', 'M3 7h5m4 0h9M3 17h9m4 0h5M8 4v6m4-6v6m0-3H8m4 7v6m4-6v6m-4-3h4');
export const Settings2 = icon('settings', 'M3 7h5m4 0h9M3 17h9m4 0h5M12 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z');
export const CircleDollarSign = icon('currency', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM15 8h-4c-4 0-4 4 0 4h2c4 0 4 4 0 4H9m3-10v12', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z');
export const CircleHelp = icon('help', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9 8.5c0-3 6-3 6 0 0 2.5-3 2-3 5M12 17h.01', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z');
export const Info = icon('info', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 11v6m0-10h.01', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z');
export const CheckCircle2 = icon('success', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-14 0 3.5 3.5L17 9', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z');
export const XCircle = icon('cancelled', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-12-3 6 6m0-6-6 6', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z');
export const AlertTriangle = icon('warning', 'm12 3 10 18H2L12 3Zm0 6v5m0 3h.01', 'm12 3 10 18H2Z');
export const FileText = icon('document', 'M5 2h9l5 5v15H5V2Zm9 0v6h5M9 12h6m-6 4h6', 'M14 2v6h5Z');
export const FileCheck2 = icon('consent', 'M5 2h9l5 5v15H5V2Zm9 0v6h5M8 15l3 3 5-6', 'M14 2v6h5Z');
export const ReceiptText = icon('receipt', 'M5 2 8 4l4-2 4 2 3-2v20l-3-2-4 2-4-2-3 2V2Zm4 7h6m-6 4h6m-6 4h3', 'M5 2 8 4l4-2 4 2 3-2v20l-3-2-4 2-4-2-3 2Z');
export const ShieldCheck = icon('shield', 'm12 2 8 3v7c0 5-8 10-8 10S4 17 4 12V5l8-3Zm-4 9 3 3 5-5', 'm12 2 8 3v7c0 5-8 10-8 10S4 17 4 12V5Z');
export const Languages = icon('languages', 'M2 5h12M8 2v3m3 0c0 6-4 9-9 11m3-9c1 4 4 7 8 9m0 5 5-12 5 12m-8-4h6');
export const Phone = icon('phone', 'm5 3 4 4-2 3c1 3 4 6 7 7l3-2 4 4c-2 7-12 0-15-3C3 13-4 3 5 3Z');
export const Mail = icon('mail', 'M3 5h18v14H3V5Zm0 1 9 7 9-7', 'm3 6 9 7 9-7v13H3Z');
export const Headphones = icon('headphones', 'M3 14V11c0-12 18-12 18 0v3M3 12h4v8H3v-8Zm14 0h4v8h-4v-8Zm4 8c0 3-7 3-7 3', 'M3 12h4v8H3Zm14 0h4v8h-4Z');
export const Building2 = icon('building', 'M4 22V3h11v19M15 9h5v13M2 22h20M8 7h3m-3 4h3m-3 4h3m-2 7v-4', 'M4 3h11v19H4Z');
export const RotateCcw = icon('reset', 'M4 8a9 9 0 1 1-1 8M3 3v6h6');
export const FlaskConical = icon('demo', 'M8 2h8m-6 0v8l-6 9c-1 2 0 3 2 3h12c2 0 3-1 2-3l-6-9V2M7 16h10', 'm7 16-3 3c-1 2 0 3 2 3h12c2 0 3-1 2-3l-3-3Z');
export const Image = icon('image', 'M3 3h18v18H3V3Zm0 14 5-6 5 5 3-3 5 5M17 7h.01', 'm3 17 5-6 5 5 3-3 5 5v3H3Z');
