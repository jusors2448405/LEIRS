import React from 'react'
import { Link } from 'react-router-dom'
import {
  Phone,
  MapPin,
  Clock,
  FileText,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Info,
  Building2
} from 'lucide-react'

const HowToReport = () => {
  const reportingSteps = [
    {
      number: '1',
      title: 'Contact the Barangay',
      description: 'Call the barangay hotline or visit the barangay office in person to report your incident.',
      icon: Phone
    },
    {
      number: '2',
      title: 'Provide Incident Details',
      description: 'Share relevant information about the incident with barangay personnel, including location, date, and description of what happened.',
      icon: FileText
    },
    {
      number: '3',
      title: 'Incident Encoding',
      description: 'Authorized barangay staff (encoder) will officially record your report into the LEIRS system.',
      icon: Building2
    },
    {
      number: '4',
      title: 'Receive Tracking Credentials',
      description: 'You will receive an Incident Number and a 6-digit Reference PIN to track your report online.',
      icon: CheckCircle
    }
  ]

  const contactOptions = [
    {
      icon: Phone,
      title: 'Barangay Hotline',
      details: 'Contact the Barangay Office',
      note: 'For non-emergency incident reporting'
    },
    {
      icon: Phone,
      title: 'Emergency Hotline',
      details: '911',
      note: 'For urgent situations requiring immediate response'
    },
    {
      icon: MapPin,
      title: 'Visit in Person',
      details: 'Barangay 178 Hall, Camarin, North Caloocan City',
      note: 'Office hours: Monday-Friday 8:00 AM - 5:00 PM'
    }
  ]

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-heading text-4xl lg:text-5xl font-bold text-text mb-6">
              How to Report an Incident
            </h1>
            <p className="text-lg text-muted leading-relaxed">
              Follow these steps to report an incident to Barangay 178 and receive tracking credentials.
            </p>
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Info size={28} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg text-blue-800 mb-2">
                    Official Reporting Process
                  </h3>
                  <p className="text-blue-700 leading-relaxed">
                    To ensure proper documentation and handling of your incident report, all reports must be submitted through authorized barangay personnel. Direct online submission is not available to maintain the integrity and accuracy of the reporting process.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reporting Steps */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl font-bold text-text mb-4">
              Reporting Process
            </h2>
            <p className="text-muted max-w-2xl mx-auto">
              Follow these steps to report an incident and track its status
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              {reportingSteps.map((step, index) => {
                const Icon = step.icon
                return (
                  <div
                    key={index}
                    className="bg-white p-8 rounded-2xl border border-border shadow-sm"
                  >
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                          <span className="text-white font-heading font-bold text-2xl">
                            {step.number}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Icon size={24} className="text-primary" />
                          <h3 className="font-heading font-semibold text-xl text-text">
                            {step.title}
                          </h3>
                        </div>
                        <p className="text-muted leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl font-bold text-text mb-4">
              How to Reach Us
            </h2>
            <p className="text-muted max-w-2xl mx-auto">
              Choose the best way to contact Barangay 178 to report your incident
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {contactOptions.map((option, index) => {
              const Icon = option.icon
              return (
                <div
                  key={index}
                  className="bg-background p-8 rounded-2xl border border-border shadow-sm"
                >
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                    <Icon size={28} className="text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-xl mb-4 text-text">
                    {option.title}
                  </h3>
                  <p className="text-text font-medium mb-2">{option.details}</p>
                  <p className="text-sm text-muted">{option.note}</p>
                </div>
              )
            })}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all"
            >
              View Full Contact Information <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Emergency Notice */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={28} className="text-red-600" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-xl text-red-800 mb-3">
                    For Emergencies
                  </h3>
                  <p className="text-red-700 leading-relaxed mb-4">
                    If you are experiencing an emergency situation that requires immediate attention, please call <strong>911</strong> immediately. Do not wait to visit the barangay office or use the tracking system for urgent matters.
                  </p>
                  <p className="text-sm text-red-600">
                    The LEIRS tracking system is for monitoring reported incidents, not for emergency response.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* After Reporting */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold text-text mb-4">
              After You Report
            </h2>
            <p className="text-muted max-w-2xl mx-auto">
              Once your incident is officially encoded, you can track its status online
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-background p-8 rounded-2xl border border-border">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <FileText size={28} className="text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-xl mb-3 text-text">
                  Track Your Report
                </h3>
                <p className="text-muted mb-6">
                  Use your Incident Number and Reference PIN to monitor the status of your report online.
                </p>
                <Link
                  to="/track"
                  className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all"
                >
                  Track My Report <ArrowRight size={18} />
                </Link>
              </div>

              <div className="bg-background p-8 rounded-2xl border border-border">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <Clock size={28} className="text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-xl mb-3 text-text">
                  Stay Updated
                </h3>
                <p className="text-muted mb-6">
                  Your report status will be updated as it progresses through investigation, mediation, and resolution.
                </p>
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all"
                >
                  Learn About the Process <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HowToReport
