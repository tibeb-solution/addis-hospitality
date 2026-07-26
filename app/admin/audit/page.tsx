'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'

export default function AdminAuditLogPage() {
  const t = useTranslations()
  const [logs, setLogs] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  useEffect(() => {
    const loadLogs = async () => {
      const supabase = createClient()

      // For now, we'll show recent profile changes
      const { data: employees } = await supabase
        .from('profiles')
        .select('id, email, status, reviewed_at, created_at')
        .order('reviewed_at', { ascending: false })
        .limit(100)

      const auditLogs = employees?.map((emp) => ({
        id: emp.id,
        user: emp.email,
        action: emp.reviewed_at ? 'status_change' : 'signup',
        details: `Status: ${emp.status}`,
        timestamp: emp.reviewed_at || emp.created_at,
        status: emp.status,
      })) || []

      setLogs(auditLogs)
      setFiltered(auditLogs)
      setLoading(false)
    }

    loadLogs()
  }, [])

  useEffect(() => {
    let results = logs

    if (search) {
      results = results.filter((log) =>
        log.user.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (actionFilter) {
      results = results.filter((log) => log.action === actionFilter)
    }

    setFiltered(results)
  }, [search, actionFilter, logs])

  if (loading) {
    return <div>{t('common.loading')}</div>
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{t('admin.auditLog')}</h1>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('admin.searchUser')}</label>
            <Input
              placeholder={t('admin.searchUser')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('admin.action')}</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
            >
              <option value="">{t('admin.filterBy')}</option>
              <option value="signup">{t('auth.signUp')}</option>
              <option value="status_change">{t('admin.statusChange')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
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
                  <th className="px-6 py-3 text-left text-sm font-medium">{t('admin.timestamp')}</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">{t('admin.user')}</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">{t('admin.action')}</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">{t('admin.details')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">{log.user}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-primary/20 text-primary">
                        {log.action === 'signup' ? t('auth.signUp') : t('admin.statusChange')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {log.details}
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
