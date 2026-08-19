/**
 * NatGas Uganda Limited – Logo component
 * Uses the official naticon.jpeg image.
 */

interface LogoProps {
  /** Height of the logo image */
  height?: number;
  /** Show text wordmark beside the image */
  showText?: boolean;
  /** Light theme makes wordmark white (for dark backgrounds) */
  theme?: 'dark' | 'light';
  className?: string;
}

export default function NatGasLogo({
  height = 44,
  showText = true,
  theme = 'dark',
  className = '',
}: LogoProps) {
  const nameColor = theme === 'light' ? '#ffffff' : '#3a3a3a';
  const subColor  = theme === 'light' ? '#a8e0a8' : '#2e8b2e';

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: height * 0.22,
        textDecoration: 'none',
        flexShrink: 0,
      }}
    >
      {/* Official logo image */}
      <img
        src="/naticon.jpeg"
        alt="Natgas Uganda Limited logo"
        style={{
          height: height,
          width: 'auto',
          display: 'block',
          flexShrink: 0,
          objectFit: 'contain',
        }}
        loading="eager"
      />

      {/* Optional wordmark */}
      {showText && (
        <div style={{ lineHeight: 1.15, userSelect: 'none' }}>
          <div style={{
            fontSize: height * 0.4,
            fontWeight: 800,
            letterSpacing: '-0.5px',
            color: nameColor,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            NATGAS
          </div>
          <div style={{
            fontSize: height * 0.16,
            fontWeight: 700,
            letterSpacing: '1.6px',
            color: subColor,
            textTransform: 'uppercase' as const,
            marginTop: 2,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            UGANDA LIMITED
          </div>
        </div>
      )}
    </div>
  );
}

/** Icon-only mark — just the image, no text */
export function NatGasIcon({ size = 32 }: { size?: number }) {
  return (
    <img
      src="/naticon.jpeg"
      alt="Natgas Uganda"
      style={{ height: size, width: 'auto', display: 'block', objectFit: 'contain' }}
    />
  );
}
