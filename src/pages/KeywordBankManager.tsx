import React, { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import {
  KeywordEntry,
  loadKeywordBank,
  saveKeywordBank,
  deleteKeyword,
} from '@/lib/smart-paste-engine/keywordBankUtils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Trash2 } from 'lucide-react'

const KeywordBankManager = () => {
  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState('')
  const [senderCtx, setSenderCtx] = useState('')
  const [txnCtx, setTxnCtx] = useState('')
  const [entries, setEntries] = useState<KeywordEntry[]>([])
  const [isEditMode, setIsEditMode] = useState(false)

  useEffect(() => {
    setEntries(loadKeywordBank())
  }, [])

  const resetForm = () => {
    setKeyword('')
    setType('')
    setSenderCtx('')
    setTxnCtx('')
    setIsEditMode(false)
  }

  const handleSave = () => {
    if (!keyword.trim() || !type.trim()) return

    const now = new Date().toISOString()
    const existing = entries.find(e => e.keyword === keyword.trim().toLowerCase())
    let updated: KeywordEntry[]

    if (existing) {
      const updatedEntry: KeywordEntry = {
        ...existing,
        type: type.trim(),
        lastUpdated: now,
        mappingCount: (existing.mappingCount || 0) + 1,
        senderContext: senderCtx || existing.senderContext,
        transactionTypeContext: txnCtx || existing.transactionTypeContext,
        mappings: existing.mappings,
      }
      updated = entries.map(e => (e.keyword === existing.keyword ? updatedEntry : e))
    } else {
      const newEntry: KeywordEntry = {
        keyword: keyword.trim().toLowerCase(),
        type: type.trim(),
        lastUpdated: now,
        mappingCount: 1,
        mappings: [],
      }
      if (senderCtx.trim()) newEntry.senderContext = senderCtx.trim()
      if (txnCtx.trim()) newEntry.transactionTypeContext = txnCtx.trim()
      updated = [...entries, newEntry]
    }

    saveKeywordBank(updated)
    setEntries(updated)
    resetForm()
  }

  const handleEdit = (entry: KeywordEntry) => {
    setKeyword(entry.keyword)
    setType(entry.type)
    setSenderCtx(entry.senderContext || '')
    setTxnCtx(entry.transactionTypeContext || '')
    setIsEditMode(true)
  }

  const handleDelete = (kw: string) => {
    deleteKeyword(kw)
    setEntries(loadKeywordBank())
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto mt-6 space-y-6 px-[var(--page-padding-x)]">
        <Card>
          <CardHeader>
            <CardTitle>Keyword Bank Manager</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Keyword</Label>
              <Input
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="e.g., netflix"
                disabled={isEditMode}
              />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Input value={type} onChange={e => setType(e.target.value)} placeholder="e.g., expense" />
            </div>
            <div className="grid gap-2">
              <Label>Sender Context</Label>
              <Input value={senderCtx} onChange={e => setSenderCtx(e.target.value)} placeholder="Optional" />
            </div>
            <div className="grid gap-2">
              <Label>Transaction Type Context</Label>
              <Input value={txnCtx} onChange={e => setTxnCtx(e.target.value)} placeholder="Optional" />
            </div>
            <Button type="button" onClick={handleSave}>
              {isEditMode ? '💾 Update Keyword' : '+ Add Keyword'}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {entries.map((entry, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="capitalize">{entry.keyword}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(entry)}>
                    ✏️
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(entry.keyword)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pl-6 pb-4 text-sm space-y-1">
                <p>
                  <strong>Type:</strong> {entry.type}
                </p>
                {entry.senderContext && (
                  <p>
                    <strong>Sender:</strong> {entry.senderContext}
                  </p>
                )}
                {entry.transactionTypeContext && (
                  <p>
                    <strong>Txn Context:</strong> {entry.transactionTypeContext}
                  </p>
                )}
                {entry.mappingCount !== undefined && (
                  <p>
                    <strong>Count:</strong> {entry.mappingCount}
                  </p>
                )}
                {entry.lastUpdated && (
                  <p>
                    <strong>Updated:</strong> {new Date(entry.lastUpdated).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default KeywordBankManager
