'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { useActionState } from 'react'
import { Upload } from 'lucide-react'

import { uploadStudentFile } from '@/lib/students/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { selectClass } from '@/components/form-helpers'

export function DocumentUpload({ studentId }: { studentId: string }) {
  const [state, formAction, pending] = useActionState(uploadStudentFile.bind(null, studentId), {
    status: 'idle',
  })

  useEffect(() => {
    if (state.status === 'success' && state.message) {
      toast.success(state.message)
    } else if (state.status === 'error' && state.message) {
      toast.error(state.message)
    }
  }, [state.status, state.message])

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="upload-category">Category</Label>
          <select
            id="upload-category"
            name="category"
            className={selectClass}
            defaultValue="DOCUMENT"
          >
            <option value="DOCUMENT">Document</option>
            <option value="ID_CARD">ID card</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <Label htmlFor="upload-file">File</Label>
          <Input
            id="upload-file"
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          />
        </div>
        <Button type="submit" disabled={pending}>
          <Upload /> Upload
        </Button>
      </div>
    </form>
  )
}
