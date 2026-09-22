import React from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldAlert,
  FileText,
  ClipboardList,
  Radio,
  Clock,
  Search,
  ArrowRight,
  Building2,
  BarChart3
} from 'lucide-react'
import barangayHallImage from '../../assets/barangay178.png'
import useDashboardStats from '../../hooks/useDashboardStats'

const Home = () => {
  const { stats, loading } = useDashboardStats()

  const quickAccessItems = [
    {
      icon: FileText,
      title: 'How to Report',
      description: 'Learn how to report an incident',
      path: '/report'
    },
    {
      icon: Search,
      title: 'Track My Report',
      description: 'Check your report status',
      path: '/track'
    },
    {
      icon: Building2,
      title: 'About LEIRS',
      description: 'Learn about our system',
      path: '/about'
    }
  ]

  const publicStats = [
    {
      label: 'Total Reports',
      value: loading ? '—' : (stats?.total ?? 0).toLocaleString(),
    },
    {
      label: 'Active Cases',
      value: loading ? '—' : (stats?.active ?? 0).toLocaleString(),
    },
    {
      label: 'Pending Cases',
      value: loading ? '—' : (stats?.pending ?? 0).toLocaleString(),
    },
    {
      label: 'Resolved Cases',
      value: loading ? '—' : ((stats?.resolved ?? 0) + (stats?.closed ?? 0)).toLocaleString(),
    },
  ]

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={barangayHallImage}
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
                <Link
                  to="/report"
                  className="bg-primary text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-primaryDark transition-all flex items-center gap-2 shadow-lg hover:shadow-primary/30"
                >
                  How to Report <ArrowRight size={20} />
                </Link>
                <Link
                  to="/track"
                  className="bg-white text-primary px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-100 transition-all flex items-center gap-2 shadow-lg"
                >
                  Track My Report <Search size={20} />
                </Link>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 lg:gap-6">
              {publicStats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 shadow-xl border border-border hover:-translate-y-1 transition-transform"
                >
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
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-text mb-4">
              Quick Access
            </h2>
            <p className="text-muted max-w-2xl mx-auto text-lg">
              Get started with the system's key features
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickAccessItems.map((item, index) => {
              const Icon = item.icon
              return (
                <Link
                  key={index}
                  to={item.path}
                  className="group bg-white p-8 rounded-2xl border border-border shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
                >
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all border-2 border-primary/20 group-hover:border-primary">
                    <Icon size={32} className="text-primary group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-heading font-semibold text-xl mb-3 text-text">
                    {item.title}
                  </h3>
                  <p className="text-muted">{item.description}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
                About LEIRS
              </div>
              <h2 className="font-heading text-3xl lg:text-4xl font-bold text-text mb-6">
                Digitizing Barangay Incident Reporting
              </h2>
              <p className="text-muted text-lg leading-relaxed mb-6">
                The Law Enforcement and Incident Reporting System (LEIRS) digitizes Barangay 178's traditional paper-based incident reporting process.
              </p>
              <p className="text-muted leading-relaxed mb-6">
                Our system streamlines the entire workflow from incident submission to case resolution, making it more efficient, transparent, and accessible for both barangay staff and residents.
              </p>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all"
              >
                Learn More <ArrowRight size={18} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Paperless Process', icon: FileText },
                { label: 'Real-time Updates', icon: Clock },
                { label: 'Secure Storage', icon: ShieldAlert },
                { label: 'Data Analytics', icon: BarChart3 }
              ].map((item, idx) => {
                const Icon = item.icon
                return (
                  <div
                    key={idx}
                    className="bg-background p-6 rounded-2xl border border-border shadow-sm"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                      <Icon size={20} className="text-primary" />
                    </div>
                    <h4 className="font-heading font-semibold text-text text-sm">{item.label}</h4>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
