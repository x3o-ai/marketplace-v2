import type React from "react"

interface YourWorkInSyncProps {
  /** Fixed width from Figma: 482px */
  width?: number | string
  /** Fixed height from Figma: 300px */
  height?: number | string
  /** Optional className to pass to root */
  className?: string
  /** Theme palette */
  theme?: "light" | "dark"
}

/**
 * Your work, in sync – Chat conversation UI
 * Generated from Figma via MCP with exact measurements (482×300px)
 * Single-file component following the v0-ready pattern used in this repo.
 */
const YourWorkInSync: React.FC<YourWorkInSyncProps> = ({
  width = 482,
  height = 300,
  className = "",
  theme = "dark",
}) => {
  // Design tokens (derived from Figma local variables)
  const themeVars =
    theme === "light"
      ? {
          "--yws-surface": "#ffffff",
          "--yws-text-primary": "#37322f",
          "--yws-text-secondary": "#6b7280",
          "--yws-bubble-light": "#e8e5e3",
          "--yws-bubble-dark": "#37322f",
          "--yws-bubble-white": "#ffffff",
          "--yws-border": "rgba(0,0,0,0.08)",
          "--yws-shadow": "rgba(0,0,0,0.08)",
        }
      : ({
          "--yws-surface": "#1f2937",
          "--yws-text-primary": "#f9fafb",
          "--yws-text-secondary": "#d1d5db",
          "--yws-bubble-light": "#374151",
          "--yws-bubble-dark": "#111827",
          "--yws-bubble-white": "#ffffff",
          "--yws-border": "rgba(255,255,255,0.12)",
          "--yws-shadow": "rgba(0,0,0,0.24)",
        } as React.CSSProperties)

  // Figma-exported assets
  const imgFrame2147223205 = "/professional-woman-avatar-with-short-brown-hair-an.jpg"
  const imgFrame2147223206 = "/professional-man-avatar-with-beard-and-glasses-loo.jpg"
  const imgFrame2147223207 = "/professional-person-avatar-with-curly-hair-and-war.jpg"
  const imgArrowUp =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round'%3E%3Cpath d='m5 12 7-7 7 7'/%3E%3Cpath d='M12 19V5'/%3E%3C/svg%3E"

  return (
    <div
      className={className}
      style={
        {
          width,
          height,
          position: "relative",
          background: "transparent",
          ...themeVars,
        } as React.CSSProperties
      }
      role="img"
      aria-label="Chat conversation showing team collaboration sync"
    >
      {/* Root frame size 482×300 – content centered */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[356px] h-[216px]">
        {/* Remove the flip transformation and position messages normally */}
        <div className="relative w-[356px] h-[216px] scale-110">
          {/* Message 1: Left side with avatar */}
          <div className="absolute left-0 top-0 flex gap-[10px] items-start w-[356px] h-[36px]">
            {/* Avatar */}
            <div className="w-[36px] h-[36px] rounded-[44px] bg-cover bg-center border" style={{ backgroundImage: `url('${imgFrame2147223205}')`, borderColor: 'var(--yws-border)' }} />
            {/* Message bubble */}
            <div className={`rounded-[999px] px-[12px] h-[36px] flex items-center justify-center ${theme === 'light' ? 'bg-[#e8e5e3]' : 'bg-[var(--yws-bubble-light)]'}`}>
              <span className={`font-medium text-[13px] leading-[16px] tracking-[-0.4px] ${theme === 'light' ? 'text-[#37322f]' : 'text-[var(--yws-text-primary)]'} whitespace-nowrap`}>
                Team updates flow seamlessly
              </span>
            </div>
          </div>

          {/* Message 2: Right side with avatar */}
          <div className="absolute right-0 top-[60px] flex gap-[10px] items-start justify-end">
            {/* Message bubble */}
            <div className={`rounded-[999px] px-[12px] h-[36px] flex items-center justify-center ${theme === 'light' ? 'bg-[#37322f]' : 'bg-[var(--yws-bubble-dark)]'}`}>
              <span className="font-medium text-[13px] leading-[16px] tracking-[-0.4px] text-white whitespace-nowrap">Hi everyone</span>
            </div>
            {/* Avatar */}
            <div className="w-[36px] h-[36px] rounded-[44px] bg-cover bg-center border" style={{ backgroundImage: `url('${imgFrame2147223206}')`, borderColor: 'var(--yws-border)' }} />
          </div>

          {/* Message 3: Left side with avatar */}
          <div className="absolute left-0 top-[120px] flex gap-[10px] items-start w-[210px] h-[36px]">
            {/* Avatar */}
            <div className="w-[36px] h-[36px] rounded-[44px] bg-cover bg-center border" style={{ backgroundImage: `url('${imgFrame2147223207}')`, borderColor: 'var(--yws-border)' }} />
            {/* Message bubble */}
            <div
              style={{
                background: theme === "light" ? "#e8e5e3" : "var(--yws-bubble-light)",
                borderRadius: "999px",
                padding: "0px 12px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 500,
                  fontSize: "13px",
                  lineHeight: "16px",
                  letterSpacing: "-0.4px",
                  color: theme === "light" ? "#37322f" : "var(--yws-text-primary)",
                  whiteSpace: "nowrap",
                }}
              >
                How about this instead?
              </span>
            </div>
          </div>

          {/* Message 4: Center with send button */}
          <div className="absolute left-[146px] top-[180px] flex gap-[10px] items-center h-[36px]">
            {/* Message bubble */}
            <div className="bg-white rounded-[16px] px-[12px] h-[36px] flex items-center justify-center shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08),_0px_1px_2px_-0.4px_rgba(0,0,0,0.08)] overflow-hidden">
              <span className="font-normal text-[14px] leading-[20px] text-[#030712] whitespace-nowrap">Great work, everyone!</span>
            </div>
            {/* Send button */}
            <div className={`w-[36px] h-[36px] rounded-[44px] flex items-center justify-center shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)] cursor-pointer ${theme === 'light' ? 'bg-[#37322f]' : 'bg-[var(--yws-bubble-dark)]'}`}>
              <img src={imgArrowUp || "/placeholder.svg"} alt="Send" className="w-[20px] h-[20px] filter brightness-0 invert" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default YourWorkInSync
