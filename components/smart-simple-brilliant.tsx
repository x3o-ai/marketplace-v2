import type React from "react"

interface SmartSimpleBrilliantProps {
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
 * Smart · Simple · Brilliant – Calendar cards
 * Generated from Figma via MCP with exact measurements (482×300px)
 * Single-file component following the v0-ready pattern used in this repo.
 */
const SmartSimpleBrilliant: React.FC<SmartSimpleBrilliantProps> = ({
  width = 482,
  height = 300,
  className = "",
  theme = "dark",
}) => {
  // Design tokens (derived from Figma local variables)
  const themeVars =
    theme === "light"
      ? {
          "--ssb-surface": "#ffffff",
          "--ssb-text": "#1b1919",
          "--ssb-border": "rgba(0,0,0,0.08)",
          "--ssb-inner-border": "rgba(0,0,0,0.12)",
          "--ssb-shadow": "rgba(0,0,0,0.12)",
        }
      : ({
          "--ssb-surface": "#333937",
          "--ssb-text": "#f8f8f8",
          "--ssb-border": "rgba(255,255,255,0.16)",
          "--ssb-inner-border": "rgba(255,255,255,0.12)",
          "--ssb-shadow": "rgba(0,0,0,0.28)",
        } as React.CSSProperties)

  // Figma-exported SVG assets used for small icons
  const img = "http://localhost:3845/assets/1b1e60b441119fb176db990a3c7fe2670a764855.svg"
  const img1 = "http://localhost:3845/assets/a502f04ccfc3811f304b58a3a982a5b6fa070e91.svg"
  const img2 = "http://localhost:3845/assets/9c07375bf3b9f1f1d8a0a24447829eb6f54fa928.svg"
  const img3 = "http://localhost:3845/assets/19500d66798ef5ea9dc9d5f971cd0e9c29674bd3.svg"

  return (
    <div
      className={className}
      style={
        {
          width,
          height,
          position: "relative",
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...themeVars,
        } as React.CSSProperties
      }
      role="img"
      aria-label="Two calendar cards with colored event rows"
    >
      <div className="relative w-[295.297px] h-[212.272px] scale-[1.2]">
        {/* Left tilted card group */}
        <div className="absolute left-[123.248px] top-0 w-0 h-0">
          <div className="rotate-[5deg] origin-center">
            <div className="w-[155.25px] bg-white rounded-[9px] p-[6px] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08),_0px_2px_4px_rgba(0,0,0,0.07)]">
              {/* Amber event */}
              <div
                style={{
                  width: "100%",
                  height: "51px",
                  borderRadius: "4px",
                  overflow: "hidden",
                  background: "rgba(245,158,11,0.1)",
                  display: "flex",
                }}
              >
                <div className="w-[2.25px] bg-[#F59E0B]" />
                  <div className="p-[4.5px] w-full">
                    <div className="flex gap-[3px] items-center">
                      <span className="font-medium text-[9px] text-[#92400E]">2:00</span>
                      <span className="font-medium text-[9px] text-[#92400E]">PM</span>
                      <div className="bg-[#92400E] p-[1.5px] rounded-[100px]">
                        <div className="w-[8px] h-[8px] overflow-hidden relative">
                          <img src={img || "/placeholder.svg"} alt="video" style={{ position: "absolute", inset: "20% 10% 20% 10%" }} />
                        </div>
                      </div>
                    </div>
                    <div className="font-semibold text-[9px] text-[#92400E]">1:1 with Heather</div>
                  </div>
              </div>

              {/* Sky event */}
              <div className="w-full h-[79.5px] rounded-[4px] overflow-hidden bg-[rgba(14,165,233,0.1)] mt-[3px] flex">
                <div className="w-[2.25px] bg-[#0EA5E9]" />
                <div className="p-[4.5px] w-full">
                  <div className="flex gap-[3px] items-center">
                    <span className="font-medium text-[9px] text-[#0C4A6E]">2:00</span>
                    <span className="font-medium text-[9px] text-[#0C4A6E]">PM</span>
                    <div className="bg-[#0C4A6E] p-[1.5px] rounded-[100px]">
                      <div className="w-[8px] h-[8px] overflow-hidden relative">
                        <img src={img1 || "/placeholder.svg"} alt="video" className="absolute top-[20%] left-[10%] right-[10%] bottom-[20%] object-cover" />
                      </div>
                    </div>
                  </div>
                  <div className="font-semibold text-[9px] text-[#0C4A6E]">Concept Design Review II</div>
                </div>
              </div>

              {/* Emerald event */}
              <div className="w-full h-[51px] rounded-[4px] overflow-hidden bg-[rgba(16,185,129,0.1)] mt-[3px] flex">
                <div className="w-[2.25px] bg-[#10B981]" />
                <div className="p-[4.5px] w-full">
                  <div className="flex gap-[3px] items-center">
                    <span className="font-medium text-[9px] text-[#064E3B]">9:00</span>
                    <span className="font-medium text-[9px] text-[#064E3B]">AM</span>
                  </div>
                  <div className="font-semibold text-[9px] text-[#064E3B]">Webinar: Figma ...</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right card */}
        <div className="absolute left-0 top-[6.075px] w-[155.25px]">
          <div className="-rotate-[5deg] origin-center">
            <div className="w-[155.25px] bg-white rounded-[9px] p-[6px] shadow-[-8px_6px_11.3px_rgba(0,0,0,0.12),_0px_0px_0px_1px_rgba(0,0,0,0.08),_0px_2px_4px_rgba(0,0,0,0.06)]">
              {/* Violet event */}
              <div className="w-full h-[51px] rounded-[4px] overflow-hidden bg-[rgba(139,92,246,0.1)] flex">
                <div className="w-[2.25px] bg-[#8B5CF6]" />
                <div className="p-[4.5px] w-full">
                  <div className="flex gap-[3px] items-center">
                    <span className="font-medium text-[9px] text-[#581C87]">11:00</span>
                    <span className="font-medium text-[9px] text-[#581C87]">AM</span>
                    <div className="bg-[#581C87] p-[1.5px] rounded-[100px]">
                      <div className="w-[8px] h-[8px] overflow-hidden relative">
                        <img src={img2 || "/placeholder.svg"} alt="video" className="absolute top-[20%] left-[10%] right-[10%] bottom-[20%] object-cover" />
                      </div>
                    </div>
                  </div>
                  <div className="font-semibold text-[9px] text-[#581C87]">Onboarding Presentation</div>
                </div>
              </div>

              {/* Rose event */}
              <div className="w-full h-[51px] rounded-[4px] overflow-hidden bg-[#FFE4E6] flex mt-[3px]">
                <div className="w-[2.25px] bg-[#F43F5E]" />
                <div className="p-[4.5px] w-full">
                  <div className="flex gap-[3px] items-center">
                    <span className="font-medium text-[9px] text-[#BE123C]">4:00</span>
                    <span className="font-medium text-[9px] text-[#BE123C]">PM</span>
                    <div className="bg-[#BE123C] p-[1.5px] rounded-[100px]">
                      <div className="w-[8px] h-[8px] overflow-hidden relative">
                        <img src={img3 || "/placeholder.svg"} alt="video" className="absolute top-[20%] left-[10%] right-[10%] bottom-[20%] object-cover" />
                      </div>
                    </div>
                  </div>
                  <div className="font-semibold text-[9px] text-[#BE123C]">🍷 Happy Hour</div>
                </div>
              </div>

              {/* Violet tall event */}
              <div
                style={{
                  width: "100%",
                  height: "79.5px",
                  borderRadius: "4px",
                  overflow: "hidden",
                  background: "rgba(139,92,246,0.1)",
                  display: "flex",
                  marginTop: "3px",
                }}
              >
                <div style={{ width: "2.25px", background: "#8B5CF6" }} />
                <div style={{ padding: "4.5px", width: "100%" }}>
                  <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                    <span
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "9px", color: "#581C87" }}
                    >
                      11:00
                    </span>
                    <span
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "9px", color: "#581C87" }}
                    >
                      AM
                    </span>
                  </div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "9px", color: "#581C87" }}>
                    🍔 New Employee Welcome Lunch!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SmartSimpleBrilliant
