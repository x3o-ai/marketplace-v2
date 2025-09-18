import { MarketplaceContainer, SectionHeader, FeatureCard, MarketplaceBadge } from "./ui-foundation-guide"

// =============================================================================
// MARKETPLACE-SPECIFIC COMPONENTS
// =============================================================================

// AI Automation Category Browser
export function CategoryBrowser({ categories }: { categories: Array<{ name: string; count: number; icon: string }> }) {
  return (
    <MarketplaceContainer>
      <SectionHeader
        badge={{
          icon: <div className="w-3 h-3 border border-[#37322F] rounded" />,
          text: "Categories",
        }}
        title="Browse AI Automation Tools"
        description="Discover powerful AI tools organized by use case and industry."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
        {categories.map((category, index) => (
          <div
            key={index}
            className="p-6 bg-white border border-[#E0DEDB] rounded-lg hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="text-2xl mb-3">{category.icon}</div>
            <h3 className="text-[#37322F] font-semibold mb-1">{category.name}</h3>
            <p className="text-[#605A57] text-sm">{category.count} tools</p>
          </div>
        ))}
      </div>
    </MarketplaceContainer>
  )
}

// AI Tool Comparison Table
export function ToolComparisonTable({ tools }: { tools: Array<any> }) {
  return (
    <div className="bg-white border border-[#E0DEDB] rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E0DEDB]">
        <h3 className="text-[#37322F] text-lg font-semibold">Compare AI Tools</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F7F5F3]">
            <tr>
              <th className="px-6 py-3 text-left text-[#37322F] font-medium">Tool</th>
              <th className="px-6 py-3 text-left text-[#37322F] font-medium">Category</th>
              <th className="px-6 py-3 text-left text-[#37322F] font-medium">Pricing</th>
              <th className="px-6 py-3 text-left text-[#37322F] font-medium">Rating</th>
              <th className="px-6 py-3 text-left text-[#37322F] font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {tools.map((tool, index) => (
              <tr key={index} className="border-b border-[#E0DEDB] last:border-b-0">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg"></div>
                    <div>
                      <div className="text-[#37322F] font-medium">{tool.name}</div>
                      <div className="text-[#605A57] text-sm">{tool.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <MarketplaceBadge
                    icon={<div className="w-2 h-2 bg-blue-500 rounded-full" />}
                    text={tool.category}
                    variant="info"
                  />
                </td>
                <td className="px-6 py-4 text-[#37322F] font-medium">{tool.pricing}</td>
                <td className="px-6 py-4 text-[#605A57]">⭐ {tool.rating}</td>
                <td className="px-6 py-4">
                  <button className="px-4 py-2 bg-[#37322F] text-white rounded-full text-sm font-medium hover:bg-[#2a2520] transition-colors">
                    Try Now
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Integration Dashboard for AI Tools
export function IntegrationDashboard({ integrations }: { integrations: Array<any> }) {
  return (
    <div className="space-y-6">
      <SectionHeader
        badge={{
          icon: <div className="w-3 h-3 border-2 border-[#37322F] rounded-full" />,
          text: "Integrations",
        }}
        title="Your AI Tool Integrations"
        description="Manage and monitor your connected AI automation tools."
        centered={false}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration, index) => (
          <FeatureCard
            key={index}
            title={integration.name}
            description={integration.description}
            isActive={integration.isActive}
          >
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${integration.status === "active" ? "bg-green-500" : "bg-gray-400"}`}
                ></div>
                <span className="text-xs text-[#605A57] capitalize">{integration.status}</span>
              </div>
              <button className="text-xs text-[#37322F] hover:underline">Configure</button>
            </div>
          </FeatureCard>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

export function MarketplaceHomePage() {
  const sampleCategories = [
    { name: "Content Generation", count: 45, icon: "✍️" },
    { name: "Image Processing", count: 32, icon: "🖼️" },
    { name: "Data Analysis", count: 28, icon: "📊" },
    { name: "Voice & Audio", count: 19, icon: "🎵" },
    { name: "Automation", count: 67, icon: "🤖" },
    { name: "Translation", count: 23, icon: "🌐" },
    { name: "Code Generation", count: 15, icon: "💻" },
    { name: "Customer Support", count: 38, icon: "💬" },
  ]

  const sampleTools = [
    {
      name: "GPT-4 Writer",
      description: "Advanced content generation",
      category: "Content",
      pricing: "$29/mo",
      rating: 4.8,
    },
    {
      name: "Vision API",
      description: "Image recognition & analysis",
      category: "Vision",
      pricing: "$0.10/req",
      rating: 4.9,
    },
    {
      name: "Voice Synth",
      description: "Text-to-speech conversion",
      category: "Audio",
      pricing: "$15/mo",
      rating: 4.7,
    },
  ]

  const sampleIntegrations = [
    { name: "OpenAI GPT-4", description: "Content generation API", status: "active", isActive: true },
    { name: "Google Vision", description: "Image analysis service", status: "active", isActive: false },
    { name: "AWS Polly", description: "Text-to-speech service", status: "inactive", isActive: false },
  ]

  return (
    <div className="w-full min-h-screen bg-[#F7F5F3]">
      {/* Hero Section */}
      <div className="py-16">
        <MarketplaceContainer>
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-serif text-[#37322F] mb-6 leading-tight">
              AI Automation Marketplace
            </h1>
            <p className="text-lg text-[#605A57] mb-8 leading-relaxed">
              Discover, integrate, and automate with the world's most powerful AI tools.
              <br />
              Build smarter workflows in minutes, not months.
            </p>
            <button className="px-8 py-3 bg-[#37322F] text-white rounded-full font-medium hover:bg-[#2a2520] transition-colors">
              Explore Tools
            </button>
          </div>
        </MarketplaceContainer>
      </div>

      {/* Categories Section */}
      <div className="py-16 border-t border-[#E0DEDB]">
        <CategoryBrowser categories={sampleCategories} />
      </div>

      {/* Tool Comparison */}
      <div className="py-16 border-t border-[#E0DEDB]">
        <MarketplaceContainer>
          <ToolComparisonTable tools={sampleTools} />
        </MarketplaceContainer>
      </div>

      {/* Integration Dashboard */}
      <div className="py-16 border-t border-[#E0DEDB]">
        <MarketplaceContainer>
          <IntegrationDashboard integrations={sampleIntegrations} />
        </MarketplaceContainer>
      </div>
    </div>
  )
}

export default MarketplaceHomePage
