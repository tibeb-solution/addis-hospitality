'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'

const BUSINESS_TYPES = [
  'hotel',
  'resort',
  'lodge',
  'restaurant',
  'cafe',
  'bar',
  'catering',
  'event_venue',
  'tour_operator',
  'other',
]

export default function CompanyProfilePage() {
  const t = useTranslations()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      // Load company profile
      const { data } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Create if doesn't exist
      if (!data) {
        const { data: created } = await supabase
          .from('company_profiles')
          .insert([{ id: user.id }])
          .select()
          .single()

        setProfile(created || { id: user.id })
      } else {
        setProfile(data)
        if (data.logo_url) {
          const { data: signedUrl } = await supabase.storage
            .from('avatars')
            .getPublicUrl(data.logo_url)
          setLogoUrl(signedUrl.publicUrl)
        }
      }

      setLoading(false)
    }

    loadProfile()
  }, [router])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        .from('company_profiles')
        .update({ logo_url: fileName })
        .eq('id', user.id)

      if (updateError) throw updateError

      setLogoUrl(publicUrl)
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
        company_name: formData.get('company_name'),
        business_type: formData.get('business_type'),
        trade_license_number: formData.get('trade_license_number'),
        tin_number: formData.get('tin_number'),
        year_established: formData.get('year_established'),
        employee_count: formData.get('employee_count'),
        description: formData.get('description'),
        contact_person: formData.get('contact_person'),
        contact_position: formData.get('contact_position'),
        contact_phone: formData.get('contact_phone'),
        contact_email: formData.get('contact_email'),
        website: formData.get('website'),
        region: formData.get('region'),
        sub_city: formData.get('sub_city'),
        address: formData.get('address'),
      }

      const { error: updateError } = await supabase
        .from('company_profiles')
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
        <h1 className="text-3xl font-bold">{t('company.title')}</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Logo Section */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">{t('company.logo')}</h3>
          <div className="flex items-center gap-6">
            {logoUrl && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={logoUrl}
                  alt="Logo"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <label className="cursor-pointer">
              <Input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={saving}
                className="hidden"
              />
              <span className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                {t('company.logo')}
              </span>
            </label>
          </div>
        </div>

        {/* Basic Info Section */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">{t('company.basicInfo')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('auth.companyName')}</label>
              <Input
                name="company_name"
                defaultValue={profile?.company_name}
                placeholder={t('auth.companyName')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('auth.businessType')}</label>
              <select
                name="business_type"
                defaultValue={profile?.business_type}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="">{t('auth.selectBusinessType')}</option>
                {BUSINESS_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`taxonomy.business_${type}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('company.description')}</label>
            <textarea
              name="description"
              defaultValue={profile?.description}
              placeholder={t('company.description')}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground"
            />
          </div>
        </div>

        {/* Legal Info Section */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">{t('company.legalInfo')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('company.tradeLicenseNumber')}</label>
              <Input
                name="trade_license_number"
                defaultValue={profile?.trade_license_number}
                placeholder={t('company.tradeLicenseNumber')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('company.tinNumber')}</label>
              <Input
                name="tin_number"
                defaultValue={profile?.tin_number}
                placeholder={t('company.tinNumber')}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('company.yearEstablished')}</label>
              <Input
                name="year_established"
                type="number"
                defaultValue={profile?.year_established}
                placeholder="2020"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('company.employeeCount')}</label>
              <Input
                name="employee_count"
                type="number"
                defaultValue={profile?.employee_count}
                placeholder="100"
              />
            </div>
          </div>
        </div>

        {/* Contact Info Section */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">{t('company.contactInfo')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('company.contactPerson')}</label>
              <Input
                name="contact_person"
                defaultValue={profile?.contact_person}
                placeholder={t('company.contactPerson')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('company.contactPosition')}</label>
              <Input
                name="contact_position"
                defaultValue={profile?.contact_position}
                placeholder={t('company.contactPosition')}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('company.contactPhone')}</label>
              <Input
                name="contact_phone"
                type="tel"
                defaultValue={profile?.contact_phone}
                placeholder="+251..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('company.contactEmail')}</label>
              <Input
                name="contact_email"
                type="email"
                defaultValue={profile?.contact_email}
                placeholder="contact@company.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('company.website')}</label>
            <Input
              name="website"
              type="url"
              defaultValue={profile?.website}
              placeholder="https://example.com"
            />
          </div>
        </div>

        {/* Location Info Section */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">{t('company.contactInfo')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('company.region')}</label>
              <Input
                name="region"
                defaultValue={profile?.region}
                placeholder={t('company.region')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('company.subCity')}</label>
              <Input
                name="sub_city"
                defaultValue={profile?.sub_city}
                placeholder={t('company.subCity')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('company.address')}</label>
              <Input
                name="address"
                defaultValue={profile?.address}
                placeholder={t('company.address')}
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
