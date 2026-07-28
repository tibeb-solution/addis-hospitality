'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function AdminEmployeesPage() {
  const t = useTranslations()
  const [employees, setEmployees] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    const loadEmployees = async () => {
      const supabase = createClient()

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'employee')
        .order('created_at', { ascending: false })

      setEmployees(data || [])
      setFiltered(data || [])
      setLoading(false)
    }

    loadEmployees()
  }, [])

  useEffect(() => {
    let results = employees

    if (search) {
      results = results.filter((emp) =>
        emp.email.toLowerCase().includes(search.toLowerCase()) ||
        emp.full_name?.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (statusFilter) {
      results = results.filter((emp) => emp.status === statusFilter)
    }

    setFiltered(results)
  }, [search, statusFilter, employees])

  if (loading) {
    return <div>{t('common.loading')}</div>
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{t('admin.employeeList')}</h1>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('admin.searchEmployee')}</label>
            <input
              placeholder={t('admin.searchEmployee')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('admin.accountStatus')}</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
            >
              <option value="">{t('admin.filterBy')}</option>
              <option value="active">{t('taxonomy.status_active')}</option>
              <option value="pending">{t('taxonomy.status_pending')}</option>
              <option value="suspended">{t('taxonomy.status_suspended')}</option>
              <option value="rejected">{t('taxonomy.status_rejected')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {t('admin.noResults')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium">{t('auth.email')}</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">{t('auth.fullName')}</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">{t('documents.status')}</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">{t('admin.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm">{emp.email}</td>
                    <td className="px-6 py-4 text-sm">{emp.full_name || '—'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        emp.status === 'active' ? 'bg-green-500/20 text-green-700' :
                        emp.status === 'pending' ? 'bg-yellow-500/20 text-yellow-700' :
                        emp.status === 'suspended' ? 'bg-orange-500/20 text-orange-700' :
                        'bg-red-500/20 text-red-700'
                      }`}>
                        {t(`taxonomy.status_${emp.status}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link href={`/admin/employees/${emp.id}`}>
                        <Button variant="outline" size="sm">
                          {t('admin.viewDetails')}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
