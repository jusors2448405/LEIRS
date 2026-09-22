import React from 'react'
import { Shield, Lock, Eye, UserCheck, FileText, AlertCircle } from 'lucide-react'

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white border border-border rounded-2xl p-8 mb-8 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
              <Shield size={28} className="text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-text">Privacy Policy</h1>
              <p className="text-sm text-muted mt-1">
                Last Updated: {new Date().toLocaleDateString('en-PH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
          <p className="text-muted leading-relaxed">
            This Privacy Policy explains how the Law Enforcement and Incident Reporting System (LEIRS) 
            collects, uses, and protects information submitted through the system for Barangay 178, 
            Camarin, North Caloocan City.
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">Important Notice</p>
              <p className="text-sm text-blue-800 leading-relaxed">
                LEIRS is designed for official incident reporting and public safety purposes only. 
                This system is part of a college capstone project and should be used in accordance with 
                barangay guidelines and applicable laws.
              </p>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Section 1 */}
          <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText size={20} className="text-green-600" />
              </div>
              <h2 className="text-xl font-heading font-bold text-text">
                1. Information We Collect
              </h2>
            </div>
            <div className="space-y-4 text-sm text-text leading-relaxed">
              <p>
                When you submit an incident report or use LEIRS, we may collect the following information:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Complainant Information:</strong> Name, contact number, and address of the person 
                  reporting the incident
                </li>
                <li>
                  <strong>Incident Details:</strong> Type of incident, date and time, location, description, 
                  and any other relevant information about the reported incident
                </li>
                <li>
                  <strong>Supporting Documentation:</strong> Photos, videos, or documents uploaded as evidence 
                  related to the incident
                </li>
                <li>
                  <strong>System Data:</strong> Incident tracking numbers, report timestamps, and case status 
                  information
                </li>
                <li>
                  <strong>Staff Information:</strong> For authenticated users (barangay officers, encoders, and administrators),
                  we collect work email addresses and role information for access control
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye size={20} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-heading font-bold text-text">
                2. How We Use Your Information
              </h2>
            </div>
            <div className="space-y-4 text-sm text-text leading-relaxed">
              <p>The information collected through LEIRS is used for the following purposes:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Incident Processing:</strong> To receive, document, investigate, and resolve reported 
                  incidents within Barangay 178
                </li>
                <li>
                  <strong>Case Management:</strong> To assign officers, track case progress, update case statuses, 
                  and maintain case records
                </li>
                <li>
                  <strong>Communication:</strong> To contact complainants regarding their reports, provide updates, 
                  and request additional information if needed
                </li>
                <li>
                  <strong>Evidence Management:</strong> To store and organize evidence related to incident reports 
                  for investigation and resolution purposes
                </li>
                <li>
                  <strong>Analytics:</strong> To generate reports and statistics on incident trends for public 
                  safety planning and barangay decision-making (personal identifiable information is not included 
                  in aggregated statistics)
                </li>
                <li>
                  <strong>System Security:</strong> To maintain system integrity, prevent fraud, and ensure proper 
                  use of the reporting system
                </li>
              </ul>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Lock size={20} className="text-purple-600" />
              </div>
              <h2 className="text-xl font-heading font-bold text-text">
                3. Protection of Your Information
              </h2>
            </div>
            <div className="space-y-4 text-sm text-text leading-relaxed">
              <p>
                We implement appropriate security measures to protect the information stored in LEIRS:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Access Control:</strong> Only authorized barangay staff (officers, encoders, and 
                  administrators) have access to incident reports and complainant information
                </li>
                <li>
                  <strong>Role-Based Permissions:</strong> Staff can only access information necessary for their 
                  assigned roles and responsibilities
                </li>
                <li>
                  <strong>Secure Database:</strong> All incident data is stored in a secure database with 
                  encryption and access controls
                </li>
                <li>
                  <strong>Confidentiality:</strong> Staff members are expected to maintain confidentiality of 
                  complainant information and incident details
                </li>
                <li>
                  <strong>Physical Security:</strong> Access to the system and stored information is protected 
                  by appropriate physical and technical safeguards at Barangay 178 offices
                </li>
              </ul>
              <p className="text-xs text-muted mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <strong>Note:</strong> While we implement security measures to protect your information, no system 
                can guarantee absolute security. Please be mindful of the information you choose to include in 
                incident reports.
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <UserCheck size={20} className="text-orange-600" />
              </div>
              <h2 className="text-xl font-heading font-bold text-text">
                4. Authorized Use and Access
              </h2>
            </div>
            <div className="space-y-4 text-sm text-text leading-relaxed">
              <p>
                Access to incident information in LEIRS is limited to authorized personnel:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Barangay Officers:</strong> Assigned to investigate and resolve incidents. Officers can 
                  view cases assigned to them and add case updates
                </li>
                <li>
                  <strong>Encoders:</strong> Responsible for receiving and documenting incident reports. Encoders 
                  can create new incident records and manage case documentation
                </li>
                <li>
                  <strong>Administrators:</strong> Oversee the entire system, manage users, dispatch cases to 
                  officers, and monitor overall incident resolution
                </li>
              </ul>
              <p>
                Information is shared only as necessary for legitimate incident resolution and public safety 
                purposes. We do not sell, rent, or share your information with third parties for marketing purposes.
              </p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <FileText size={20} className="text-red-600" />
              </div>
              <h2 className="text-xl font-heading font-bold text-text">
                5. Data Retention
              </h2>
            </div>
            <div className="space-y-4 text-sm text-text leading-relaxed">
              <p>
                Incident reports and related information are retained in accordance with barangay record-keeping 
                requirements and applicable laws:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Active incident reports are maintained in the system until resolved and closed
                </li>
                <li>
                  Closed cases may be retained for record-keeping, statistical analysis, and reference purposes
                </li>
                <li>
                  Case updates and evidence are stored as part of the permanent incident record
                </li>
                <li>
                  Complainants may request information about their submitted reports by contacting Barangay 178 
                  directly
                </li>
              </ul>
            </div>
          </div>

          {/* Section 6 */}
          <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <Shield size={20} className="text-teal-600" />
              </div>
              <h2 className="text-xl font-heading font-bold text-text">
                6. Your Rights and Choices
              </h2>
            </div>
            <div className="space-y-4 text-sm text-text leading-relaxed">
              <p>As a complainant or system user, you have the following rights:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Access:</strong> You may request to review the incident report you submitted by using 
                  the "Track My Report" feature with your incident number and contact information
                </li>
                <li>
                  <strong>Correction:</strong> If you believe information in your report is inaccurate, you may 
                  contact Barangay 178 to request corrections
                </li>
                <li>
                  <strong>Questions:</strong> If you have questions about how your information is being used, 
                  contact the barangay office for clarification
                </li>
              </ul>
              <p>
                For assistance with your incident report or questions about this privacy policy, please contact 
                Barangay 178 Hall directly.
              </p>
            </div>
          </div>

          {/* Section 7 */}
          <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <AlertCircle size={20} className="text-gray-600" />
              </div>
              <h2 className="text-xl font-heading font-bold text-text">
                7. Changes to This Privacy Policy
              </h2>
            </div>
            <div className="space-y-4 text-sm text-text leading-relaxed">
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices or 
                applicable laws. The "Last Updated" date at the top of this policy indicates when it was most 
                recently revised.
              </p>
              <p>
                Continued use of LEIRS after policy updates constitutes acceptance of the revised policy.
              </p>
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-8">
            <h2 className="text-xl font-heading font-bold text-text mb-4">
              Contact Information
            </h2>
            <div className="space-y-3 text-sm text-text">
              <p>
                If you have questions, concerns, or requests regarding this Privacy Policy or how your information 
                is handled in LEIRS, please contact:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-border">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-text mb-1">Barangay 178 Hall</p>
                    <p className="text-muted text-xs">
                      Camarin, North Caloocan City<br />
                      Metro Manila, Philippines
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-border">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-text mb-1">Contact Details</p>
                    <p className="text-muted text-xs">
                      Phone: (02) 123-4567<br />
                      Email: brgy178@example.com
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:text-primaryDark font-medium transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy
