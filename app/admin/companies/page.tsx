'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function AdminCompaniesPage() {
  const t = useTranslations()
  const [companies, setCompanies] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [verifiedFilter, setVerifiedFilter] = useState<string>('')

  useEffect(() => {
    const loadCompanies = async () => {
      const supabase = createClient()

      const { data } = await supabase
        .from('company_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      setCompanies(data || [])
      setFiltered(data || [])
      setLoading(false)
    }

    loadCompanies()
  }, [])

  useEffect(() => {
    let results = companies

    if (search) {
      results = results.filter((comp) =>
        comp.company_name?.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (verifiedFilter) {
      results = results.filter((comp) =>
        verifiedFilter === 'verified' ? comp.is_verified : !comp.is_verified
      )
    }

    setFiltered(results)
  }, [search, verifiedFilter, companies])

  if (loading) {
    return <div>{t('common.loading')}</div>
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{t('admin.companyList')}</h1>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('admin.searchCompany')}</label>
            <input
              placeholder={t('admin.searchCompany')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('admin.verificationStatus')}</label>
            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
            >
              <option value="">{t('admin.filterBy')}</option>
              <option value="verified">{t('company.verified')}</option>
              <option value="pending">{t('company.verifyPending')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Companies Table */}
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
                  <th className="px-6 py-3 text-left text-sm font-medium">{t('auth.companyName')}</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">{t('auth.businessType')}</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">{t('admin.registrationDate')}</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">{t('admin.verificationStatus')}</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">{t('admin.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((comp) => (
                  <tr key={comp.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm">{comp.company_name || '—'}</td>
                    <td className="px-6 py-4 text-sm">
                      {t(`taxonomy.business_${comp.business_type}`) || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {comp.created_at ? new Date(comp.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        comp.is_verified
                          ? 'bg-green-500/20 text-green-700'
                          : 'bg-yellow-500/20 text-yellow-700'
                      }`}>
                        {comp.is_verified ? t('company.verified') : t('company.verifyPending')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link href={`/admin/companies/${comp.id}`}>
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
