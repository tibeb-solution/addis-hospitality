'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export default function EmployeeProfilePage() {
  const t = useTranslations()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [tab, setTab] = useState('basic')

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      // Load employee profile
      const { data } = await supabase
        .from('employee_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Create if doesn't exist
      if (!data) {
        const { data: created } = await supabase
          .from('employee_profiles')
          .insert([{ id: user.id }])
          .select()
          .single()

        setProfile(created || { id: user.id })
      } else {
        setProfile(data)
        if (data.avatar_url) {
          const { data: signedUrl } = await supabase.storage
            .from('avatars')
            .getPublicUrl(data.avatar_url)
          setAvatarUrl(signedUrl.publicUrl)
        }
      }

      setLoading(false)
    }

    loadProfile()
  }, [router])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const fileName = `${user.id}/${Date.now()}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('employee_profiles')
        .update({ avatar_url: fileName })
        .eq('id', user.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.serverError'))
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !profile) return

    setSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const formData = new FormData(e.currentTarget)

      const updates: any = {
        id: user.id,
        bio: formData.get('bio'),
        phone: formData.get('phone'),
        desired_position: formData.get('desired_position'),
        years_experience: formData.get('years_experience'),
        highest_education: formData.get('highest_education'),
        employment_type: formData.get('employment_type'),
        availability: formData.get('availability'),
        willing_to_relocate: formData.get('willing_to_relocate') === 'true',
        preferred_cities: formData.get('preferred_cities'),
        expected_salary_min: formData.get('expected_salary_min'),
        expected_salary_max: formData.get('expected_salary_max'),
      }

      const { error: updateError } = await supabase
        .from('employee_profiles')
        .update(updates)
        .eq('id', user.id)

      if (updateError) throw updateError

      setProfile({ ...profile, ...updates })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.serverError'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>{t('common.loading')}</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('employee.title')}</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Avatar Section */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">{t('employee.avatar')}</h3>
          <div className="flex items-center gap-6">
            {avatarUrl && (
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted">
                <Image
                  src={avatarUrl}
                  alt="Avatar"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={saving}
                className="hidden"
              />
              <span className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                {t('employee.avatar')}
              </span>
            </label>
          </div>
        </div>

        {/* Basic Info Section */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">{t('employee.personalInfo')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('employee.phone')}</label>
              <input
                name="phone"
                defaultValue={profile?.phone}
                placeholder="+251..."
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('employee.desiredPosition')}</label>
              <input
                name="desired_position"
                defaultValue={profile?.desired_position}
                placeholder={t('employee.desiredPosition')}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('employee.bio')}</label>
            <textarea
              name="bio"
              defaultValue={profile?.bio}
              placeholder={t('employee.bio')}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground"
            />
          </div>
        </div>

        {/* Job Preferences Section */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">{t('employee.jobPreferences')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('employee.yearsExperience')}</label>
              <input
                name="years_experience"
                type="number"
                defaultValue={profile?.years_experience}
                placeholder="5"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('employee.highestEducation')}</label>
              <select
                name="highest_education"
                defaultValue={profile?.highest_education}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="">{t('employee.highestEducation')}</option>
                {['primary', 'secondary', 'tvet', 'diploma', 'bachelor', 'master', 'doctorate'].map((level) => (
                  <option key={level} value={level}>
                    {t(`taxonomy.education_${level}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('employee.employmentType')}</label>
              <select
                name="employment_type"
                defaultValue={profile?.employment_type}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="">{t('employee.employmentType')}</option>
                {['full_time', 'part_time', 'contract', 'temporary', 'internship'].map((type) => (
                  <option key={type} value={type}>
                    {t(`taxonomy.employment_${type}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('employee.availability')}</label>
              <select
                name="availability"
                defaultValue={profile?.availability}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="">{t('employee.availability')}</option>
                {['immediately', 'within_two_weeks', 'within_a_month', 'not_available'].map((av) => (
                  <option key={av} value={av}>
                    {t(`taxonomy.availability_${av}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('employee.preferredCities')}</label>
            <input
              name="preferred_cities"
              defaultValue={profile?.preferred_cities}
              placeholder="Addis Ababa, Dire Dawa"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="willing_to_relocate"
                value="true"
                defaultChecked={profile?.willing_to_relocate}
              />
              <span className="text-sm">{t('employee.willingToRelocate')}</span>
            </label>
          </div>
        </div>

        {/* Salary Section */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">{t('employee.expectedSalaryMin')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('employee.expectedSalaryMin')}</label>
              <input
                name="expected_salary_min"
                type="number"
                defaultValue={profile?.expected_salary_min}
                placeholder="20000"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('employee.expectedSalaryMax')}</label>
              <input
                name="expected_salary_max"
                type="number"
                defaultValue={profile?.expected_salary_max}
                placeholder="50000"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={saving} size="lg">
            {saving ? t('common.loading') : t('common.save')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.back()}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  )
}
