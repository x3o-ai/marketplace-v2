"use client"

import Link from "next/link"
import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("trinity-credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid credentials. Please try again.")
      } else {
        // Check session and redirect appropriately
        const session = await getSession()
        if (session?.user?.role === 'ADMIN') {
          router.push('/admin')
        } else {
          router.push('/trial-dashboard')
        }
      }
    } catch (err) {
      setError("An error occurred during sign in. Please try again.")
    }

    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signIn("google", { callbackUrl: "/trial-dashboard" })
    } catch (err) {
      setError("Google sign in failed. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F3] flex flex-col">
      {/* Navigation */}
      <nav className="w-full border-b border-[#37322f]/20 bg-[#f7f5f3]">
        <div className="max-w-[1060px] mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="text-[#37322f] font-semibold text-lg">
              x3o.ai
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/docs" className="text-[#37322f]/80 hover:text-[#37322f] text-sm">
                Docs
              </Link>
              <Link href="/signup" className="text-[#37322f] hover:bg-[#37322f]/5 px-4 py-2 rounded-lg font-medium">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-[#E0DEDB] p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#37322F] mb-2">
              Welcome Back
            </h1>
            <p className="text-[#605A57]">
              Sign in to access your Trinity Agents dashboard
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#37322F] mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-[#E0DEDB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#37322F] focus:border-transparent"
                placeholder="your-email@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#37322F] mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-[#E0DEDB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#37322F] focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                loading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#37322F] text-white hover:bg-[#2a221f]"
              }`}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="my-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E0DEDB]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-[#605A57]">Or continue with</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 border border-[#E0DEDB] rounded-lg font-medium text-[#37322F] hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? "Signing in..." : "Continue with Google"}
          </button>

          <div className="text-center mt-6">
            <p className="text-[#605A57] text-sm">
              Don't have an account?{" "}
              <Link href="/signup" className="text-[#37322F] hover:underline font-medium">
                Start your free trial
              </Link>
            </p>
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