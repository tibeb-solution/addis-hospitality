'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AdminDashboard() {
  const t = useTranslations()
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalCompanies: 0,
    activeAccounts: 0,
    pendingApproval: 0,
    rejectedAccounts: 0,
    suspendedAccounts: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      const supabase = createClient()

      // Get employee count
      const { count: empCount } = await supabase
        .from('employee_profiles')
        .select('id', { count: 'exact', head: true })

      // Get company count
      const { count: compCount } = await supabase
        .from('company_profiles')
        .select('id', { count: 'exact', head: true })

      // Get profile stats
      const { data: profiles } = await supabase
        .from('profiles')
        .select('status')

      const statusMap = profiles?.reduce((acc: any, p: any) => {
        acc[p.status] = (acc[p.status] || 0) + 1
        return acc
      }, {}) || {}

      setStats({
        totalEmployees: empCount || 0,
        totalCompanies: compCount || 0,
        activeAccounts: statusMap.active || 0,
        pendingApproval: statusMap.pending || 0,
        rejectedAccounts: statusMap.rejected || 0,
        suspendedAccounts: statusMap.suspended || 0,
      })

      setLoading(false)
    }

    loadStats()
  }, [])

  if (loading) {
    return <div>{t('common.loading')}</div>
  }

  const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="bg-card border border-border rounded-lg p-6 space-y-2">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t('admin.dashboard')}</h1>
        <p className="text-muted-foreground mt-2">{t('admin.title')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label={t('admin.totalEmployees')} value={stats.totalEmployees} color="text-primary" />
        <StatCard label={t('admin.totalCompanies')} value={stats.totalCompanies} color="text-accent" />
        <StatCard label={t('admin.activeAccounts')} value={stats.activeAccounts} color="text-green-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label={t('admin.pendingApproval')} value={stats.pendingApproval} color="text-yellow-600" />
        <StatCard label={t('admin.rejectedAccounts')} value={stats.rejectedAccounts} color="text-destructive" />
        <StatCard label={t('admin.suspendedAccounts')} value={stats.suspendedAccounts} color="text-orange-600" />
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">{t('admin.action')}</h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/admin/employees">
            <Button>{t('admin.employeeList')}</Button>
          </Link>
          <Link href="/admin/companies">
            <Button variant="outline">{t('admin.companyList')}</Button>
          </Link>
          <Link href="/admin/audit">
            <Button variant="outline">{t('admin.auditLog')}</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
