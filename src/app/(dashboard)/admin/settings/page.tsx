import type { Metadata } from 'next'

import { requirePage } from '@/lib/permissions'
import { getSchool, listAcademicYearsWithTerms, listGradeScales } from '@/lib/settings'
import { updateSchool, createAcademicYear, activateAcademicYear, createTerm, createGradeScale } from '@/lib/settings/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SchoolForm } from '@/components/settings/school-form'
import { GradeScaleForm } from '@/components/settings/grade-scale-form'
import { AcademicYearCreateForm } from '@/components/settings/academic-year-form'
import { TermCreateForm } from '@/components/settings/term-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { CalendarCheck } from 'lucide-react'
import dayjs from 'dayjs'

export const metadata: Metadata = { title: 'Settings' }

async function activateAction(yearId: string) {
  'use server'
  await activateAcademicYear(yearId)
}

export default async function SettingsPage() {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const [school, years, gradeScales] = await Promise.all([getSchool(), listAcademicYearsWithTerms(), listGradeScales()])

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Settings"
        subtitle="Manage school configuration."
      />

      <Card className="overflow-hidden">
        <CardHeader><CardTitle className="text-lg">School Profile</CardTitle></CardHeader>
        <CardContent><SchoolForm action={updateSchool} school={school} /></CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader><CardTitle className="text-lg">Academic Years & Terms</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {years.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="glass-card rounded-2xl p-4">
                <CalendarCheck className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No academic years created yet.</p>
            </div>
          )}
          {years.map((y) => (
            <div key={y.id} className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3 transition-colors hover:bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{y.name}</h3>
                    {y.isActive && <Badge className="text-[10px] px-1.5 py-0">Active</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dayjs(y.startDate).format('YYYY')} – {dayjs(y.endDate).format('YYYY')} · {y._count.enrollments} enrollments
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!y.isActive && (
                    <form action={activateAction.bind(null, y.id)}>
                      <Button variant="default" size="sm" type="submit">Activate</Button>
                    </form>
                  )}
                </div>
              </div>
              {y.terms.length > 0 && (
                <div className="space-y-1">
                  {y.terms.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 text-sm rounded-lg bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/50">
                      <span className="font-medium">{t.name}</span>
                      <span className="text-muted-foreground">{dayjs(t.startDate).format('DD MMM')} – {dayjs(t.endDate).format('DD MMM')}</span>
                      <Badge variant={t.isActive ? 'default' : 'outline'} className="text-xs ml-auto">{t.isActive ? 'Active' : 'Inactive'}</Badge>
                    </div>
                  ))}
                </div>
              )}
              {y.isActive && <TermCreateForm action={createTerm} yearId={y.id} />}
            </div>
          ))}
          <AcademicYearCreateForm action={createAcademicYear} />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader><CardTitle className="text-lg">Grade Scale</CardTitle></CardHeader>
        <CardContent>
          <GradeScaleForm action={createGradeScale} scales={gradeScales} />
        </CardContent>
      </Card>
    </div>
  )
}
