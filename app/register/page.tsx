'use client'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import IdCardScanner, { IdCardData } from '@/components/IdCardScanner'

function RegisterForm() {
  const { t, dir, lang } = useLanguage()
  const { refresh } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const typeParam = searchParams.get('type') || ''

  const [type, setType] = useState<'employer' | 'jobseeker'>(typeParam === 'employer' ? 'employer' : 'jobseeker')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  // Job seeker fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [jobseekerPhone, setJobseekerPhone] = useState('')
  const [vnr, setVnr] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [nationality, setNationality] = useState('')
  const [docNumber, setDocNumber] = useState('')
  const [docValidUntil, setDocValidUntil] = useState('')
  // Employer fields
  const [companyName, setCompanyName] = useState('')
  const [kvkNumber, setKvkNumber] = useState('')
  const [orgType, setOrgType] = useState('enterprise')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')

  const [agreeCheck, setAgreeCheck] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleScanned(data: IdCardData) {
    if (data.firstName) setFirstName(data.firstName)
    if (data.lastName) setLastName(data.lastName)
    if (data.dateOfBirth) setDateOfBirth(data.dateOfBirth)
    if (data.nationality) setNationality(data.nationality)
    if (data.backDocNumber || data.frontDocNumber) setDocNumber(data.backDocNumber || data.frontDocNumber || '')
    if (data.validUntil) setDocValidUntil(data.validUntil)
    if (data.vnr) setVnr(data.vnr)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (type === 'jobseeker' && !vnr) { setError('Please enter your V-nummer'); return }
    if (type === 'employer' && password !== confirmPassword) { setError('Passwords do not match'); return }
    if (type === 'employer' && !agreeCheck) { setError('Please confirm the background check'); return }

    const effectivePassword = type === 'jobseeker' ? vnr : password

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, password: effectivePassword, role: type, language: lang,
          companyName, kvkNumber, orgType, address, phone, website,
          name: [firstName, lastName].filter(Boolean).join(' ') || null,
          jobseekerPhone, vnr, dateOfBirth, nationality, docNumber, docValidUntil,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        await refresh()
        router.push('/dashboard')
      } else {
        setError(data.error || t('error'))
      }
    } catch {
      setError('Could not reach the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir={dir} className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg animate-fadeIn">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">{t('registerTitle')}</h1>

          <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setType('jobseeker')}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors ${type === 'jobseeker' ? 'bg-orange-500 text-white shadow' : 'text-gray-600 hover:text-gray-800'}`}
            >
              👤 {t('lookingForJob')}
            </button>
            <button
              type="button"
              onClick={() => setType('employer')}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors ${type === 'employer' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:text-gray-800'}`}
            >
              🏢 {t('registerEmployer')}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {type === 'jobseeker' && (
              <div className="flex flex-col gap-3">
                <h2 className="text-xl font-bold text-gray-800">Upload your W-Document</h2>
                <img src="/id.jpg" alt="W-Document example" className="w-1/3 rounded-xl object-cover self-center" />
                <IdCardScanner onScanned={handleScanned} compact />
              </div>
            )}

            <Field label={t('email')} type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />
            {type === 'employer' && (
              <>
                <Field label={t('password')} type="password" value={password} onChange={setPassword} required />
                <Field label={t('confirmPassword')} type="password" value={confirmPassword} onChange={setConfirmPassword} required />
              </>
            )}

            {type === 'jobseeker' && (
              <div className="border-t pt-4 mt-2 flex flex-col gap-4 bg-gray-50 rounded-xl px-4 pb-4">
                <Field label="V-nummer" value={vnr} onChange={setVnr} placeholder="10-digit V-NR" required />
                {(firstName || lastName) && (
                  <div className="flex gap-3">
                    <div className="flex-1"><Field label="First name" value={firstName} onChange={setFirstName} /></div>
                    <div className="flex-1"><Field label="Last name" value={lastName} onChange={setLastName} /></div>
                  </div>
                )}
                <Field label={`${t('phoneNumber')} (${t('phonePrivateNote')})`} type="tel" value={jobseekerPhone} onChange={setJobseekerPhone} />
              </div>
            )}

            {type === 'employer' && (
              <>
                <div className="border-t pt-4 mt-2">
                  <p className="text-sm font-semibold text-gray-600 mb-4">{t('registerEmployerTitle')}</p>
                  <div className="flex flex-col gap-4">
                    <Field label={t('companyName')} value={companyName} onChange={setCompanyName} required />
                    <Field label={t('kvkNumber')} value={kvkNumber} onChange={setKvkNumber} placeholder="e.g. 12345678" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('orgType')}</label>
                      <select
                        value={orgType}
                        onChange={e => setOrgType(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        <option value="enterprise">{t('orgTypeEnterprise')}</option>
                        <option value="nonprofit">{t('orgTypeNonprofit')}</option>
                        <option value="anbi">{t('orgTypeAnbi')}</option>
                        <option value="sports">{t('orgTypeSports')}</option>
                      </select>
                    </div>
                    <Field label={t('companyAddress')} value={address} onChange={setAddress} />
                    <Field label={t('companyPhone')} value={phone} onChange={setPhone} />
                    <Field label={t('companyWebsite')} value={website} onChange={setWebsite} placeholder="https://" />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-2">
                  <p className="text-sm font-semibold text-blue-800 mb-1">{t('backgroundCheck')}</p>
                  <p className="text-xs text-blue-600 mb-3">{t('backgroundCheckNote')}</p>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={agreeCheck} onChange={e => setAgreeCheck(e.target.checked)} className="mt-0.5 accent-blue-600" />
                    <span className="text-xs text-blue-700">{t('backgroundCheckNote')}</span>
                  </label>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold transition-colors disabled:opacity-60 mt-2 ${type === 'employer' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
            >
              {loading ? t('loading') : t('register')}
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-6">
            {t('haveAccount')}{' '}
            <Link href="/login" className="text-orange-500 font-semibold hover:underline">{t('login')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder, required }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
