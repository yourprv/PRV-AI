interface BrandMarkProps {
  size?: 'sm' | 'md';
}

export function BrandMark({ size = 'md' }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={`brand-mark ${size === 'sm' ? 'h-6 w-6 rounded-[7px] text-[13px]' : 'h-8 w-8'}`}
    >
      p
    </span>
  );
}
