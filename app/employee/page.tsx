'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export default function EmployeeDashboard() {
  const t = useTranslations()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [completeness, setCompleteness] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data } = await supabase
        .from('employee_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
        if (data.avatar_url) {
          const { data: signed } = supabase.storage.from('avatars').getPublicUrl(data.avatar_url)
          setAvatarUrl(signed.publicUrl || signed.signedUrl || '')
        }
        calculateCompleteness(data)
      }

      setLoading(false)
    }

    loadProfile()
  }, [router])

  const calculateCompleteness = (data: any) => {
    const fields = [
      data.bio,
      data.phone,
      data.highest_education,
      data.years_experience,
      data.employment_type,
      data.desired_position,
      data.availability,
      data.willing_to_relocate !== null,
    ]
    const completed = fields.filter(Boolean).length
    const percentage = (completed / fields.length) * 100
    setCompleteness(Math.round(percentage))
  }

  if (loading) {
    return <div>{t('common.loading')}</div>
  }

  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-primary to-accent rounded-lg p-8 text-primary-foreground flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('employee.title')}</h1>
          <p className="opacity-90">{t('landing.tagline')}</p>
        </div>
        {avatarUrl ? (
          <div className="w-20 h-20 rounded-full overflow-hidden bg-muted shadow-md">
            <Image src={avatarUrl} alt="avatar" width={80} height={80} className="object-cover" />
          </div>
        ) : null}
      </div>

      {/* Profile Status */}
      {!profile ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center space-y-4">
          <h2 className="text-xl font-semibold">{t('employee.noProfileYet')}</h2>
          <p className="text-muted-foreground">{t('employee.profileIncomplete')}</p>
          <Link href="/employee/profile">
            <Button size="lg">{t('nav.profile')}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Completeness Card */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold">{t('employee.profileCompleteness')}</h3>
            <div className="space-y-2">
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-accent h-3 rounded-full transition-all"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">{completeness}% {t('common.complete')}</p>
            </div>
            <Link href="/employee/profile" className="block">
              <Button variant="outline" className="w-full">
                {t('common.edit')}
              </Button>
            </Link>
          </div>

          {/* Quick Links */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold">{t('employee.experience')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('employee.addExperience')}
            </p>
            <Link href="/employee/profile?tab=experience" className="block">
              <Button variant="outline" className="w-full">
                {t('common.view')}
              </Button>
            </Link>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold">{t('nav.documents')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('documents.uploadDocument')}
            </p>
            <Link href="/employee/documents" className="block">
              <Button variant="outline" className="w-full">
                {t('common.view')}
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Profile Summary */}
      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold">{t('employee.personalInfo')}</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('employee.desiredPosition')}</dt>
                <dd className="font-medium">{profile.desired_position || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('employee.yearsExperience')}</dt>
                <dd className="font-medium">{profile.years_experience || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('employee.highestEducation')}</dt>
                <dd className="font-medium">{profile.highest_education || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('employee.employmentType')}</dt>
                <dd className="font-medium">{profile.employment_type || '—'}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold">{t('employee.jobPreferences')}</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('employee.availability')}</dt>
                <dd className="font-medium">{profile.availability || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('employee.willingToRelocate')}</dt>
                <dd className="font-medium">
                  {profile.willing_to_relocate ? t('common.yes') : t('common.no')}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('employee.preferredCities')}</dt>
                <dd className="font-medium">{profile.preferred_cities || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('employee.expectedSalaryMin')}</dt>
                <dd className="font-medium">{profile.expected_salary_min || '—'}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  )
}
