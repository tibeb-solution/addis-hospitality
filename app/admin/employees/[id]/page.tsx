'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function AdminEmployeeDetailPage() {
  const t = useTranslations()
  const router = useRouter()
  const params = useParams()
  const [employee, setEmployee] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusNote, setStatusNote] = useState('')

  useEffect(() => {
    const loadEmployee = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id as string)
        .single()

      if (data) {
        setEmployee(data)
        setStatusNote(data.status_note || '')
      }
      setLoading(false)
    }

    loadEmployee()
  }, [params])

  const handleStatusChange = async (newStatus: string) => {
    if (!employee) return
    setUpdating(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          status: newStatus,
          status_note: statusNote,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', employee.id)

      if (updateError) throw updateError

      setEmployee({ ...employee, status: newStatus })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.serverError'))
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return <div>{t('common.loading')}</div>
  }

  if (!employee) {
    return <div>{t('admin.noResults')}</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{employee.full_name || employee.email}</h1>
        <Button variant="outline" onClick={() => router.back()}>
          {t('common.back')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Info */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">{t('auth.email')}</h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">{t('auth.email')}</dt>
              <dd className="font-medium">{employee.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t('auth.fullName')}</dt>
              <dd className="font-medium">{employee.full_name || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t('auth.phone')}</dt>
              <dd className="font-medium">{employee.phone || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t('admin.accountStatus')}</dt>
              <dd className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                employee.status === 'active' ? 'bg-green-500/20 text-green-700' :
                employee.status === 'pending' ? 'bg-yellow-500/20 text-yellow-700' :
                employee.status === 'suspended' ? 'bg-orange-500/20 text-orange-700' :
                'bg-red-500/20 text-red-700'
              }`}>
                {t(`taxonomy.status_${employee.status}`)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t('admin.registrationDate')}</dt>
              <dd className="font-medium">
                {new Date(employee.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>

        {/* Moderation Controls */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">{t('admin.action')}</h3>

          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('admin.statusNote')}</label>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground"
                rows={3}
                placeholder={t('admin.statusNote')}
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              {employee.status !== 'active' && (
                <Button
                  onClick={() => handleStatusChange('active')}
                  disabled={updating}
                  className="flex-1"
                >
                  {t('admin.approve')}
                </Button>
              )}
              {employee.status !== 'rejected' && (
                <Button
                  onClick={() => handleStatusChange('rejected')}
                  disabled={updating}
                  variant="destructive"
                  className="flex-1"
                >
                  {t('admin.reject')}
                </Button>
              )}
              {employee.status !== 'suspended' && (
                <Button
                  onClick={() => handleStatusChange('suspended')}
                  disabled={updating}
                  variant="outline"
                  className="flex-1"
                >
                  {t('admin.suspend')}
                </Button>
              )}
              {employee.status === 'suspended' && (
                <Button
                  onClick={() => handleStatusChange('active')}
                  disabled={updating}
                  className="flex-1"
                >
                  {t('admin.reactivate')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Audit Info */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h3 className="font-semibold">{t('admin.auditLog')}</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('admin.approvedAt')}</dt>
            <dd className="font-medium">
              {employee.status === 'active' && employee.reviewed_at
                ? new Date(employee.reviewed_at).toLocaleString()
                : '—'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('admin.reviewedAt')}</dt>
            <dd className="font-medium">
              {employee.reviewed_at ? new Date(employee.reviewed_at).toLocaleString() : '—'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
