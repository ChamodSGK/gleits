// Inline stroke icons. Decorative by default (aria-hidden).
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  viewBox: "0 0 24 24",
};

const make = (paths) =>
  function Icon({ size = 18, strokeWidth = 2, className, ...rest }) {
    return (
      <svg width={size} height={size} strokeWidth={strokeWidth} className={className} {...base} {...rest}>
        {paths}
      </svg>
    );
  };

export const ArrowUpRight = make(<path d="M7 17 17 7M8 7h9v9" />);
export const ArrowRight = make(<path d="M5 12h14M13 6l6 6-6 6" />);
export const ArrowLeft = make(<path d="M19 12H5M11 18l-6-6 6-6" />);
export const Check = make(<path d="m5 12 5 5L20 7" />);
export const Code = make(<path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />);
export const Shield = make(
  <>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </>,
);
export const Heart = make(
  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z" />,
);
export const Phone = make(
  <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />,
);
export const Mail = make(
  <>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </>,
);
export const Pin = make(
  <>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="3" />
  </>,
);
export const Globe = make(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
  </>,
);
export const Menu = make(<path d="M4 8h16M4 16h16" />);
export const Close = make(<path d="M6 6l12 12M18 6 6 18" />);

/** The logo's i→t swash, repeated as thin waves. Used in page heroes and the CTA. */
export function Waves({ className, color = "#2E95E6" }) {
  return (
    <svg className={className} viewBox="0 0 800 400" fill="none" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 330 C 160 330 230 190 380 190 S 600 300 820 60" stroke={color} strokeWidth="2" />
      <path d="M0 360 C 170 360 240 230 390 232 S 610 340 820 110" stroke={color} strokeWidth="1" opacity=".6" />
      <path d="M0 300 C 150 300 220 150 370 150 S 590 260 820 10" stroke={color} strokeWidth="1" opacity=".5" />
    </svg>
  );
}
