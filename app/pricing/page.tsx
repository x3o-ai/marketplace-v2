import Link from "next/link"

export default function PricingPage() {
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
                <Link href="/pricing" className="text-[#37322f] font-medium text-sm border-b-2 border-[#37322f]">
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
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-[#605A57] mb-8 max-w-3xl mx-auto">
            Start with a 14-day free trial, then choose the plan that scales with your business. 
            No hidden fees, no vendor lock-in.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Starter Plan */}
          <div className="bg-white p-8 rounded-lg shadow-sm border border-[#E0DEDB] relative">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-[#37322F] mb-2">Starter</h3>
              <div className="text-4xl font-bold text-[#37322F] mb-1">$99</div>
              <div className="text-[#605A57] mb-6">per month</div>
              <p className="text-[#605A57] mb-8">
                Perfect for small teams getting started with AI automation
              </p>
              
              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[#37322F]">Oracle Analytics - 100 queries/month</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[#37322F]">Sentinel Monitoring - Basic alerts</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[#37322F]">Up to 5 team members</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[#37322F]">Email support</span>
                </li>
              </ul>
              
              <Link
                href="/signup"
                className="block w-full py-3 px-6 border border-[#37322F] text-[#37322F] rounded-lg font-medium hover:bg-[#37322F] hover:text-white transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          </div>

          {/* Professional Plan */}
          <div className="bg-white p-8 rounded-lg shadow-sm border-2 border-[#37322F] relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-[#37322F] text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-[#37322F] mb-2">Professional</h3>
              <div className="text-4xl font-bold text-[#37322F] mb-1">$299</div>
              <div className="text-[#605A57] mb-6">per month</div>
              <p className="text-[#605A57] mb-8">
                For growing businesses that need advanced AI automation
              </p>
              
              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[#37322F]">All Trinity Agents - Unlimited usage</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[#37322F]">Advanced monitoring & optimization</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[#37322F]">Up to 25 team members</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[#37322F]">Priority support & onboarding</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[#37322F]">Custom integrations</span>
                </li>
              </ul>
              
              <Link
                href="/signup"
                className="block w-full py-3 px-6 bg-[#37322F] text-white rounded-lg font-medium hover:bg-[#2a221f] transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white p-8 rounded-lg shadow-sm border border-[#E0DEDB] relative">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-[#37322F] mb-2">Enterprise</h3>
              <div className="text-4xl font-bold text-[#37322F] mb-1">Custom</div>
              <div className="text-[#605A57] mb-6">contact sales</div>
              <p className="text-[#605A57] mb-8">
                For large organizations requiring dedicated support and customization
              </p>
              
              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[#37322F]">Unlimited everything</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[#37322F]">Dedicated AI infrastructure</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[#37322F]">Custom Trinity Agent development</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[#37322F]">24/7 dedicated support</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[#37322F]">SLA guarantees</span>
                </li>
              </ul>
              
              <Link
                href="/contact-sales"
                className="block w-full py-3 px-6 border border-[#37322F] text-[#37322F] rounded-lg font-medium hover:bg-[#37322F] hover:text-white transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-[#37322F] text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-[#37322F] mb-3">
                What's included in the free trial?
              </h3>
              <p className="text-[#605A57] mb-6">
                Full access to all Trinity Agents for 14 days. No credit card required. 
                Experience Oracle Analytics, Sentinel Monitoring, and Sage Optimization with real data.
              </p>

              <h3 className="text-lg font-semibold text-[#37322F] mb-3">
                How does billing work?
              </h3>
              <p className="text-[#605A57] mb-6">
                Simple monthly or annual billing. Cancel anytime with no penalties. 
                All plans include unlimited support during business hours.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#37322F] mb-3">
                Can I upgrade or downgrade my plan?
              </h3>
              <p className="text-[#605A57] mb-6">
                Yes, you can change plans anytime. Upgrades take effect immediately, 
                downgrades take effect at your next billing cycle.
              </p>

              <h3 className="text-lg font-semibold text-[#37322F] mb-3">
                Do you offer custom enterprise solutions?
              </h3>
              <p className="text-[#605A57]">
                Absolutely. Our Enterprise plan includes custom Trinity Agent development, 
                dedicated infrastructure, and white-glove onboarding.
              </p>
            </div>
          </div>
        </div>

        {/* ROI Calculator */}
        <div className="bg-gradient-to-r from-[#37322F] to-[#2a221f] rounded-lg p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Calculate Your ROI</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Trinity Agents typically deliver 300-500% ROI within the first 6 months 
            by automating manual processes and providing actionable insights.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="text-3xl font-bold mb-2">40+ hours</div>
              <div className="opacity-90">saved per week per agent</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">$2M+</div>
              <div className="opacity-90">average annual savings</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">6 months</div>
              <div className="opacity-90">average payback period</div>
            </div>
          </div>
          <Link
            href="/contact-sales"
            className="inline-block bg-white text-[#37322F] px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Get ROI Analysis
          </Link>
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
              <Link href="/products" className="text-[#605A57] hover:text-[#37322F] transition-colors">
                Products
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}