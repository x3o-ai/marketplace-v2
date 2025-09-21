"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return "There is a problem with the server configuration."
      case "AccessDenied":
        return "Access denied. You do not have permission to sign in."
      case "Verification":
        return "The verification token has expired or has already been used."
      case "OAuthSignin":
        return "Error in OAuth sign in process."
      case "OAuthCallback":
        return "Error in OAuth callback."
      case "OAuthCreateAccount":
        return "Could not create OAuth account."
      case "EmailCreateAccount":
        return "Could not create email account."
      case "Callback":
        return "Error in callback."
      case "OAuthAccountNotLinked":
        return "Email already exists with a different sign-in method."
      case "EmailSignin":
        return "Error sending verification email."
      case "CredentialsSignin":
        return "Invalid credentials provided."
      case "SessionRequired":
        return "Please sign in to access this page."
      default:
        return "An authentication error occurred."
    }
  }

  const getErrorSolution = (error: string | null) => {
    switch (error) {
      case "AccessDenied":
        return "If you believe this is an error, please contact your administrator or our support team."
      case "OAuthAccountNotLinked":
        return "Try signing in with the method you originally used to create your account."
      case "CredentialsSignin":
        return "Please check your email and password and try again."
      case "SessionRequired":
        return "You need to be signed in to access this page."
      default:
        return "Please try signing in again or contact support if the problem persists."
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
        <div className="max-w-lg w-full bg-white rounded-lg shadow-sm border border-[#E0DEDB] p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-[#37322F] mb-4">
            Authentication Error
          </h1>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium mb-2">
              {getErrorMessage(error)}
            </p>
            <p className="text-red-600 text-sm">
              {getErrorSolution(error)}
            </p>
          </div>

          {error && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <p className="text-xs text-gray-600 font-mono">
                Error Code: {error}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <Link
              href="/auth/signin"
              className="block w-full py-3 px-6 bg-[#37322F] text-white rounded-lg font-medium hover:bg-[#2a221f] transition-colors"
            >
              Try Signing In Again
            </Link>
            
            <Link
              href="/signup"
              className="block w-full py-3 px-6 border border-[#37322F] text-[#37322F] rounded-lg font-medium hover:bg-[#37322F] hover:text-white transition-colors"
            >
              Create New Account
            </Link>
            
            <Link
              href="/"
              className="block w-full py-3 px-6 bg-gray-100 text-[#605A57] rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Return to Homepage
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-[#E0DEDB]">
            <p className="text-sm text-[#605A57] mb-4">
              Still having trouble? Our support team is here to help.
            </p>
            <Link
              href="/contact-sales"
              className="text-[#37322F] hover:underline font-medium"
            >
              Contact Support →
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

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F7F5F3] flex items-center justify-center">
        <div className="text-[#37322F]">Loading...</div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}