export function AdaptedLogo({ className = "", size = 120 }: { className?: string; size?: number }) {
  return (
    <div className={`relative ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm"
      >
        {/* Main circle background with gradient matching the design system */}
        <circle cx="256" cy="256" r="240" fill="url(#mainGradient)" className="drop-shadow-lg" />

        {/* Connecting lines and nodes in primary color */}
        <g stroke="oklch(0.205 0 0)" strokeWidth="2" fill="oklch(0.205 0 0)">
          {/* Outer connection points */}
          <circle cx="84" cy="150" r="6" />
          <circle cx="30" cy="210" r="4" />
          <circle cx="24" cy="300" r="4" />
          <circle cx="84" cy="362" r="6" />
          <circle cx="428" cy="150" r="6" />
          <circle cx="482" cy="210" r="4" />
          <circle cx="488" cy="300" r="4" />
          <circle cx="428" cy="362" r="6" />

          {/* Connection lines */}
          <line x1="84" y1="150" x2="140" y2="180" />
          <line x1="30" y1="210" x2="80" y2="220" />
          <line x1="24" y1="300" x2="80" y2="290" />
          <line x1="84" y1="362" x2="140" y2="332" />
          <line x1="428" y1="150" x2="372" y2="180" />
          <line x1="482" y1="210" x2="432" y2="220" />
          <line x1="488" y1="300" x2="432" y2="290" />
          <line x1="428" y1="362" x2="372" y2="332" />
        </g>

        {/* Inner tech circles and connections */}
        <g stroke="oklch(0.556 0 0)" strokeWidth="1.5" fill="none" opacity="0.8">
          <circle cx="256" cy="256" r="180" />
          <circle cx="256" cy="256" r="140" />
          <circle cx="256" cy="256" r="100" />

          {/* Inner connection nodes */}
          <circle cx="204" cy="104" r="3" fill="oklch(0.556 0 0)" />
          <circle cx="276" cy="124" r="3" fill="oklch(0.556 0 0)" />
          <circle cx="372" cy="150" r="3" fill="oklch(0.556 0 0)" />
          <circle cx="144" cy="172" r="3" fill="oklch(0.556 0 0)" />
          <circle cx="320" cy="192" r="3" fill="oklch(0.556 0 0)" />
          <circle cx="168" cy="380" r="3" fill="oklch(0.556 0 0)" />
          <circle cx="314" cy="400" r="3" fill="oklch(0.556 0 0)" />
        </g>

        {/* X3 Text */}
        <text
          x="180"
          y="280"
          fontSize="84"
          fontWeight="bold"
          fill="oklch(0.985 0 0)"
          fontFamily="Inter, sans-serif"
          className="select-none"
        >
          X3
        </text>

        {/* AI Circle */}
        <g>
          <circle cx="360" cy="256" r="40" fill="none" stroke="oklch(0.985 0 0)" strokeWidth="3" />
          <circle cx="360" cy="256" r="32" fill="none" stroke="oklch(0.985 0 0)" strokeWidth="2" opacity="0.6" />
          <text
            x="360"
            y="264"
            fontSize="20"
            fontWeight="600"
            fill="oklch(0.985 0 0)"
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            className="select-none"
          >
            AI
          </text>
        </g>

        {/* Gradient definitions */}
        <defs>
          <radialGradient id="mainGradient" cx="0.3" cy="0.3" r="0.8">
            <stop offset="0%" stopColor="oklch(0.556 0 0)" />
            <stop offset="50%" stopColor="oklch(0.205 0 0)" />
            <stop offset="100%" stopColor="oklch(0.145 0 0)" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  )
}
