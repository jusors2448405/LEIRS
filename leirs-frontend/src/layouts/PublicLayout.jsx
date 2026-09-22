import React, { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { ShieldAlert, Phone, Mail, MapPin, Menu, X } from 'lucide-react'

const PublicLayout = () => {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Track My Report', path: '/track' },
    { name: 'How to Report', path: '/report' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ]

  const isActive = (path) => location.pathname === path

  const handleLinkClick = () => {
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <Link to="/" className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl flex items-center justify-center">
                <ShieldAlert className="text-white" size={24} />
              </div>
              <div>
                <p className="font-heading font-bold text-lg sm:text-xl text-text">LEIRS</p>
                <p className="text-xs text-muted hidden sm:block">Barangay 178, Camarin</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`font-medium transition-colors ${
                    isActive(link.path)
                      ? 'text-primary'
                      : 'text-muted hover:text-primary'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                to="/staff/login"
                className="bg-primary text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium hover:bg-primaryDark transition-colors text-sm sm:text-base"
              >
                Staff Portal
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-text" />
              ) : (
                <Menu className="w-6 h-6 text-text" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-white">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={handleLinkClick}
                  className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive(link.path)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted hover:bg-background hover:text-primary'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                to="/staff/login"
                onClick={handleLinkClick}
                className="block w-full text-center bg-primary text-white px-4 py-3 rounded-lg font-medium hover:bg-primaryDark transition-colors mt-2"
              >
                Staff Portal
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <ShieldAlert className="text-white" size={24} />
                </div>
                <div>
                  <p className="font-heading font-bold text-lg text-text">LEIRS</p>
                  <p className="text-xs text-muted">Law Enforcement and Incident Reporting System</p>
                </div>
              </div>
              <p className="text-muted text-sm sm:text-base leading-relaxed max-w-md">
                A centralized incident reporting and case management system for Barangay 178, Camarin, North Caloocan City.
              </p>
            </div>

            <div>
              <h4 className="font-heading font-semibold text-text mb-4">Contact Info</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-muted text-sm">
                  <Phone size={16} className="mt-0.5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted">Emergency</p>
                    <p className="font-medium text-text">911</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-muted text-sm">
                  <Phone size={16} className="mt-0.5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted">Barangay Hall</p>
                    <p className="font-medium text-text">(02) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-muted text-sm">
                  <Mail size={16} className="mt-0.5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted">Email</p>
                    <p className="font-medium text-text">brgy178@example.com</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-heading font-semibold text-text mb-4">Quick Links</h4>
              <div className="space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="block text-muted hover:text-primary transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                ))}
                <Link
                  to="/staff/login"
                  className="block text-muted hover:text-primary transition-colors text-sm"
                >
                  Staff Portal
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted text-center sm:text-left">
              © {new Date().getFullYear()} LEIRS - Barangay 178. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/privacy-policy" className="text-sm text-muted hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms-of-service" className="text-sm text-muted hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout
