"use client"

/**
 * UI Foundation Guide for AI Automation Marketplace
 *
 * This guide shows how to use the Brillance SaaS template components
 * as a scalable foundation for your AI automation marketplace.
 */

import type React from "react"

// =============================================================================
// DESIGN SYSTEM TOKENS
// =============================================================================

export const DesignTokens = {
  // Color System (from globals.css)
  colors: {
    // Primary brand colors
    primary: "oklch(0.205 0 0)", // Dark gray-black
    primaryForeground: "oklch(0.985 0 0)", // Near white

    // Background system
    background: "oklch(1 0 0)", // Pure white
    foreground: "oklch(0.145 0 0)", // Very dark gray

    // Surface colors
    card: "oklch(1 0 0)", // White cards
    muted: "oklch(0.97 0 0)", // Light gray
    mutedForeground: "oklch(0.556 0 0)", // Medium gray

    // Interactive states
    border: "oklch(0.922 0 0)", // Light border
    accent: "oklch(0.97 0 0)", // Subtle accent
  },

  // Typography System
  typography: {
    fontSans: "var(--font-inter)", // Inter for UI
    fontSerif: "var(--font-instrument-serif)", // Instrument Serif for headings
    fontMono: "ui-monospace, SF Mono, Consolas", // Code/technical content
  },

  // Spacing & Layout
  spacing: {
    containerMaxWidth: "1060px", // Main content width
    sectionPadding: "py-8 sm:py-12 md:py-16", // Consistent section spacing
    cardPadding: "p-4 sm:p-6 md:p-8 lg:p-12", // Card internal spacing
  },
}

// =============================================================================
// REUSABLE COMPONENTS FOR YOUR MARKETPLACE
// =============================================================================

// Badge Component - Perfect for feature tags, categories, status indicators
export function MarketplaceBadge({
  icon,
  text,
  variant = "default",
}: {
  icon: React.ReactNode
  text: string
  variant?: "default" | "success" | "warning" | "info"
}) {
  const variants = {
    default: "bg-white border-[rgba(2,6,23,0.08)]",
    success: "bg-green-50 border-green-200",
    warning: "bg-yellow-50 border-yellow-200",
    info: "bg-blue-50 border-blue-200",
  }

  return (
    <div
      className={`px-[14px] py-[6px] shadow-[0px_0px_0px_4px_rgba(55,50,47,0.05)] overflow-hidden rounded-[90px] flex justify-start items-center gap-[8px] border shadow-xs ${variants[variant]}`}
    >
      <div className="w-[14px] h-[14px] relative overflow-hidden flex items-center justify-center">{icon}</div>
      <div className="text-center flex justify-center flex-col text-[#37322F] text-xs font-medium leading-3 font-sans">
        {text}
      </div>
    </div>
  )
}

// Section Header - Consistent section headers across your marketplace
export function SectionHeader({
  badge,
  title,
  description,
  centered = true,
}: {
  badge?: { icon: React.ReactNode; text: string }
  title: string
  description?: string
  centered?: boolean
}) {
  return (
    <div
      className={`w-full max-w-[616px] px-4 sm:px-6 py-4 sm:py-5 flex flex-col justify-start items-center gap-3 sm:gap-4 ${centered ? "text-center" : "text-left"}`}
    >
      {badge && <MarketplaceBadge icon={badge.icon} text={badge.text} />}
      <div className="w-full text-[#49423D] text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
        {title}
      </div>
      {description && (
        <div className="text-[#605A57] text-sm sm:text-base font-normal leading-6 sm:leading-7 font-sans">
          {description}
        </div>
      )}
    </div>
  )
}

