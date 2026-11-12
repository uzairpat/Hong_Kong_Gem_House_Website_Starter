interface BrandMarkProps {
  className?: string;
  width?: number;
  height?: number;
}

export default function BrandMark({
  className,
  width = 80,
  height = 88,
}: BrandMarkProps) {
  return (
    <img
      src="/assets/01-homepage/hkg-logo-emblem.png"
      alt="Hong Kong Gem House emblem"
      className={className}
      width={width}
      height={height}
      style={{
        display: "block",
        width: `${width}px`,
        height: `${height}px`,
        minWidth: `${width}px`,
        maxWidth: `${width}px`,
        objectFit: "contain",
        objectPosition: "center",
        flexShrink: 0,
      }}
    />
  );
}
