import React from 'react'
import barangay178 from "../assets/barangay178.png";
import { 
  ShieldAlert, 
  FileText, 
  ClipboardList, 
  Radio, 
  Clock, 
  Search, 
  ArrowRight,
  Building2,
  Phone,
  Mail,
  MapPin,
  BarChart3
} from 'lucide-react'
import { Link } from 'react-router-dom'
import barangayHallImage from '../assets/barangay178.png'
import useDashboardStats from '../hooks/useDashboardStats'

const Landing = () => {
  // Fetch aggregate counts only — no PII is requested or returned
  const { stats, loading } = useDashboardStats()
  const quickAccessItems = [
    { icon: FileText, title: 'Incident Reporting', description: 'Create and submit incident reports' },
    { icon: ClipboardList, title: 'Case Documentation', description: 'Manage and update case files' },
    { icon: Radio, title: 'Dispatch Coordination', description: 'Assign and monitor officer dispatch' },
    { icon: ShieldAlert, title: 'Evidence Management', description: 'Store and track digital evidence' },
    { icon: Clock, title: 'Case Status Monitoring', description: 'Track real-time case progress' },
    { icon: Search, title: 'Track Report', description: 'Public incident report tracking' }
  ]

  const systemModules = [
    { icon: FileText, title: 'Incident Reporting', description: 'Digitally record and submit incident reports' },
    { icon: ClipboardList, title: 'Case Documentation', description: 'Maintain comprehensive case files' },
    { icon: Radio, title: 'Dispatch', description: 'Coordinate officer dispatch and response' },
    { icon: ShieldAlert, title: 'Evidence Logging', description: 'Securely store and manage evidence' },
    { icon: Clock, title: 'Case Monitoring', description: 'Monitor case status and updates' },
    { icon: BarChart3, title: 'Analytics', description: 'View incident trends and reports' }
  ]

  const publicStats = [
    {
      label: 'Total Reports',
      value: loading ? '—' : (stats?.total ?? 0).toLocaleString(),
    },
    {
      label: 'Active Cases',
      // Active = not yet resolved or closed
      value: loading ? '—' : (stats?.active ?? 0).toLocaleString(),
    },
    {
      label: 'Pending Cases',
      value: loading ? '—' : (stats?.pending ?? 0).toLocaleString(),
    },
    {
      label: 'Resolved Cases',
      // Resolved + Closed (both represent completed cases)
      value: loading ? '—' : ((stats?.resolved ?? 0) + (stats?.closed ?? 0)).toLocaleString(),
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <ShieldAlert className="text-white" size={28} />
              </div>
              <div>
                <p className="font-heading font-bold text-xl text-text">LEIRS</p>
                <p className="text-xs text-muted">Barangay 178, Camarin</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-text font-medium hover:text-primary transition-colors">Home</Link>
              <a href="#about" className="text-muted hover:text-primary transition-colors">About</a>
              <a href="#services" className="text-muted hover:text-primary transition-colors">Services</a>
              <Link to="/track-report" className="text-muted hover:text-primary transition-colors">Track Report</Link>
              <a href="#contact" className="text-muted hover:text-primary transition-colors">Contact</a>
              <Link to="/login" className="bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primaryDark transition-colors">Login</Link>
            </div>

            <button className="md:hidden p-2">
              <svg className="w-6 h-6 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Hero Background */}
        <div className="absolute inset-0">
          <img
            src={barangay178}
            alt="Barangay 178 Hall"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium border border-white/20">
                <Building2 size={16} />
                <span>Barangay 178, North Caloocan City</span>
              </div>
              <h1 className="font-heading text-4xl lg:text-6xl font-bold text-white leading-tight">
                Law Enforcement and Incident Reporting System
              </h1>
              <p className="text-lg text-white/90 leading-relaxed">
                A centralized web-based system for incident reporting, case documentation, evidence management, dispatch coordination, and case status monitoring for Barangay 178.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/login" className="bg-primary text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-primaryDark transition-all flex items-center gap-2 shadow-lg hover:shadow-primary/30">
                  Report Incident <ArrowRight size={20} />
                </Link>
                <Link to="/track-report" className="bg-white text-primary px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-100 transition-all flex items-center gap-2 shadow-lg">
                  Track Incident <Search size={20} />
                </Link>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 lg:gap-6">
              {publicStats.map((stat, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-xl border border-border hover:-translate-y-1 transition-transform">
                  <p className={`text-4xl font-heading font-bold text-primary mb-2 ${loading ? 'opacity-40' : ''}`}>
                    {stat.value}
                  </p>
                  <p className="text-muted text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Cards */}
      <section id="services" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-text mb-4">Quick Access</h2>
            <p className="text-muted max-w-2xl mx-auto text-lg">Get started with the system's key features</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickAccessItems.map((item, index) => {
              const Icon = item.icon
              return (
                <Link
                  key={index}
                  to={index === 5 ? '/track-report' : '/login'}
                  className="group bg-white p-8 rounded-2xl border border-border shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
                >
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all border-2 border-primary/20 group-hover:border-primary">
                    <Icon size={32} className="text-primary group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-heading font-semibold text-xl mb-3 text-text">{item.title}</h3>
                  <p className="text-muted">{item.description}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* About LEIRS */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">About LEIRS</div>
              <h2 className="font-heading text-3xl lg:text-4xl font-bold text-text mb-6">
                Digitizing Barangay Incident Reporting
              </h2>
              <p className="text-muted text-lg leading-relaxed mb-6">
                The Law Enforcement and Incident Reporting System (LEIRS) digitizes Barangay 178's traditional paper-based incident reporting process.
              </p>
              <p className="text-muted leading-relaxed mb-6">
                Our system streamlines the entire workflow from incident submission to case resolution, making it more efficient, transparent, and accessible for both barangay staff and residents.
              </p>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { label: 'Paperless Process', icon: FileText },
                  { label: 'Real-time Updates', icon: Clock },
                  { label: 'Secure Storage', icon: ShieldAlert },
                  { label: 'Data Analytics', icon: BarChart3 }
                ].map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon size={20} className="text-primary" />
                      </div>
                      <p className="font-medium text-text">{item.label}</p>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl blur-2xl" />
              <div className="relative bg-background p-8 rounded-3xl border border-border shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { title: 'Fast Reporting', desc: 'Submit incidents in minutes' },
                    { title: 'Track Status', desc: 'Real-time case updates' },
                    { title: 'Secure Evidence', desc: 'Digital file storage' },
                    { title: 'Smart Analytics', desc: 'Data-driven insights' }
                  ].map((card, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-border shadow-sm">
                      <h4 className="font-heading font-semibold text-text mb-2">{card.title}</h4>
                      <p className="text-muted text-sm">{card.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Modules */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-text mb-4">System Modules</h2>
            <p className="text-muted max-w-2xl mx-auto text-lg">Comprehensive features designed for modern barangay law enforcement</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {systemModules.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="bg-white p-8 rounded-2xl border border-border shadow-sm hover:shadow-lg transition-all">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primaryDark rounded-2xl flex items-center justify-center mb-6">
                    <Icon size={32} className="text-white" />
                  </div>
                  <h3 className="font-heading font-semibold text-xl mb-3 text-text">{item.title}</h3>
                  <p className="text-muted">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-white border-t border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <ShieldAlert className="text-white" size={28} />
                </div>
                <div>
                  <p className="font-heading font-bold text-xl text-text">LEIRS</p>
                  <p className="text-xs text-muted">Law Enforcement and Incident Reporting System</p>
                </div>
              </div>
              <p className="text-muted leading-relaxed max-w-lg mb-6">
                A centralized incident reporting and case management system for Barangay 178, Camarin, North Caloocan City.
              </p>
            </div>

            <div>
              <h4 className="font-heading font-semibold text-text mb-6">Contact Info</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-muted">
                  <Phone size={18} className="mt-1 text-primary" />
                  <div>
                    <p className="text-sm">Emergency</p>
                    <p className="font-medium text-text">911</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-muted">
                  <Phone size={18} className="mt-1 text-primary" />
                  <div>
                    <p className="text-sm">Barangay Hall</p>
                    <p className="font-medium text-text">(02) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-muted">
                  <Mail size={18} className="mt-1 text-primary" />
                  <div>
                    <p className="text-sm">Email</p>
                    <p className="font-medium text-text">brgy178camarin@example.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-muted">
                  <MapPin size={18} className="mt-1 text-primary" />
                  <div>
                    <p className="text-sm">Address</p>
                    <p className="font-medium text-text">Barangay 178, Camarin<br />North Caloocan City</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-heading font-semibold text-text mb-6">Quick Links</h4>
              <div className="space-y-3">
                <Link to="/" className="block text-muted hover:text-primary transition-colors">Home</Link>
                <Link to="/track-report" className="block text-muted hover:text-primary transition-colors">Track Report</Link>
                <Link to="/login" className="block text-muted hover:text-primary transition-colors">Login</Link>
                <a href="#about" className="block text-muted hover:text-primary transition-colors">About</a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted">© {new Date().getFullYear()} LEIRS - Barangay 178. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="/" className="text-sm text-muted hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/" className="text-sm text-muted hover:text-primary transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
