import Link from "next/link"

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      {/* Navigation */}
      <nav className="w-full border-b border-[#37322f]/20 bg-[#f7f5f3]">
        <div className="max-w-[1060px] mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-[#37322f] font-semibold text-lg">
                x3o.ai
              </Link>
              <div className="hidden md:flex items-center space-x-6">
                <Link href="/products" className="text-[#37322f]/80 hover:text-[#37322f] text-sm font-medium">
                  Products
                </Link>
                <Link href="/pricing" className="text-[#37322f]/80 hover:text-[#37322f] text-sm font-medium">
                  Pricing
                </Link>
                <Link href="/docs" className="text-[#37322f] font-medium text-sm border-b-2 border-[#37322f]">
                  Docs
                </Link>
              </div>
            </div>
            <Link
              href="/signup"
              className="text-[#37322f] hover:bg-[#37322f]/5 px-4 py-2 rounded-lg font-medium"
            >
              Log in
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-[1060px] mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 bg-white rounded-lg p-6 h-fit">
            <nav className="space-y-6">
              <div>
                <h3 className="font-semibold text-[#37322F] mb-3">Getting Started</h3>
                <ul className="space-y-2">
                  <li><a href="#quick-start" className="text-[#605A57] hover:text-[#37322F] text-sm">Quick Start</a></li>
                  <li><a href="#installation" className="text-[#605A57] hover:text-[#37322F] text-sm">Installation</a></li>
                  <li><a href="#authentication" className="text-[#605A57] hover:text-[#37322F] text-sm">Authentication</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-[#37322F] mb-3">Trinity Agents</h3>
                <ul className="space-y-2">
                  <li><a href="#oracle" className="text-[#605A57] hover:text-[#37322F] text-sm">Oracle Analytics</a></li>
                  <li><a href="#sentinel" className="text-[#605A57] hover:text-[#37322F] text-sm">Sentinel Monitoring</a></li>
                  <li><a href="#sage" className="text-[#605A57] hover:text-[#37322F] text-sm">Sage Optimization</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-[#37322F] mb-3">Integration</h3>
                <ul className="space-y-2">
                  <li><a href="#api" className="text-[#605A57] hover:text-[#37322F] text-sm">API Reference</a></li>
                  <li><a href="#webhooks" className="text-[#605A57] hover:text-[#37322F] text-sm">Webhooks</a></li>
                  <li><a href="#sdks" className="text-[#605A57] hover:text-[#37322F] text-sm">SDKs</a></li>
                </ul>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 bg-white rounded-lg p-8">
            {/* Quick Start */}
            <section id="quick-start" className="mb-12">
              <h1 className="text-4xl font-bold text-[#37322F] mb-6">
                Trinity Agents Documentation
              </h1>
              <p className="text-lg text-[#605A57] mb-8">
                Get started with Enterprise AI Automation that scales with your business. 
                Deploy Oracle, Sentinel, and Sage agents in minutes.
              </p>

              <div className="bg-[#F7F5F3] p-6 rounded-lg mb-8">
                <h3 className="font-semibold text-[#37322F] mb-3">🚀 Quick Start</h3>
                <ol className="space-y-2 text-[#605A57]">
                  <li>1. <Link href="/signup" className="text-[#37322F] hover:underline">Sign up for your free trial</Link></li>
                  <li>2. Complete the onboarding questionnaire</li>
                  <li>3. Connect your data sources (CRM, analytics, etc.)</li>
                  <li>4. Deploy your first Trinity Agent</li>
                  <li>5. Start getting AI insights within 24 hours</li>
                </ol>
              </div>
            </section>

            {/* Installation */}
            <section id="installation" className="mb-12">
              <h2 className="text-3xl font-bold text-[#37322F] mb-6">Installation & Setup</h2>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-[#37322F] mb-4">Requirements</h3>
                <ul className="space-y-2 text-[#605A57]">
                  <li>• Enterprise Google Workspace or Microsoft 365</li>
                  <li>• Admin access to your business systems</li>
                  <li>• Minimum 10GB data storage for AI training</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-[#37322F] mb-2">API Integration</h4>
                <pre className="text-sm text-[#605A57] overflow-x-auto">
{`curl -X POST https://api.x3o.ai/v1/agents/oracle \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "Analyze Q4 revenue trends",
    "context": "financial_analysis"
  }'`}
                </pre>
              </div>
            </section>

            {/* Trinity Agents */}
            <section id="oracle" className="mb-12">
              <h2 className="text-3xl font-bold text-[#37322F] mb-6">Trinity Agents Guide</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-semibold text-[#37322F] mb-4">Oracle Analytics Agent</h3>
                  <p className="text-[#605A57] mb-4">
                    Oracle provides advanced business intelligence with complete explainability. 
                    Ask questions in natural language and get detailed insights with data source attribution.
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-[#37322F] mb-2">Example Queries:</h4>
                    <ul className="space-y-1 text-sm text-[#605A57]">
                      <li>• "What's driving our customer churn rate?"</li>
                      <li>• "Forecast revenue for next quarter"</li>
                      <li>• "Which marketing channels have the highest ROI?"</li>
                    </ul>
                  </div>
                </div>

                <div id="sentinel">
                  <h3 className="text-2xl font-semibold text-[#37322F] mb-4">Sentinel Monitoring Agent</h3>
                  <p className="text-[#605A57] mb-4">
                    Sentinel operates autonomously to monitor your systems 24/7. 
                    It detects anomalies, predicts issues, and can auto-resolve common problems.
                  </p>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-[#37322F] mb-2">Monitoring Capabilities:</h4>
                    <ul className="space-y-1 text-sm text-[#605A57]">
                      <li>• System performance & uptime</li>
                      <li>• Security threat detection</li>
                      <li>• Resource utilization optimization</li>
                    </ul>
                  </div>
                </div>

                <div id="sage">
                  <h3 className="text-2xl font-semibold text-[#37322F] mb-4">Sage Optimization Agent</h3>
                  <p className="text-[#605A57] mb-4">
                    Sage continuously analyzes your business processes and recommends optimizations. 
                    It can automate routine tasks and improve workflow efficiency.
                  </p>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-[#37322F] mb-2">Optimization Areas:</h4>
                    <ul className="space-y-1 text-sm text-[#605A57]">
                      <li>• Process automation opportunities</li>
                      <li>• Resource allocation efficiency</li>
                      <li>• Workflow bottleneck elimination</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* API Reference */}
            <section id="api" className="mb-12">
              <h2 className="text-3xl font-bold text-[#37322F] mb-6">API Reference</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-[#37322F] mb-3">Authentication</h3>
                  <p className="text-[#605A57] mb-4">
                    All API requests require authentication using your API key in the Authorization header.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm text-[#605A57]">
{`Authorization: Bearer sk_live_[your_api_key]`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#37322F] mb-3">Base URL</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm text-[#605A57]">
{`https://api.x3o.ai/v1/`}
                    </pre>
                  </div>
                </div>
              </div>
            </section>

            {/* Support */}
            <section className="bg-[#F7F5F3] p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-[#37322F] mb-3">Need Help?</h3>
              <p className="text-[#605A57] mb-4">
                Our team is here to help you succeed with Trinity Agents.
              </p>
              <div className="flex gap-4">
                <Link
                  href="/contact-sales"
                  className="px-6 py-2 bg-[#37322F] text-white rounded-lg font-medium hover:bg-[#2a221f] transition-colors"
                >
                  Contact Support
                </Link>
                <Link
                  href="/signup"
                  className="px-6 py-2 border border-[#37322F] text-[#37322F] rounded-lg font-medium hover:bg-[#37322F] hover:text-white transition-colors"
                >
                  Start Trial
                </Link>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#E0DEDB] py-8">
        <div className="max-w-[1060px] mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-[#605A57] text-sm mb-4 md:mb-0">
              © 2024 x3o.ai. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/products" className="text-[#605A57] hover:text-[#37322F] transition-colors">
                Products
              </Link>
              <Link href="/pricing" className="text-[#605A57] hover:text-[#37322F] transition-colors">
                Pricing
              </Link>
              <Link href="/contact-sales" className="text-[#605A57] hover:text-[#37322F] transition-colors">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}