// Feature Card - Perfect for AI automation tools, services, integrations
export function FeatureCard({
  title,
  description,
  isActive = false,
  progress = 0,
  onClick,
  children,
}: {
  title: string
  description: string
  isActive?: boolean
  progress?: number
  onClick?: () => void
  children?: React.ReactNode
}) {
  return (
    <div
      className={`w-full self-stretch px-6 py-5 overflow-hidden flex flex-col justify-start items-start gap-4 cursor-pointer relative border ${
        isActive
          ? "bg-white shadow-[0px_0px_0px_0.75px_#E0DEDB_inset]"
          : "border-[#E0DEDB]/80 hover:bg-white/50 transition-colors"
      }`}
      onClick={onClick}
    >
      {isActive && progress > 0 && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-[rgba(50,45,43,0.08)]">
          <div
            className="h-full bg-[#322D2B] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="self-stretch flex justify-center flex-col text-[#49423D] text-sm md:text-sm font-semibold leading-6 md:leading-6 font-sans">
        {title}
      </div>
      <div className="self-stretch text-[#605A57] text-[13px] md:text-[13px] font-normal leading-[22px] md:leading-[22px] font-sans">
        {description}
      </div>
      {children && <div className="w-full mt-2">{children}</div>}
    </div>
  )
}

// Layout Container - Main content wrapper with consistent spacing
export function MarketplaceContainer({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`w-full max-w-[1060px] mx-auto px-4 sm:px-6 md:px-8 lg:px-0 relative ${className}`}>{children}</div>
  )
}

// Grid System - Responsive grid for AI tools, categories, etc.
export function MarketplaceGrid({
  children,
  columns = "1 md:2 lg:3",
  gap = "gap-6",
}: {
  children: React.ReactNode
  columns?: string
  gap?: string
}) {
  return <div className={`grid grid-cols-${columns} ${gap}`}>{children}</div>
}

// =============================================================================
// INTEGRATION EXAMPLES FOR YOUR AI MARKETPLACE
// =============================================================================

// Example: AI Tool Card
export function AIToolCard({
  name,
  description,
  category,
  pricing,
  rating,
  image,
}: {
  name: string
  description: string
  category: string
  pricing: string
  rating: number
  image?: string
}) {
  return (
    <div className="bg-white border border-[#E0DEDB] rounded-lg p-6 hover:shadow-lg transition-shadow">
      {image && (
        <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 overflow-hidden">
          <img src={image || "/placeholder.svg"} alt={name} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <MarketplaceBadge icon={<div className="w-2 h-2 bg-blue-500 rounded-full" />} text={category} variant="info" />
        <div className="text-sm text-[#605A57]">⭐ {rating}</div>
      </div>

      <h3 className="text-[#37322F] text-lg font-semibold mb-2 font-sans">{name}</h3>
      <p className="text-[#605A57] text-sm leading-relaxed mb-4 font-sans">{description}</p>

      <div className="flex items-center justify-between">
        <span className="text-[#37322F] font-semibold">{pricing}</span>
        <button className="px-4 py-2 bg-[#37322F] text-white rounded-full text-sm font-medium hover:bg-[#2a2520] transition-colors">
          Try Now
        </button>
      </div>
    </div>
  )
}

// Example: Marketplace Navigation
export function MarketplaceNav() {
  return (
    <nav className="w-full h-[84px] flex justify-center items-center px-6 relative z-20">
      <div className="w-full h-0 absolute left-0 top-[42px] border-t border-[rgba(55,50,47,0.12)]"></div>

      <div className="w-full max-w-[700px] h-12 py-2 px-4 pr-3 bg-[#F7F5F3] backdrop-blur-sm shadow-[0px_0px_0px_2px_white] rounded-[50px] flex justify-between items-center relative z-30">
        <div className="flex items-center">
          <div className="text-[#2F3037] text-xl font-medium font-sans">AI Marketplace</div>
          <div className="pl-5 hidden sm:flex gap-4">
            <span className="text-[rgba(49,45,43,0.80)] text-[13px] font-medium">Browse</span>
            <span className="text-[rgba(49,45,43,0.80)] text-[13px] font-medium">Categories</span>
            <span className="text-[rgba(49,45,43,0.80)] text-[13px] font-medium">Pricing</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-[14px] py-[6px] bg-white shadow-[0px_1px_2px_rgba(55,50,47,0.12)] rounded-full text-[#37322F] text-[13px] font-medium">
            Sign In
          </button>
        </div>
      </div>
    </nav>
  )
}

export default function UIFoundationGuide() {
  return (
    <div className="w-full min-h-screen bg-[#F7F5F3] py-12">
      <MarketplaceContainer>
        <SectionHeader
          badge={{
            icon: <div className="w-2 h-2 bg-blue-500 rounded-full" />,
            text: "UI Foundation",
          }}
          title="Scalable Components for Your AI Marketplace"
          description="Use these battle-tested components to build a consistent, professional marketplace experience."
        />

        <div className="mt-12">
          <MarketplaceGrid columns="1 md:2 lg:3">
            <AIToolCard
              name="GPT-4 Content Generator"
              description="Generate high-quality content for blogs, social media, and marketing materials using advanced AI."
              category="Content"
              pricing="$29/month"
              rating={4.8}
            />
            <AIToolCard
              name="Image Recognition API"
              description="Powerful computer vision API for object detection, facial recognition, and image analysis."
              category="Vision"
              pricing="$0.10/request"
              rating={4.9}
            />
            <AIToolCard
              name="Voice Synthesis Tool"
              description="Convert text to natural-sounding speech in multiple languages and voices."
              category="Audio"
              pricing="$15/month"
              rating={4.7}
            />
          </MarketplaceGrid>
        </div>
      </MarketplaceContainer>
    </div>
  )
}
