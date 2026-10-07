import { Link } from 'react-router-dom'
import { FiArrowLeft, FiShield, FiLock, FiDatabase, FiEyeOff, FiMail } from 'react-icons/fi'
import logo from '../assets/logo-drive.png'
import Footer from '../components/layout/Footer'

function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col justify-between selection:bg-[#2AABEE]/30 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={logo} alt="UniDrive logo" className="h-9 w-9 object-contain" />
            <span className="font-bold text-lg tracking-wide text-white group-hover:text-[#2AABEE] transition-colors">
              UniDrive
            </span>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 transition-all hover:border-[#2AABEE]/50 hover:bg-[#2AABEE]/10 hover:text-white"
          >
            <FiArrowLeft className="text-sm" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-4xl px-6 py-16 flex-1">
        {/* Title & Badge */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2AABEE]/30 bg-[#2AABEE]/10 px-3 py-1 text-xs font-semibold text-[#2AABEE] mb-4">
            <FiShield />
            Privacy & Data Protection
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-white/40">
            Last Updated: March 2026 &middot; Effective Date: March 2026
          </p>
        </div>

        {/* Highlight Card: Google API Compliance */}
        <div className="mb-12 rounded-2xl border border-[#2AABEE]/30 bg-gradient-to-br from-[#2AABEE]/10 via-[#0a0a0a] to-[#0a0a0a] p-6 md:p-8 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-[#2AABEE]/20 p-3 text-[#2AABEE] shrink-0 mt-1">
              <FiLock size={24} />
            </div>
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white">
                Google API Services User Data Policy Compliance
              </h2>
              <p className="text-sm text-white/80 leading-relaxed">
                UniDrive's use and transfer to any other app of information received from Google APIs
                will adhere to the{' '}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#2AABEE] underline underline-offset-4 hover:text-[#58c0f5]"
                >
                  Google API Services User Data Policy
                </a>
                , including the <strong>Limited Use</strong> requirements.
              </p>
              <p className="text-xs text-white/50 leading-relaxed">
                We never transfer or disclose your Google user data to third parties for advertising,
                marketing, or generalized artificial intelligence (AI) / machine learning (ML) model training.
              </p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-12 text-sm leading-relaxed text-white/70">
          {/* Section 1 */}
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-[#2AABEE]">1.</span> Overview
            </h3>
            <p>
              UniDrive ("we", "us", or "our") provides a unified cloud storage management platform accessible
              via <strong className="text-white">unidrive.dharmik.engineer</strong>. UniDrive enables users to view,
              organize, and manage files across multiple cloud storage providers (such as Google Drive, OneDrive, and Dropbox)
              from a single centralized interface.
            </p>
            <p>
              We are committed to protecting your privacy and being transparent about our data handling practices.
              This Privacy Policy explains what information we collect, how it is used and secured, and your rights.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-[#2AABEE]">2.</span> Information We Collect
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <FiShield className="text-[#2AABEE]" />
                  <span>Account Information</span>
                </div>
                <p className="text-xs text-white/60">
                  When you authenticate via Google or register with email, we collect your name, email address,
                  and profile picture to identify your UniDrive profile.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <FiLock className="text-[#2AABEE]" />
                  <span>OAuth Credentials</span>
                </div>
                <p className="text-xs text-white/60">
                  When you connect Google Drive or other providers, we receive OAuth access and refresh tokens.
                  All tokens are encrypted at rest using industry-standard cryptography before storage.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <FiDatabase className="text-[#2AABEE]" />
                  <span>File Metadata</span>
                </div>
                <p className="text-xs text-white/60">
                  We retrieve metadata such as file names, sizes, MIME types, modification dates, and folder IDs
                  to display your files inside your personal dashboard.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <FiEyeOff className="text-[#2AABEE]" />
                  <span>No File Content Stored</span>
                </div>
                <p className="text-xs text-white/60">
                  UniDrive does <strong className="text-white">not</strong> store, replicate, or host your file contents
                  on our servers. File transfers and previews are streamed directly on your request.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-[#2AABEE]">3.</span> How We Use Your Information
            </h3>
            <p>Your information is used strictly to provide and improve the UniDrive services:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-white/60 text-xs md:text-sm">
              <li>Authenticate your account and maintain secure authenticated sessions.</li>
              <li>Connect and manage your authorized third-party cloud storage accounts.</li>
              <li>Display unified storage metrics, folder structures, and file listings.</li>
              <li>Execute user-initiated operations (e.g., viewing, uploading, renaming, or downloading files).</li>
              <li>Prevent unauthorized access and protect against security incidents.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-[#2AABEE]">4.</span> Data Security & Encryption
            </h3>
            <p>
              We implement robust technical and organizational security measures to protect your information:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-white/60 text-xs md:text-sm">
              <li>
                <strong className="text-white">Encryption at Rest:</strong> All OAuth tokens and refresh tokens are encrypted using AES encryption before being saved to Firebase Firestore.
              </li>
              <li>
                <strong className="text-white">Encryption in Transit:</strong> All communications between your browser, our servers, and Google APIs are secured with HTTPS / TLS 1.3 encryption.
              </li>
              <li>
                <strong className="text-white">Secure Sessions:</strong> Sessions use signed cryptographic JWT tokens and HTTP-only, SameSite cookies.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-[#2AABEE]">5.</span> Data Sharing & Third-Party Disclosure
            </h3>
            <p>
              We do <strong className="text-white">not sell, rent, trade, or monetize</strong> your personal data or cloud drive data under any circumstances.
            </p>
            <p>
              We do not share your information with third parties except:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-white/60 text-xs md:text-sm">
              <li>With your authorized storage providers (e.g., Google) to execute your requested file operations.</li>
              <li>With essential infrastructure providers (e.g., Firebase, Vercel) necessary to host and run the application.</li>
              <li>When required by law, subpoena, or valid legal process.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-[#2AABEE]">6.</span> Data Retention & Your Rights
            </h3>
            <p>
              You maintain full ownership and control over your data:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-white/60 text-xs md:text-sm">
              <li>
                <strong className="text-white">Disconnecting Accounts:</strong> You can disconnect any connected Google Drive account at any time from your Dashboard, which immediately purges the associated OAuth tokens from our database.
              </li>
              <li>
                <strong className="text-white">Account Deletion:</strong> You can request full deletion of your UniDrive account and associated records by contacting us.
              </li>
              <li>
                <strong className="text-white">Revoking Google Permissions:</strong> You can revoke UniDrive's access directly from Google at any time by visiting{' '}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#2AABEE] underline underline-offset-4 hover:text-[#58c0f5]"
                >
                  Google Account Security Settings
                </a>.
              </li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-[#2AABEE]">7.</span> Contact Us
            </h3>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please contact us:
            </p>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-white">
              <div className="rounded-lg bg-[#2AABEE]/20 p-2.5 text-[#2AABEE]">
                <FiMail size={18} />
              </div>
              <div>
                <div className="text-xs text-white/50">Email Support</div>
                <a
                  href="mailto:connect@dharmik.live"
                  className="font-medium text-white hover:text-[#2AABEE] transition-colors"
                >
                  connect@dharmik.live
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default PrivacyPolicy
