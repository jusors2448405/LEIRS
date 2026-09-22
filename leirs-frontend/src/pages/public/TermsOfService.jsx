import React from 'react'
import { FileText, AlertTriangle, CheckCircle, XCircle, Shield, Info } from 'lucide-react'

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white border border-border rounded-2xl p-8 mb-8 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
              <FileText size={28} className="text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-text">Terms of Service</h1>
              <p className="text-sm text-muted mt-1">
                Effective Date: {new Date().toLocaleDateString('en-PH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
          <p className="text-muted leading-relaxed">
            These Terms of Service govern your use of the Law Enforcement and Incident Reporting System (LEIRS) 
            for Barangay 178, Camarin, North Caloocan City. By accessing or using LEIRS, you agree to be bound 
            by these terms.
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-900 mb-1">Please Read Carefully</p>
              <p className="text-sm text-yellow-800 leading-relaxed">
                These terms are provided for informational purposes as part of a college capstone project. 
                LEIRS is designed for official incident reporting within Barangay 178. False or fraudulent reports 
                may result in legal consequences under applicable Philippine laws.
              </p>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Section 1 */}
          <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle size={20} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-heading font-bold text-text">
                1. Acceptance of Terms
              </h2>
            </div>
            <div className="space-y-4 text-sm text-text leading-relaxed">
              <p>
                By accessing or using LEIRS, whether as a complainant submitting an incident report or as 
                an authorized staff member (officer, encoder, or administrator), you acknowledge that you have 
                read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.
              </p>
              <p>
                If you do not agree with these terms, please do not use the system. For official incident reports, 
                you may contact Barangay 178 directly through alternative channels.
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield size={20} className="text-green-600" />
              </div>
              <h2 className="text-xl font-heading font-bold text-text">
                2. Proper Use of the System
              </h2>
            </div>
            <div className="space-y-4 text-sm text-text leading-relaxed">
              <p>LEIRS is provided for the following authorized purposes:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Incident Reporting:</strong> To report legitimate incidents, crimes, or public safety 
                  concerns occurring within Barangay 178
                </li>
                <li>
                  <strong>Case Management:</strong> For authorized staff to document, investigate, and resolve 
                  reported incidents
                </li>
                <li>
                  <strong>Case Tracking:</strong> For complainants to check the status of their submitted incident 
                  reports using the tracking feature
                </li>
                <li>
                  <strong>Public Safety:</strong> To support public safety efforts and maintain peace and order 
                  within the barangay
                </li>
              </ul>
              <p className="mt-4">
                You agree to use LEIRS only for its intended purposes and in compliance with all applicable 
                Philippine laws and barangay regulations.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle size={20} className="text-red-600" />
              </div>
              <h2 className="text-xl font-heading font-bold text-text">
                3. Prohibited Activities
              </h2>
            </div>
            <div className="space-y-4 text-sm text-text leading-relaxed">
              <p>
                The following activities are strictly prohibited when using LEIRS:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>False Reports:</strong> Submitting false, fraudulent, or misleading incident reports. 
                  Filing false reports may result in legal action under Philippine law
                </li>
                <li>
                  <strong>Malicious Use:</strong> Using the system to harass, defame, or harm individuals or groups
                </li>
                <li>
                  <strong>Unauthorized Access:</strong> Attempting to access incident reports, accounts, or system 
                  areas you are not authorized to view
                </li>
                <li>
                  <strong>System Abuse:</strong> Attempting to disrupt, damage, or interfere with the operation of 
                  LEIRS through hacking, malware, or other malicious activities
                </li>
                <li>
                  <strong>Information Misuse:</strong> Sharing, selling, or using information obtained through LEIRS 
                  for unauthorized purposes
                </li>
                <li>
                  <strong>Impersonation:</strong> Misrepresenting your identity or falsely claiming to be a barangay 
                  official or authorized staff member
                </li>
                <li>
                  <strong>Spam or Abuse:</strong> Submitting excessive, repetitive, or frivolous reports that waste 
                  system resources
                </li>
              </ul>
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> Violation of these prohibitions may result in denial of service, 
                  referral to law enforcement authorities, and potential legal consequences.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle size={20} className="text-purple-600" />
              </div>
              <h2 className="text-xl font-heading font-bold text-text">
                4. User Responsibilities
              </h2>
            </div>
            <div className="space-y-4 text-sm text-text leading-relaxed">
              <p>As a user of LEIRS, you are responsible for:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Accurate Information:</strong> Providing truthful, accurate, and complete information 
                  when submitting incident reports
                </li>
                <li>
                  <strong>Contact Details:</strong> Ensuring your contact information is correct so barangay 
                  officials can reach you regarding your report
                </li>
                <li>
                  <strong>Evidence:</strong> Submitting genuine evidence (photos, videos, documents) that 
                  accurately represents the reported incident
                </li>
                <li>
                  <strong>Tracking Information:</strong> Safeguarding your incident tracking number and contact 
                  information to prevent unauthorized access to your report status
                </li>
                <li>
                  <strong>Updates:</strong> Responding to requests for additional information or clarification 
                  from barangay officials in a timely manner
                </li>
                <li>
                  <strong>Cooperation:</strong> Cooperating with investigations and following up on your report 
                  as needed
                </li>
              </ul>
            </div>
          </div>

          {/* Section 5 */}
          <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Shield size={20} className="text-orange-600" />
              </div>
              <h2 className="text-xl font-heading font-bold text-text">
                5. Staff Responsibilities
              </h2>
            </div>
            <div className="space-y-4 text-sm text-text leading-relaxed">
              <p>
                Authorized staff members (officers, encoders, administrators) using LEIRS agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Confidentiality:</strong> Maintain confidentiality of complainant information and 
                  incident details
                </li>
                <li>
                  <strong>Professional Conduct:</strong> Use the system professionally and ethically in accordance 
                  with their assigned duties
                </li>
                <li>
                  <strong>Access Limits:</strong> Access only the information necessary for their role and assigned 
                  cases
                </li>
                <li>
                  <strong>Data Integrity:</strong> Ensure accurate documentation and timely updates of incident 
                  information
                </li>
                <li>
                  <strong>Account Security:</strong> Protect their login credentials and report any unauthorized 
                  access immediately
                </li>
                <li>
                  <strong>Compliance:</strong> Follow barangay policies, procedures, and applicable laws when 
                  handling incident reports
                </li>
              </ul>
            </div>
          </div>

          {/* Section 6 */}
          <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <FileText size={20} className="text-teal-600" />
              </div>
              <h2 className="text-xl font-heading font-bold text-text">
                6. Incident Report Handling
              </h2>
            </div>
            <div className="space-y-4 text-sm text-text leading-relaxed">
              <p>
                Regarding the processing of incident reports submitted through LEIRS:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Incident reports are reviewed and processed by authorized barangay staff
                </li>
                <li>
                  Response times may vary depending on the nature, priority, and complexity of the incident
                </li>
                <li>
                  You may track the status of your report using the incident tracking number provided
                </li>
                <li>
                  Barangay officials may contact you for additional information, clarification, or follow-up
                </li>
                <li>
                  Not all incidents may result in immediate resolution. Some cases may require referral to 
                  higher authorities or extended investigation
                </li>
                <li>
                  Case updates are provided based on the progress of the investigation and available information
                </li>
              </ul>
            </div>
          </div>

          {/* Section 7 */}
          <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Info size={20} className="text-indigo-600" />
              </div>
              <h2 className="text-xl font-heading font-bold text-text">
                7. System Availability and Maintenance
              </h2>
            </div>
            <div className="space-y-4 text-sm text-text leading-relaxed">
              <p>
                LEIRS is provided as-is for barangay incident reporting purposes. Please note:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  The system may be temporarily unavailable due to maintenance, updates, or technical issues
                </li>
                <li>
                  We strive to maintain system reliability, but cannot guarantee uninterrupted access at all times
                </li>
                <li>
                  In case of system downtime, alternative reporting channels are available at Barangay 178 Hall
                </li>
                <li>
                  System features and functionality may be updated or modified to improve service
                </li>
                <li>
                  Data backup procedures are in place, but users should maintain their own records of important 
                  information
                </li>
              </ul>
            </div>
          </div>

          {/* Section 8 */}
          <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <AlertTriangle size={20} className="text-gray-600" />
              </div>
              <h2 className="text-xl font-heading font-bold text-text">
                8. Limitation of Liability and Disclaimer
              </h2>
            </div>
            <div className="space-y-4 text-sm text-text leading-relaxed">
              <p>
                LEIRS is provided as part of a college capstone project and for barangay public safety purposes. 
                Please understand:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  This system is a tool to facilitate incident reporting and case management, but does not replace 
                  official law enforcement procedures
                </li>
                <li>
                  In emergency situations, please call 911 or contact local authorities directly rather than relying 
                  solely on this system
                </li>
                <li>
                  Barangay 178 and the system developers are not liable for delays, errors, or omissions in 
                  incident processing
                </li>
                <li>
                  The system is designed to assist barangay operations but cannot guarantee specific outcomes for 
                  individual cases
                </li>
                <li>
                  Information provided through LEIRS is for official barangay use and should not be considered 
                  legal advice
                </li>
              </ul>
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> LEIRS is not a substitute for emergency services. For life-threatening 
                  emergencies, always call 911 immediately.
                </p>
              </div>
            </div>
          </div>

          {/* Section 9 */}
          <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <FileText size={20} className="text-pink-600" />
              </div>
              <h2 className="text-xl font-heading font-bold text-text">
                9. Changes to Terms of Service
              </h2>
            </div>
            <div className="space-y-4 text-sm text-text leading-relaxed">
              <p>
                These Terms of Service may be updated periodically to reflect changes in system functionality, 
                barangay procedures, or applicable regulations.
              </p>
              <p>
                The "Effective Date" at the top of this document indicates when these terms were last revised. 
                Continued use of LEIRS after updates constitutes acceptance of the revised terms.
              </p>
              <p>
                Material changes to these terms will be communicated through appropriate channels within the system.
              </p>
            </div>
          </div>

          {/* Section 10 */}
          <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                <Info size={20} className="text-cyan-600" />
              </div>
              <h2 className="text-xl font-heading font-bold text-text">
                10. Governing Law
              </h2>
            </div>
            <div className="space-y-4 text-sm text-text leading-relaxed">
              <p>
                These Terms of Service and your use of LEIRS are governed by the laws of the Republic of the 
                Philippines and the applicable regulations of Caloocan City and Barangay 178.
              </p>
              <p>
                Any disputes or legal matters arising from the use of this system shall be resolved in accordance 
                with Philippine law and local jurisdiction.
              </p>
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-8">
            <h2 className="text-xl font-heading font-bold text-text mb-4">
              Questions or Concerns?
            </h2>
            <div className="space-y-3 text-sm text-text">
              <p>
                If you have questions about these Terms of Service or need assistance with LEIRS, please contact 
                Barangay 178:
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

export default TermsOfService
