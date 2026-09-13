'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

const DOCUMENT_TYPES = [
  'national_id',
  'passport',
  'experience_letters',
  'education_certificate',
]

export default function EmployeeDocumentsPage() {
  const t = useTranslations()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState('')
  const [holderType, setHolderType] = useState('employee')
  const [relativeName, setRelativeName] = useState('')
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const frontInputRef = useRef<HTMLInputElement>(null)
  const backInputRef = useRef<HTMLInputElement>(null)

  const requiresBothSides = Boolean(selectedType)
  const existingDocumentPair = documents.filter(
    (document) =>
      document.document_type === selectedType &&
      document.holder_type === holderType &&
      (holderType !== 'collateral_relative' || document.relative_name === relativeName.trim()),
  )
  const documentUploadLocked = requiresBothSides && existingDocumentPair.length > 0

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

  const resetSelectedFiles = () => {
    setFrontFile(null)
    setBackFile(null)
    if (frontInputRef.current) frontInputRef.current.value = ''
    if (backInputRef.current) backInputRef.current.value = ''
  }

  const validateFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      return t('documents.documentSizeTooLarge')
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return t('documents.invalidFileType')
    }

    return null
  }

  const handleDocumentUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const files = [
      { file: frontFile, side: 'front' },
      { file: backFile, side: 'back' },
    ]

    if (!user || !selectedType || files.some(({ file }) => !file)) {
      setError(t('validation.required'))
      return
    }

    const validationError = files
      .map(({ file }) => validateFile(file!))
      .find(Boolean)
    if (validationError) {
      setError(validationError)
      return
    }

    if (documentUploadLocked) {
      setError('This document already has an upload. Delete both the front and back files before uploading a replacement.')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()
      // Check the latest state too, so a second browser tab cannot add another pair.
      let existingQuery = supabase
        .from('documents')
        .select('id')
        .eq('owner_id', user.id)
        .eq('holder_type', holderType)
        .eq('document_type', selectedType)
      existingQuery = holderType === 'collateral_relative'
        ? existingQuery.eq('relative_name', relativeName.trim())
        : existingQuery
      const { data: existing, error: existingError } = await existingQuery
      if (existingError) throw existingError
      if (existing?.length) {
        throw new Error('This document already has an upload. Delete both the front and back files before uploading a replacement.')
      }

      const uploadedFiles: { file: File; filePath: string; side: string | null }[] = []
      for (const { file, side } of files) {
        const selected = file!
        const filePath = `${user.id}/${selectedType}-${side}-${crypto.randomUUID()}-${selected.name}`
        const { error: storageError } = await supabase.storage
          .from('documents')
          .upload(filePath, selected, { upsert: false })
        if (storageError) throw storageError
        uploadedFiles.push({ file: selected, filePath, side })
      }

      const { data: newDocuments, error: insertError } = await supabase
        .from('documents')
        .insert(uploadedFiles.map(({ file, filePath, side }) => ({
            owner_id: user.id,
            document_type: selectedType,
            holder_type: holderType,
            relative_name: holderType === 'collateral_relative' ? relativeName.trim() : null,
            file_name: side ? `${side === 'front' ? 'Front' : 'Back'} - ${file.name}` : file.name,
            file_path: filePath,
            file_size: file.size,
            status: 'pending',
          })))
        .select()

      if (insertError) {
        await supabase.storage.from('documents').remove(uploadedFiles.map(({ filePath }) => filePath))
        throw insertError
      }

      setDocuments([...(newDocuments || []), ...documents])
      setSelectedType('')
      resetSelectedFiles()
      setSuccess('Both sides were submitted successfully and are awaiting admin review.')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.serverError'))
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocumentPair = async (document: any) => {
    const documentPair = documents.filter(
      (item) =>
        item.document_type === document.document_type &&
        item.holder_type === document.holder_type &&
        (item.holder_type !== 'collateral_relative' || item.relative_name === document.relative_name),
    )

    if (!confirm('Delete both sides of this document? You can then upload a new front-and-back pair.')) return

    try {
      const supabase = createClient()
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove(documentPair.map((item) => item.file_path))
      if (storageError) throw storageError

      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .in('id', documentPair.map((item) => item.id))
      if (deleteError) throw deleteError

      setDocuments(documents.filter((item) => !documentPair.some((pairDocument) => pairDocument.id === item.id)))
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

        <form className="space-y-4" onSubmit={handleDocumentUpload}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Document belongs to</label>
            <select value={holderType} onChange={(e) => { setHolderType(e.target.value); resetSelectedFiles() }} className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground" disabled={uploading}>
              <option value="employee">Me (employee)</option>
              <option value="collateral_relative">My collateral relative</option>
            </select>
            {holderType === 'collateral_relative' && <input value={relativeName} onChange={(e) => setRelativeName(e.target.value)} placeholder="Relative's full name" className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground" disabled={uploading} required />}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('documents.documentType')}</label>
            <select
              value={selectedType}
              onChange={(e) => { setSelectedType(e.target.value); resetSelectedFiles() }}
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

          {requiresBothSides && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
              <p className="font-semibold">Upload both sides of the selected document for the {holderType === 'collateral_relative' ? 'representative' : 'employee'}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                <li>Select one clear file for the front and one for the back.</li>
                <li>You can submit this pair only once.</li>
                <li>To make a change, delete both uploaded sides first, then upload a new pair.</li>
              </ul>
            </div>
          )}

          {documentUploadLocked ? (
            <p className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
              This document already has an upload for this {holderType === 'collateral_relative' ? 'representative' : 'employee'}. Delete both sides from the list below to upload a replacement.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">Front side
                <input ref={frontInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => setFrontFile(e.target.files?.[0] || null)} disabled={uploading} className="block w-full text-sm" />
              </label>
              <label className="space-y-2 text-sm font-medium">Back side
                <input ref={backInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => setBackFile(e.target.files?.[0] || null)} disabled={uploading} className="block w-full text-sm" />
              </label>
            </div>
          )}

          <Button type="submit" disabled={uploading || !selectedType || documentUploadLocked}>
            {uploading ? t('common.loading') : 'Upload both sides'}
          </Button>
        </form>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-700 text-sm">
            {success}
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
                    {doc.file_name?.startsWith('Front - ') && <span>Front side</span>}
                    {doc.file_name?.startsWith('Back - ') && <span>Back side</span>}
                    <span>{doc.holder_type === 'collateral_relative' ? `Collateral relative${doc.relative_name ? `: ${doc.relative_name}` : ''}` : 'Employee document'}</span>
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
                  onClick={() => handleDeleteDocumentPair(doc)}
                >
                  Delete document pair
                </Button>
                <button className="ml-2 text-sm text-primary underline" onClick={async () => {
                  const { data, error: signedError } = await createClient().storage.from('documents').createSignedUrl(doc.file_path, 3600)
                  if (signedError) setError(signedError.message)
                  else if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
                }}>Open</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
