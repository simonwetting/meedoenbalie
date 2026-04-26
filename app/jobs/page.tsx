'use client'
import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

const CATEGORIES = ['All', 'Cleaning', 'Cooking', 'Construction', 'Retail', 'Logistics', 'Healthcare', 'IT', 'Administration', 'Hospitality', 'Agriculture', 'Other']

type Job = {
  id: string
  title: string
  description: string
  location: string | null
  hoursPerWeek: number | null
  salaryMin: number | null
  salaryMax: number | null
  category: string | null
  jobType: string
  createdAt: string
  employer: { companyName: string; verified: boolean; logo: string | null; userId: string; avgRating: number | null; reviewCount: number }
  _count: { applications: number }
}

export default function JobsPage() {
  const { t, dir } = useLanguage()
  const [jobs, setJobs] = useState<Job[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [jobType, setJobType] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (category && category !== 'All') params.set('category', category)
    if (jobType) params.set('jobType', jobType)
    setLoading(true)
    fetch(`/api/jobs?${params}`).then(r => r.json()).then(data => {
      setJobs(data)
      setLoading(false)
    })
  }, [search, category, jobType])

  return (
    <div dir={dir} className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{t('jobListings')}</h1>
            <p className="text-gray-500 mt-1">{jobs.length} available positions</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          >
            {CATEGORIES.map(c => <option key={c} value={c === 'All' ? '' : c}>{c}</option>)}
          </select>
        </div>

        <div className="flex gap-2 mb-8 flex-wrap">
          {[['', 'allJobTypes'], ['regular', 'jobTypeRegular'], ['volunteer', 'jobTypeVolunteer'], ['ervaringswerkplek', 'jobTypeErvaringswerkplek']].map(([val, key]) => (
            <button key={val} onClick={() => setJobType(val)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${jobType === val ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-300 text-gray-600 hover:border-orange-300'}`}>
              {val === 'volunteer' ? '🤝 ' : val === 'regular' ? '💼 ' : val === 'ervaringswerkplek' ? '🌱 ' : ''}{t(key)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-20">{t('loading')}</div>
        ) : jobs.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            <div className="text-4xl mb-3">🔍</div>
            <p>{t('noJobsFound')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {jobs.map(job => <JobCard key={job.id} job={job} t={t} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function JobCard({ job, t }: { job: Job; t: (k: string) => string }) {
  const timeAgo = (date: string) => {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
  }

  return (
    <Link href={`/jobs/${job.id}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-orange-200 transition-all group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {job.employer.verified && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Verified</span>}
            {job.jobType === 'volunteer'
              ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">🤝 {t('jobTypeVolunteer')}</span>
              : job.jobType === 'ervaringswerkplek'
              ? <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">🌱 {t('jobTypeErvaringswerkplek')}</span>
              : <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">💼 {t('jobTypeRegular')}</span>
            }
            {job.category && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{job.category}</span>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-gray-800 group-hover:text-orange-500 transition-colors">{job.title}</h2>
            {job.employer.avgRating !== null && (
              <span className="flex items-center gap-0.5 text-sm text-yellow-500 font-medium">
                {'★'.repeat(Math.round(job.employer.avgRating))}{'☆'.repeat(5 - Math.round(job.employer.avgRating))}
                <span className="text-gray-500 font-normal ml-1">{job.employer.avgRating.toFixed(1)}</span>
              </span>
            )}
          </div>
          <p className="text-gray-500 font-medium mt-0.5">{job.employer.companyName}</p>
          <p className="text-gray-600 text-sm mt-2 line-clamp-2">{job.description}</p>
          <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-500">
            {job.location && <span>📍 {job.location}</span>}
            {job.hoursPerWeek && <span>⏱️ {job.hoursPerWeek} {t('hoursWeek')}</span>}
            {(job.salaryMin || job.salaryMax) && (
              <span>💶 {job.salaryMin && `€${job.salaryMin}`}{job.salaryMin && job.salaryMax && '–'}{job.salaryMax && `€${job.salaryMax}`}/hr</span>
            )}
            <span>👥 {job._count.applications} applied</span>
            <span>🕐 {timeAgo(job.createdAt)}</span>
          </div>
        </div>
        <div className="flex-shrink-0">
          <span className="bg-orange-500 text-white text-sm px-4 py-2 rounded-lg font-medium group-hover:bg-orange-600 transition-colors">
            {t('applyNow')}
          </span>
        </div>
      </div>
    </Link>
  )
}
