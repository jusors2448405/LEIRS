import React from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldAlert,
  FileText,
  ClipboardList,
  Radio,
  Clock,
  BarChart3,
  Users,
  Target,
  Zap,
  Lock,
  ArrowRight
} from 'lucide-react'

const About = () => {
  const systemFeatures = [
    {
      icon: FileText,
      title: 'Incident Reporting',
      description: 'Digitally record and submit incident reports with automated tracking numbers and reference PINs.'
    },
    {
      icon: ClipboardList,
      title: 'Case Documentation',
      description: 'Maintain comprehensive case files with officer assignments, status updates, and detailed notes.'
    },
    {
      icon: Radio,
      title: 'Dispatch Coordination',
      description: 'Coordinate officer dispatch and response with real-time status tracking and priority management.'
    },
    {
      icon: ShieldAlert,
      title: 'Evidence Management',
      description: 'Securely store and manage digital evidence with proper chain of custody documentation.'
    },
    {
      icon: Clock,
      title: 'Case Monitoring',
      description: 'Monitor case status and progress with milestone tracking and automated status updates.'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'View incident trends, priority distributions, and comprehensive analytics dashboards.'
    }
  ]

  const systemBenefits = [
    {
      icon: Zap,
      title: 'Faster Processing',
      description: 'Automated workflows reduce manual data entry and speed up incident processing times.'
    },
    {
      icon: Lock,
      title: 'Secure & Compliant',
      description: 'Role-based access control and audit trails ensure data security and compliance.'
    },
    {
      icon: Users,
      title: 'Better Collaboration',
      description: 'Real-time updates enable seamless coordination between encoders, officers, and administrators.'
    },
    {
      icon: Target,
      title: 'Improved Transparency',
      description: 'Public tracking system allows complainants to monitor their report status independently.'
    }
  ]

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                <ShieldAlert className="text-white" size={36} />
              </div>
            </div>
            <h1 className="font-heading text-4xl lg:text-5xl font-bold text-text mb-6">
              About LEIRS
            </h1>
            <p className="text-lg text-muted leading-relaxed">
              The Law Enforcement and Incident Reporting System (LEIRS) is a comprehensive digital platform designed to modernize Barangay 178's incident reporting and case management processes.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
                Our Mission
              </div>
              <h2 className="font-heading text-3xl font-bold text-text mb-6">
                Digitizing Barangay Law Enforcement
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                LEIRS replaces Barangay 178's traditional paper-based incident reporting system with a modern, web-based platform that streamlines the entire workflow from incident submission to case resolution.
              </p>
              <p className="text-muted leading-relaxed mb-4">
                Our system enhances efficiency, improves transparency, and provides better service to the community by leveraging digital technologies for incident management.
              </p>
              <p className="text-muted leading-relaxed">
                By digitizing these critical processes, we empower barangay staff to focus on what matters most: serving and protecting the community.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {systemBenefits.map((benefit, index) => {
                const Icon = benefit.icon
                return (
                  <div
                    key={index}
                    className="bg-background p-6 rounded-2xl border border-border shadow-sm"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                      <Icon size={24} className="text-primary" />
                    </div>
                    <h4 className="font-heading font-semibold text-text mb-2">{benefit.title}</h4>
                    <p className="text-sm text-muted">{benefit.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* System Features */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl font-bold text-text mb-4">System Features</h2>
            <p className="text-muted max-w-2xl mx-auto">
              Comprehensive tools designed for modern barangay law enforcement and incident management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {systemFeatures.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="bg-white p-8 rounded-2xl border border-border shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primaryDark rounded-2xl flex items-center justify-center mb-6">
                    <Icon size={32} className="text-white" />
                  </div>
                  <h3 className="font-heading font-semibold text-xl mb-3 text-text">
                    {feature.title}
                  </h3>
                  <p className="text-muted">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* About LEIRS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl font-bold text-text mb-4">About LEIRS</h2>
            <p className="text-muted max-w-2xl mx-auto">
              Law Enforcement and Incident Reporting System for Brgy. 178 Camarin, North Caloocan City
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-background p-6 rounded-2xl border border-border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <FileText size={24} className="text-blue-600" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2 text-text">Incident Reporting</h3>
              <p className="text-sm text-muted">
                Recording and management of reported incidents.
              </p>
            </div>

            <div className="bg-background p-6 rounded-2xl border border-border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <ClipboardList size={24} className="text-green-600" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2 text-text">Case Management</h3>
              <p className="text-sm text-muted">
                Documentation and tracking of cases from incident reporting through resolution.
              </p>
            </div>

            <div className="bg-background p-6 rounded-2xl border border-border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Radio size={24} className="text-purple-600" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2 text-text">Law Enforcement Dispatch</h3>
              <p className="text-sm text-muted">
                Dispatch coordination and officer assignment for cases requiring response.
              </p>
            </div>

            <div className="bg-background p-6 rounded-2xl border border-border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 size={24} className="text-orange-600" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2 text-text">Data Analytics</h3>
              <p className="text-sm text-muted">
                Real-time and refresh-based analytics and reporting through Power BI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How LEIRS Works */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl font-bold text-text mb-4">How LEIRS Works</h2>
            <p className="text-muted max-w-2xl mx-auto">
              A streamlined workflow from incident reporting to data analysis
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-6 gap-4 items-center">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-white rounded-2xl border-2 border-primary flex items-center justify-center mb-3 shadow-sm">
                  <FileText size={32} className="text-primary" />
                </div>
                <p className="font-medium text-text text-sm">Report Incident</p>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex justify-center items-center">
                <ArrowRight size={24} className="text-muted" />
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-white rounded-2xl border-2 border-primary flex items-center justify-center mb-3 shadow-sm">
                  <ClipboardList size={32} className="text-primary" />
                </div>
                <p className="font-medium text-text text-sm">Document Case</p>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex justify-center items-center">
                <ArrowRight size={24} className="text-muted" />
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-white rounded-2xl border-2 border-primary flex items-center justify-center mb-3 shadow-sm">
                  <Radio size={32} className="text-primary" />
                </div>
                <p className="font-medium text-text text-sm">Dispatch</p>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex justify-center items-center">
                <ArrowRight size={24} className="text-muted" />
              </div>
            </div>

            <div className="grid md:grid-cols-6 gap-4 items-center mt-8">
              {/* Step 4 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-white rounded-2xl border-2 border-primary flex items-center justify-center mb-3 shadow-sm">
                  <ShieldAlert size={32} className="text-primary" />
                </div>
                <p className="font-medium text-text text-sm">Manage Evidence</p>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex justify-center items-center">
                <ArrowRight size={24} className="text-muted" />
              </div>

              {/* Step 5 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-white rounded-2xl border-2 border-primary flex items-center justify-center mb-3 shadow-sm">
                  <Clock size={32} className="text-primary" />
                </div>
                <p className="font-medium text-text text-sm">Monitor Status</p>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex justify-center items-center">
                <ArrowRight size={24} className="text-muted" />
              </div>

              {/* Step 6 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-white rounded-2xl border-2 border-primary flex items-center justify-center mb-3 shadow-sm">
                  <BarChart3 size={32} className="text-primary" />
                </div>
                <p className="font-medium text-text text-sm">Analyze Data</p>
              </div>

              {/* Empty space for alignment */}
              <div className="hidden md:block"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About
