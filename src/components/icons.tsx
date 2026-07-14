type IconProps = { size?: number }

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function HangerIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="12" cy="5" r="1.6" />
      <path d="M12 6.6v2" />
      <path d="M12 8.6 3 15.5c-1 .8-.4 2.5.9 2.5h16.2c1.3 0 1.9-1.7.9-2.5z" />
      <path d="M5 18.7h14" />
    </svg>
  )
}

export function MirrorIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M7 3.5h10a1 1 0 0 1 1 1v11a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5v-11a1 1 0 0 1 1-1Z" />
      <path d="M8.5 6.5 15 15" />
      <path d="M10.5 20.5h3" />
    </svg>
  )
}

export function FrameIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="4" y="5" width="13" height="13" rx="1.5" />
      <path d="M7.5 14.5 10 11l2.2 2.6L14 11.5l2.5 3" />
      <circle cx="8.3" cy="8.3" r="1" />
      <path d="M19.5 8v9a1.5 1.5 0 0 1-1.5 1.5H8" />
    </svg>
  )
}

export function SuitcaseIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M9 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v1.5" />
      <rect x="3.5" y="6.5" width="17" height="13" rx="2" />
      <path d="M3.5 12h17" />
      <path d="M10.5 12v1.4" />
      <path d="M13.5 12v1.4" />
    </svg>
  )
}
