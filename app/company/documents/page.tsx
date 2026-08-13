'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

const DOCUMENT_TYPES = [
  'trade_license',
  'tin_certificate',
  'business_registration',
  'other',
]

export default function CompanyDocumentsPage() {
  const t = useTranslations()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState('')

  useEffect(() => {
    const loadDocuments = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('owner_id', user.id)
        .order('uploaded_at', { ascending: false })

      setDocuments(data || [])
      setLoading(false)
    }

    loadDocuments()
  }, [router])

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !selectedType) {
      setError(t('validation.required'))
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError(t('documents.documentSizeTooLarge'))
      return
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError(t('documents.invalidFileType'))
      return
    }

    setUploading(true)
    setError(null)

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('ownerId', user.id)
      const upload = await fetch('/api/local-files', { method: 'POST', body: form })
      const uploaded = await upload.json()
      if (!upload.ok) throw new Error(uploaded.error || 'Unable to save the file locally')
      const supabase = createClient()

      // Create document record
      const { data: doc, error: insertError } = await supabase
        .from('documents')
        .insert([
          {
            owner_id: user.id,
            document_type: selectedType,
            file_name: file.name,
            file_path: uploaded.path,
            file_size: file.size,
            status: 'pending',
          },
        ])
        .select()
        .single()

      if (insertError) throw insertError

      setDocuments([doc, ...documents])
      setSelectedType('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.serverError'))
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (docId: string, filePath: string) => {
    if (!confirm(t('admin.confirmAction'))) return

    try {
      const supabase = createClient()

      await fetch('/api/local-files', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: filePath }) })

      // Delete record
      await supabase.from('documents').delete().eq('id', docId)

      setDocuments(documents.filter((d) => d.id !== docId))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.serverError'))
    }
  }

  if (loading) {
    return <div>{t('common.loading')}</div>
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{t('nav.documents')}</h1>

      {/* Upload Section */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h3 className="font-semibold">{t('documents.uploadDocument')}</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('documents.documentType')}</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              disabled={uploading}
            >
              <option value="">{t('documents.selectDocumentType')}</option>
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`taxonomy.doc_${type}`)}
                </option>
              ))}
            </select>
          </div>

          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleDocumentUpload}
              disabled={uploading || !selectedType}
              className="hidden"
            />
            <span className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
              {uploading ? t('common.loading') : t('documents.uploadDocument')}
            </span>
          </label>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        <h3 className="font-semibold">{t('nav.documents')}</h3>

        {documents.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
            {t('documents.noDocuments')}
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
              >
                <div className="space-y-1 flex-1">
                  <p className="font-medium">{doc.file_name}</p>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{t(`taxonomy.doc_${doc.document_type}`)}</span>
                    <span>{t('documents.status')}: {t(`taxonomy.doc_status_${doc.status}`)}</span>
                    <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                  </div>
                  {doc.review_note && (
                    <p className="text-sm text-accent mt-2">
                      {t('documents.reviewNote')}: {doc.review_note}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteDocument(doc.id, doc.file_path)}
                >
                  {t('common.delete')}
                </Button>
                <a className="ml-2 text-sm text-primary underline" href={`/api/local-files/${doc.file_path}`} target="_blank" rel="noreferrer">Open</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
