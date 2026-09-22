import React from 'react'
import { Link } from 'react-router-dom'
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldAlert,
  AlertCircle,
  ArrowRight
} from 'lucide-react'

const Contact = () => {
  const contactMethods = [
    {
      icon: Phone,
      title: 'Emergency Hotline',
      details: ['911 (National Emergency)', '(02) 123-4567 (Barangay Hall)'],
      note: 'Available 24/7 for emergencies'
    },
    {
      icon: Mail,
      title: 'Email',
      details: ['brgy178camarin@example.com', 'leirs.support@example.com'],
      note: 'Response within 24-48 hours'
    },
    {
      icon: MapPin,
      title: 'Address',
      details: ['Barangay 178', 'Camarin, North Caloocan City', 'Metro Manila, Philippines'],
      note: 'Visit us during office hours'
    }
  ]

  const officeHours = [
    { day: 'Monday - Friday', hours: '8:00 AM - 5:00 PM' },
    { day: 'Saturday', hours: '8:00 AM - 12:00 PM' },
    { day: 'Sunday & Holidays', hours: 'Closed (Emergency hotline available)' }
  ]

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-heading text-4xl lg:text-5xl font-bold text-text mb-6">
              Contact Us
            </h1>
            <p className="text-lg text-muted leading-relaxed">
              Get in touch with Barangay 178. We're here to help with your incident reports and inquiries.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {contactMethods.map((method, index) => {
              const Icon = method.icon
              return (
                <div
                  key={index}
                  className="bg-background p-8 rounded-2xl border border-border shadow-sm"
                >
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                    <Icon size={28} className="text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-xl mb-4 text-text">
                    {method.title}
                  </h3>
                  <div className="space-y-2 mb-4">
                    {method.details.map((detail, idx) => (
                      <p key={idx} className="text-text font-medium">
                        {detail}
                      </p>
                    ))}
                  </div>
                  <p className="text-sm text-muted">{method.note}</p>
                </div>
              )
            })}
          </div>

          {/* Office Hours */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-background p-8 rounded-2xl border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Clock size={24} className="text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-xl text-text">Office Hours</h3>
              </div>
              <div className="space-y-3">
                {officeHours.map((schedule, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3 border-b border-border last:border-0"
                  >
                    <span className="text-text font-medium">{schedule.day}</span>
                    <span className="text-muted">{schedule.hours}</span>
                  </div>
                ))}
              </div>
            </div>
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
                    If you are experiencing an emergency situation that requires immediate attention, please call <strong>911</strong> or contact the barangay emergency hotline at <strong>(02) 123-4567</strong> immediately.
                  </p>
                  <p className="text-sm text-red-600">
                    Do not rely solely on the online reporting system for urgent matters requiring immediate response.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Map */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold text-text mb-4">Location</h2>
            <p className="text-muted">Visit us at the Barangay 178 Hall</p>
          </div>

          <div className="bg-background rounded-2xl border border-border overflow-hidden shadow-lg">
            <div className="aspect-[16/9] relative">
              <iframe
                src="https://www.google.com/maps?q=New+Barangay+178+Hall+6466+Caimito+Caloocan+Metro+Manila&output=embed&z=17"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="New Barangay 178 Hall Location"
                className="absolute inset-0"
              ></iframe>
            </div>
            <div className="bg-white px-6 py-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <MapPin size={20} className="text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-text font-semibold">New Barangay 178 Hall</p>
                    <p className="text-sm text-muted">6466 Caimito, Caloocan, Metro Manila</p>
                  </div>
                </div>
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=New+Barangay+178+Hall+6466+Caimito+Caloocan+Metro+Manila"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primaryDark transition-colors text-sm whitespace-nowrap"
                >
                  <ArrowRight size={16} />
                  Get Directions
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold text-text mb-4">Need to Report an Incident?</h2>
            
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Link
              to="/report"
              className="group bg-white p-8 rounded-2xl border border-border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                <ShieldAlert size={28} className="text-primary group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-3 text-text">Report Incident</h3>
              <p className="text-muted mb-4">Submit a new incident report and receive a tracking number.</p>
              <div className="flex items-center gap-2 text-primary font-medium">
                <span>Submit Report</span>
                <ArrowRight size={18} />
              </div>
            </Link>

            <Link
              to="/track"
              className="group bg-white p-8 rounded-2xl border border-border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                <Clock size={28} className="text-primary group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-3 text-text">Track Report</h3>
              <p className="text-muted mb-4">Check the status of your existing incident report.</p>
              <div className="flex items-center gap-2 text-primary font-medium">
                <span>Track Status</span>
                <ArrowRight size={18} />
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Contact
