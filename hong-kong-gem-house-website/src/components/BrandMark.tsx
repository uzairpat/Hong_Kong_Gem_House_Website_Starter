
interface BrandMarkProps {
  className?: string;
}

export default function BrandMark({ className }: BrandMarkProps) {
  return (
    <img
      src="/assets/01-homepage/hkg-logo-emblem.png"
      alt="Hong Kong Gem House emblem"
      className={className}
      width={80}
      height={88}
      style={{
        display: "block",
        width: "80px",
        height: "88px",
        minWidth: "80px",
        maxWidth: "80px",
        objectFit: "contain",
        objectPosition: "center",
        flexShrink: 0,
      }}
    />
  );
}
