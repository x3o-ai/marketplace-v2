import Link from "next/link"

export default function ProductsPage() {
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
                <Link href="/products" className="text-[#37322f] font-medium text-sm border-b-2 border-[#37322f]">
                  Products
                </Link>
                <Link href="/pricing" className="text-[#37322f]/80 hover:text-[#37322f] text-sm font-medium">
                  Pricing
                </Link>
                <Link href="/docs" className="text-[#37322f]/80 hover:text-[#37322f] text-sm font-medium">
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

      {/* Main Content */}
      <main className="max-w-[1060px] mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-[#37322F] mb-6">
            Trinity AI Agents
          </h1>
          <p className="text-xl text-[#605A57] mb-8 max-w-3xl mx-auto">
            Three specialized AI agents that transform how your enterprise operates. 
            Oracle analyzes, Sentinel monitors, and Sage optimizes - all with complete explainability.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Oracle Analytics */}
          <div className="bg-white p-8 rounded-lg shadow-sm border border-[#E0DEDB]">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-[#37322F] mb-4">Oracle Analytics</h3>
            <p className="text-[#605A57] mb-6">
              Advanced business intelligence with explainable AI that replaces entire analytics teams. 
              Get insights, forecasts, and strategic recommendations with complete transparency.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center text-sm text-[#605A57]">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Revenue forecasting & financial analysis
              </li>
              <li className="flex items-center text-sm text-[#605A57]">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Customer behavior insights
              </li>
              <li className="flex items-center text-sm text-[#605A57]">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Strategic decision support
              </li>
            </ul>
            <Link 
              href="/signup"
              className="inline-block w-full bg-[#37322F] text-white text-center py-3 rounded-lg font-medium hover:bg-[#2a221f] transition-colors"
            >
              Start Oracle Trial
            </Link>
          </div>

          {/* Sentinel Monitoring */}
          <div className="bg-white p-8 rounded-lg shadow-sm border border-[#E0DEDB]">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-[#37322F] mb-4">Sentinel Monitoring</h3>
            <p className="text-[#605A57] mb-6">
              Autonomous system monitoring and optimization that operates 24/7 without human intervention. 
              Prevents issues before they impact your business.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center text-sm text-[#605A57]">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Real-time system health monitoring
              </li>
              <li className="flex items-center text-sm text-[#605A57]">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Predictive failure detection
              </li>
              <li className="flex items-center text-sm text-[#605A57]">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Automated incident response
              </li>
            </ul>
            <Link 
              href="/signup"
              className="inline-block w-full bg-[#37322F] text-white text-center py-3 rounded-lg font-medium hover:bg-[#2a221f] transition-colors"
            >
              Start Sentinel Trial
            </Link>
          </div>

          {/* Sage Optimization */}
          <div className="bg-white p-8 rounded-lg shadow-sm border border-[#E0DEDB]">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-[#37322F] mb-4">Sage Optimization</h3>
            <p className="text-[#605A57] mb-6">
              Intelligent process automation that continuously improves operations and maximizes efficiency. 
              Transforms workflows and eliminates bottlenecks automatically.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center text-sm text-[#605A57]">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Workflow automation & optimization
              </li>
              <li className="flex items-center text-sm text-[#605A57]">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Resource allocation efficiency
              </li>
              <li className="flex items-center text-sm text-[#605A57]">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Continuous process improvement
              </li>
            </ul>
            <Link 
              href="/signup"
              className="inline-block w-full bg-[#37322F] text-white text-center py-3 rounded-lg font-medium hover:bg-[#2a221f] transition-colors"
            >
              Start Sage Trial
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white py-16 mt-16">
          <div className="max-w-[1060px] mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#37322F] mb-4">
                Enterprise-Grade AI That Explains Every Decision
              </h2>
              <p className="text-lg text-[#605A57] max-w-3xl mx-auto">
                Unlike black-box AI solutions, Trinity Agents provide complete transparency 
                and explainability for every recommendation and action.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold text-[#37322F] mb-4">
                  Complete Transparency
                </h3>
                <p className="text-[#605A57] mb-6">
                  Every AI decision comes with detailed explanations, data sources, 
                  and reasoning chains that your team can understand and trust.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[#37322F]">Explainable AI decisions</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[#37322F]">Data source attribution</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[#37322F]">Audit trail for compliance</span>
                  </li>
                </ul>
              </div>
              <div className="bg-[#F7F5F3] p-8 rounded-lg">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#37322F] mb-2">100%</div>
                  <div className="text-sm text-[#605A57] mb-4">Explainable AI</div>
                  <div className="text-2xl font-bold text-[#37322F] mb-2">24/7</div>
                  <div className="text-sm text-[#605A57] mb-4">Autonomous Operation</div>
                  <div className="text-2xl font-bold text-[#37322F] mb-2">50%+</div>
                  <div className="text-sm text-[#605A57]">Efficiency Improvement</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-16">
          <h2 className="text-3xl font-bold text-[#37322F] mb-4">
            Ready to Deploy Trinity Agents?
          </h2>
          <p className="text-lg text-[#605A57] mb-8">
            Start your 14-day free trial and experience enterprise AI automation that actually works.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-3 bg-[#37322F] text-white rounded-lg font-medium hover:bg-[#2a221f] transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              href="/contact-sales"
              className="px-8 py-3 border border-[#37322F] text-[#37322F] rounded-lg font-medium hover:bg-[#37322F] hover:text-white transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E0DEDB] py-8">
        <div className="max-w-[1060px] mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-[#605A57] text-sm mb-4 md:mb-0">
              © 2024 x3o.ai. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/docs" className="text-[#605A57] hover:text-[#37322F] transition-colors">
                Documentation
              </Link>
              <Link href="/contact-sales" className="text-[#605A57] hover:text-[#37322F] transition-colors">
                Support
              </Link>
              <Link href="/pricing" className="text-[#605A57] hover:text-[#37322F] transition-colors">
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}