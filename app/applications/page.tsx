'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

const STAGE_CONFIGS = [
  { key: 'applied', labelKey: 'stageApplied', color: 'bg-gray-100 text-gray-600', icon: '📋' },
  { key: 'intake', labelKey: 'stageIntake', color: 'bg-blue-100 text-blue-700', icon: '🗣️' },
  { key: 'trialDay', labelKey: 'stageTrialDay', color: 'bg-yellow-100 text-yellow-700', icon: '☀️' },
  { key: 'trialPeriod', labelKey: 'stageTrialPeriod', color: 'bg-orange-100 text-orange-700', icon: '📅' },
  { key: 'contract', labelKey: 'stageContracted', color: 'bg-green-100 text-green-700', icon: '✅' },
  { key: 'hired', labelKey: 'stageHired', color: 'bg-green-200 text-green-800', icon: '🎉' },
  { key: 'rejected', labelKey: 'stageRejected', color: 'bg-red-100 text-red-600', icon: '❌' },
]

type Application = {
  id: string; stage: string; status: string; createdAt: string; coverLetter: string | null; notes: string | null
  jobListing: { id: string; title: string; location: string | null; category: string | null; employer: { companyName: string; id: string } }
  user?: { id: string; email: string; jobSeekerProfile: { id: string; name: string | null; picture: string | null; bio: string | null; age: number | null; phone: string | null } | null }
}

export default function ApplicationsPage() {
  const { user, loading } = useAuth()
  const { t, dir } = useLanguage()
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    fetch('/api/applications').then(r => r.json()).then(data => {
      setApplications(Array.isArray(data) ? data : [])
      setDataLoading(false)
    })
  }, [user])

  async function updateStage(appId: string, stage: string) {
    setUpdatingId(appId)
    const res = await fetch(`/api/applications/${appId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    })
    if (res.ok) {
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, stage, status: stage } : a))
    }
    setUpdatingId(null)
  }

  if (loading || !user) return (
    <div dir={dir} className="min-h-screen flex flex-col"><Navbar />
      <div className="flex-1 flex items-center justify-center text-gray-400">{t('loading')}</div>
    </div>
  )

  const stageInfo = (key: string) => STAGE_CONFIGS.find(s => s.key === key) || STAGE_CONFIGS[0]

  return (
    <div dir={dir} className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10 w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('myApplications')}</h1>

        {dataLoading ? (
          <div className="text-center text-gray-400 py-20">{t('loading')}</div>
        ) : applications.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-400">No applications yet</p>
            {user.role === 'jobseeker' && <Link href="/jobs" className="mt-4 inline-block text-orange-500 font-medium hover:underline">{t('findJobs')}</Link>}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {applications.map(app => {
              const stage = stageInfo(app.stage)
              const stageLabel = t(stage.labelKey)
              const stageIndex = STAGE_CONFIGS.findIndex(s => s.key === app.stage)

              return (
                <div key={app.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  {user.role === 'jobseeker' ? (
                    <>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <Link href={`/jobs/${app.jobListing.id}`} className="text-xl font-bold text-gray-800 hover:text-orange-500">{app.jobListing.title}</Link>
                          <Link href={`/employer/${app.jobListing.employer.id}`} className="text-gray-500 text-sm hover:text-blue-600 block mt-0.5">{app.jobListing.employer.companyName}</Link>
                          {app.jobListing.location && <p className="text-gray-400 text-xs mt-0.5">📍 {app.jobListing.location}</p>}
                        </div>
                        <span className={`text-sm px-3 py-1 rounded-full font-medium flex items-center gap-1 ${stage.color}`}>
                          {stage.icon} {stageLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 mb-3">
                        {STAGE_CONFIGS.filter(s => !['hired','rejected'].includes(s.key)).map((s, i) => (
                          <div key={s.key} className="flex items-center">
                            <div className={`w-2.5 h-2.5 rounded-full ${i <= stageIndex ? 'bg-orange-500' : 'bg-gray-200'}`} />
                            {i < 4 && <div className={`h-0.5 w-6 ${i < stageIndex ? 'bg-orange-500' : 'bg-gray-200'}`} />}
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-gray-400">Applied {new Date(app.createdAt).toLocaleDateString()}</p>
                      {app.notes && <p className="mt-2 text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-2">📝 {app.notes}</p>}
                    </>
                  ) : (
                    // Employer view
                    <div className="flex justify-between items-start">
                      <div>
                        <Link href={`/profile/${app.user?.jobSeekerProfile?.id}`} className="font-bold text-gray-800 hover:text-orange-500">
                          {app.user?.jobSeekerProfile?.name || app.user?.email}
                        </Link>
                        {app.user?.jobSeekerProfile?.phone && (
                          <p className="text-xs text-gray-500 mt-0.5">📞 {app.user.jobSeekerProfile.phone}</p>
                        )}
                        <p className="text-gray-500 text-sm mt-0.5">→ {app.jobListing.title}</p>
                        {app.user?.jobSeekerProfile?.bio && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{app.user.jobSeekerProfile.bio}</p>}
                        {app.coverLetter && <p className="text-xs text-gray-500 mt-1 italic line-clamp-2">"{app.coverLetter}"</p>}
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <span className={`text-sm px-3 py-1 rounded-full font-medium ${stage.color}`}>{stage.icon} {stageLabel}</span>
                        <select
                          value={app.stage}
                          onChange={e => updateStage(app.id, e.target.value)}
                          disabled={updatingId === app.id}
                          className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                        >
                          {STAGE_CONFIGS.map(s => <option key={s.key} value={s.key}>{s.icon} {t(s.labelKey)}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
