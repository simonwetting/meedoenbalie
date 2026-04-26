'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

type Job = {
  id: string
  title: string
  description: string
  requirements: string | null
  location: string | null
  hoursPerWeek: number | null
  shifts: string | null
  salaryMin: number | null
  salaryMax: number | null
  category: string | null
  jobType: string
  createdAt: string
  employer: { id: string; companyName: string; verified: boolean; logo: string | null; description: string | null; orgType: string | null; userId: string }
  _count: { applications: number }
}

type Review = {
  id: string
  rating: number
  comment: string
  createdAt: string
  from: { id: string; role: string; jobSeekerProfile: { name: string | null } | null }
}

export default function JobDetailPage() {
  const { id } = useParams() as { id: string }
  const { user } = useAuth()
  const { t, dir } = useLanguage()

  const STAGE_INFO = [
    { key: 'applied', labelKey: 'stageApplied', color: 'bg-gray-100 text-gray-600', icon: '📋' },
    { key: 'intake', labelKey: 'stageIntake', color: 'bg-blue-100 text-blue-700', icon: '🗣️' },
    { key: 'trialDay', labelKey: 'stageTrialDay', color: 'bg-yellow-100 text-yellow-700', icon: '☀️' },
    { key: 'trialPeriod', labelKey: 'stageTrialPeriod', color: 'bg-orange-100 text-orange-700', icon: '📅' },
    { key: 'contract', labelKey: 'stageContracted', color: 'bg-green-100 text-green-700', icon: '✅' },
  ]
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [error, setError] = useState('')
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState(false)

  useEffect(() => {
    fetch(`/api/jobs/${id}`).then(r => r.json()).then(data => {
      if (data.error) router.push('/jobs')
      else {
        setJob(data)
        fetch(`/api/reviews?toUserId=${data.employer.userId}`)
          .then(r => r.json()).then(setReviews)
      }
      setLoading(false)
    })
  }, [id, router])

  useEffect(() => {
    if (!user || user.role !== 'jobseeker') return
    fetch('/api/applications').then(r => r.json()).then(data => {
      if (Array.isArray(data) && data.some((a: { jobListing: { id: string } }) => a.jobListing?.id === id)) {
        setApplied(true)
      }
    })
  }, [user, id])

  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!job) return
    setSubmittingReview(true)
    setReviewError('')
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toUserId: job.employer.userId, rating: reviewRating, comment: reviewComment }),
    })
    setSubmittingReview(false)
    if (res.ok) {
      const newReview = await res.json()
      setReviews(prev => [{ ...newReview, from: { id: user!.id, role: user!.role, jobSeekerProfile: null } }, ...prev])
      setReviewSuccess(true)
      setReviewComment('')
    } else {
      const data = await res.json()
      setReviewError(data.error || t('error'))
    }
  }

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null

  async function applyForJob() {
    if (!user) { router.push('/login'); return }
    if (user.role !== 'jobseeker') return

    setApplying(true)
    const res = await fetch(`/api/jobs/${id}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coverLetter }),
    })
    setApplying(false)
    if (res.ok) {
      setApplied(true)
      setShowApplyForm(false)
    } else {
      const data = await res.json()
      setError(data.error || t('error'))
    }
  }

  if (loading) return (
    <div dir={dir} className="min-h-screen flex flex-col"><Navbar />
      <div className="flex-1 flex items-center justify-center text-gray-400">{t('loading')}</div>
    </div>
  )

  if (!job) return null

  const requirements = job.requirements ? JSON.parse(job.requirements) : []
  const shifts = job.shifts ? JSON.parse(job.shifts) : []

  return (
    <div dir={dir} className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10 w-full">
        <Link href="/jobs" className="text-orange-500 hover:underline text-sm mb-6 inline-block">← {t('backToJobs')}</Link>

        <div className="bg-white rounded-2xl shadow p-8 mb-6">
          <div className="flex items-start gap-4 mb-6">
            {job.employer.logo && <img src={job.employer.logo} alt={job.employer.companyName} className="w-16 h-16 rounded-xl object-cover" />}
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-2">
                {job.employer.verified && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ {t('verifiedBadge')}</span>}
                {job.jobType === 'volunteer'
                  ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">🤝 {t('jobTypeVolunteer')}</span>
                  : job.jobType === 'ervaringswerkplek'
                  ? <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">🌱 {t('jobTypeErvaringswerkplek')}</span>
                  : <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">💼 {t('jobTypeRegular')}</span>
                }
                {job.category && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{job.category}</span>}
              </div>
              <h1 className="text-3xl font-bold text-gray-800">{job.title}</h1>
              <Link href={`/employer/${job.employer.id}`} className="text-blue-600 font-medium hover:underline mt-1 inline-block">{job.employer.companyName}</Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6 border-y border-gray-100 py-4">
            {job.location && <span className="flex items-center gap-1">📍 {job.location}</span>}
            {job.hoursPerWeek && <span className="flex items-center gap-1">⏱️ {job.hoursPerWeek} hrs/week</span>}
            {(job.salaryMin || job.salaryMax) && <span className="flex items-center gap-1">💶 €{job.salaryMin}–€{job.salaryMax}/hr</span>}
            {shifts.length > 0 && <span className="flex items-center gap-1">🌙 {shifts.join(', ')}</span>}
            <span className="flex items-center gap-1">👥 {job._count.applications} applicants</span>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3">{t('jobDescription')}</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>

          {requirements.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-3">{t('requirements')}</h2>
              <ul className="space-y-2">
                {requirements.map((req: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-gray-600 text-sm">
                    <span className="text-orange-500 mt-0.5">•</span> {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{t('applicationStages')}</h2>
            <div className="flex flex-wrap gap-2">
              {STAGE_INFO.map(s => (
                <span key={s.key} className={`text-sm px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 ${s.color}`}>
                  {s.icon} {t(s.labelKey)}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">{t('volunteerNote')}</p>
          </div>

          {error && <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

          {applied ? (
            <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl text-center font-semibold">
              ✅ {t('applicationSubmittedMsg')}
            </div>
          ) : user?.role === 'jobseeker' ? (
            showApplyForm ? (
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="font-bold text-gray-800 mb-3">{t('coverLetter')}</h3>
                <textarea
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value)}
                  rows={5}
                  placeholder={t('coverLetterPlaceholder')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
                <div className="flex gap-3 mt-4">
                  <button onClick={applyForJob} disabled={applying} className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-60">
                    {applying ? t('loading') : t('applyCta')}
                  </button>
                  <button onClick={() => setShowApplyForm(false)} className="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                    {t('cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowApplyForm(true)} className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors">
                {t('applyNow')} →
              </button>
            )
          ) : !user ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
              <p className="text-blue-700 font-medium mb-3">{t('loginToApply')}</p>
              <div className="flex gap-3 justify-center">
                <Link href="/login" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700">{t('login')}</Link>
                <Link href="/register?type=jobseeker" className="border border-blue-300 text-blue-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-50">{t('register')}</Link>
              </div>
            </div>
          ) : null}
        </div>

        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="font-bold text-gray-800 mb-3">{t('companyProfile')}</h2>
          <Link href={`/employer/${job.employer.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {job.employer.logo && <img src={job.employer.logo} alt="" className="w-12 h-12 rounded-lg object-cover" />}
            <div>
              <p className="font-semibold text-gray-800">{job.employer.companyName}</p>
              {job.employer.description && <p className="text-gray-500 text-sm line-clamp-2">{job.employer.description}</p>}
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-800 text-lg">Reviews for {job.employer.companyName}</h2>
              {avgRating !== null && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex text-yellow-400">
                    {[1,2,3,4,5].map(s => <span key={s}>{s <= Math.round(avgRating) ? '★' : '☆'}</span>)}
                  </div>
                  <span className="text-gray-600 font-semibold">{avgRating.toFixed(1)}</span>
                  <span className="text-gray-400 text-sm">({reviews.length} {t('reviews').toLowerCase()})</span>
                </div>
              )}
            </div>
            <Link href={`/employer/${job.employer.id}/reviews`} className="text-orange-500 text-sm hover:underline">{t('viewAll')}</Link>
          </div>

          {user && user.id !== job.employer.userId && !reviewSuccess && (
            <div className="border border-gray-200 rounded-xl p-5 mb-6 bg-gray-50">
              <h3 className="font-semibold text-gray-800 mb-3">{t('writeReview')}</h3>
              {reviewError && <div className="bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-lg text-sm mb-3">{reviewError}</div>}
              <form onSubmit={submitReview} className="flex flex-col gap-3">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => (
                    <button type="button" key={s} onClick={() => setReviewRating(s)}
                      className={`text-3xl transition-colors ${s <= reviewRating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}>★</button>
                  ))}
                </div>
                <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} required rows={3}
                  placeholder="Share your experience with this employer..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
                <button type="submit" disabled={submittingReview}
                  className="bg-orange-500 text-white py-2.5 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-60 text-sm">
                  {submittingReview ? t('loading') : t('submit')}
                </button>
              </form>
            </div>
          )}

          {reviewSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm text-center mb-6">✅ Review submitted!</div>
          )}

          {!user && (
            <div className="text-center py-3 mb-4">
              <Link href="/login" className="text-orange-500 hover:underline text-sm">{t('login')} to leave a review</Link>
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">{t('noReviews')}</p>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.map(r => (
                <div key={r.id} className="border-t border-gray-100 pt-4 first:border-0 first:pt-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex text-yellow-400 text-sm">
                      {[1,2,3,4,5].map(s => <span key={s}>{s <= r.rating ? '★' : '☆'}</span>)}
                    </div>
                    <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-sm">{r.comment}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    — {r.from.role === 'jobseeker' ? (r.from.jobSeekerProfile?.name || 'Job seeker') : 'Employer'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
