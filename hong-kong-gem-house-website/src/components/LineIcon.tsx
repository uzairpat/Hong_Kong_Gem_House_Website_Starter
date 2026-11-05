export type LineIconName = 'diamond' | 'globe' | 'handshake' | 'certificate' | 'microscope' | 'leaf' | 'shield' | 'location' | 'building' | 'mail' | 'phone' | 'truck' | 'users' | 'chart';
interface LineIconProps { name: LineIconName; className?: string; }
export default function LineIcon({ name, className }: LineIconProps) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.55, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return <svg className={className} viewBox="0 0 72 72" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" {...common}>
    <circle cx="36" cy="36" r="31" />
    {name === 'diamond' && <g><path d="M18 28l8-11h20l8 11-18 25-18-25z"/><path d="M18 28h36M26 17l10 36 10-36M26 17l-2 11M46 17l2 11M24 28l12 25 12-25"/></g>}
    {name === 'globe' && <g><circle cx="36" cy="36" r="21"/><ellipse cx="36" cy="36" rx="10" ry="21"/><path d="M16 29h40M16 43h40M36 15v42"/></g>}
    {name === 'handshake' && <g><path d="M15 29l10-7 10 7 7-3 14 9-6 8-9-5-5 6-6-3-5 2-8-7z"/><path d="M25 22l-7-4-7 11 8 6M42 26l7-5 11 10-6 8M28 44l5 4a4 4 0 006-1l3-3M24 40l5 5a4 4 0 006-1M20 36l5 5"/></g>}
    {name === 'certificate' && <g><path d="M23 15h22l8 8v23H23z"/><path d="M45 15v9h8M29 31h18M29 37h15M29 43h11"/><circle cx="47" cy="50" r="7"/><path d="M43 56l-1 9 5-3 5 3-1-9"/></g>}
    {name === 'microscope' && <g><path d="M30 17l10 5-8 16-10-5zM36 24l8 4M26 37l11 6M41 29l8 4M44 35a11 11 0 00-8 10M29 49h27M23 56h34M41 45h9"/><path d="M31 56v-4"/></g>}
    {name === 'leaf' && <g><path d="M52 17C30 18 19 28 20 44c1 10 10 13 18 8 9-6 12-19 14-35z"/><path d="M19 56c8-14 16-22 27-31"/></g>}
    {name === 'shield' && <g><path d="M36 14l19 7v14c0 12-8 19-19 24-11-5-19-12-19-24V21z"/><path d="M27 36l6 6 14-15"/></g>}
    {name === 'location' && <g><path d="M36 57s-17-19-17-31a17 17 0 0134 0c0 12-17 31-17 31z"/><circle cx="36" cy="26" r="6"/></g>}
    {name === 'building' && <g><path d="M20 57V31l16-12 16 12v26zM27 57V38h18v19M29 31h2M41 31h2M27 45h4M41 45h4M34 57V47h4v10"/></g>}
    {name === 'mail' && <g><rect x="16" y="23" width="40" height="27" rx="1"/><path d="M17 25l19 15 19-15"/></g>}
    {name === 'phone' && <path d="M25 18l9 11-6 7c4 7 8 11 15 15l7-6 10 9-5 7c-3 4-10 2-17-2-10-6-21-17-26-28-3-7-4-13 1-16z"/>}
    {name === 'truck' && <g><path d="M13 24h31v25H13zM44 33h10l8 9v7H44z"/><circle cx="24" cy="52" r="5"/><circle cx="52" cy="52" r="5"/></g>}
    {name === 'users' && <g><circle cx="28" cy="27" r="7"/><circle cx="46" cy="27" r="7"/><path d="M15 50c0-9 5-14 13-14s13 5 13 14M35 50c0-9 4-14 11-14s11 5 11 14"/></g>}
    {name === 'chart' && <g><path d="M16 56h41M20 56V38h8v18M34 56V29h8v27M48 56V19h8v37"/></g>}
  </svg>;
}
