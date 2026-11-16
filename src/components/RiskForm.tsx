import { useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, Send, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createReport } from '@/lib/api'
import {
  CATEGORIES,
  DEPARTMENTS,
  IMPACT_LABELS,
  PROBABILITY_LABELS,
  levelOf,
  scoreOf,
  shortCode,
} from '@/lib/risk'
import { cn } from '@/lib/cn'

type FormState = {
  reporterName: string
  department: string
  position: string
  contact: string
  title: string
  category: string
  location: string
  description: string
  hazards: string
  suggestion: string
  probability: number
  impact: number
}

const EMPTY: FormState = {
  reporterName: '',
  department: '',
  position: '',
  contact: '',
  title: '',
  category: '',
  location: '',
  description: '',
  hazards: '',
  suggestion: '',
  probability: 3,
  impact: 3,
}

const REQUIRED: { key: keyof FormState; label: string }[] = [
  { key: 'reporterName', label: 'نام و نام خانوادگی' },
  { key: 'department', label: 'واحد سازمانی' },
  { key: 'title', label: 'عنوان ریسک' },
  { key: 'category', label: 'دسته‌بندی' },
  { key: 'description', label: 'شرح ریسک' },
  { key: 'hazards', label: 'خطرات و پیامدها' },
  { key: 'suggestion', label: 'راهکار پیشنهادی' },
]

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="relative space-y-1.5">
      <Label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

function ScalePicker({
  value,
  onChange,
  labels,
}: {
  value: number
  onChange: (v: number) => void
  labels: string[]
}) {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {labels.map((label, i) => {
        const n = i + 1
        const active = value === n
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-lg border px-1 py-2 text-[11px] transition-colors',
              active
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50',
            )}
          >
            <span className="text-sm font-bold">{n}</span>
            <span className="leading-tight text-center">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function RiskForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [created, setCreated] = useState<{ id: string; title: string } | null>(null)

  const score = useMemo(() => scoreOf(form.probability, form.impact), [form.probability, form.impact])
  const level = levelOf(score)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)

    const next: Partial<Record<keyof FormState, string>> = {}
    for (const { key, label } of REQUIRED) {
      if (!String(form[key] ?? '').trim()) next[key] = `${label} را وارد کنید.`
    }
    if (Object.keys(next).length) {
      setErrors(next)
      return
    }

    setSaving(true)
    try {
      const report = await createReport({
        reporterName: form.reporterName.trim(),
        department: form.department,
        position: form.position.trim() || null,
        contact: form.contact.trim() || null,
        title: form.title.trim(),
        category: form.category,
        location: form.location.trim() || null,
        description: form.description.trim(),
        hazards: form.hazards.trim(),
        suggestion: form.suggestion.trim(),
        probability: form.probability,
        impact: form.impact,
        score,
        level: level.label,
      })
      setCreated({ id: report.id, title: report.title })
      setForm(EMPTY)
      onSubmitted?.()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'ثبت پیشنهاد انجام نشد.')
    } finally {
      setSaving(false)
    }
  }

  if (created) {
    return (
      <Card className="mx-auto max-w-2xl border-emerald-200 bg-emerald-50/40">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-800">پیشنهاد شما با موفقیت ثبت شد</h2>
            <p className="text-sm text-slate-600">
              «{created.title}» در صف بررسی مدیر قرار گرفت. از مشارکت شما سپاسگزاریم.
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-white px-4 py-2 font-mono text-sm text-slate-700">
            کد پیگیری: <span className="font-bold text-emerald-700">{shortCode(created.id)}</span>
          </div>
          <Button variant="outline" onClick={() => setCreated(null)}>
            ثبت پیشنهاد جدید
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">مشخصات گزارش‌دهنده</CardTitle>
            <CardDescription>این اطلاعات برای پیگیری و قدردانی از پیشنهاد شما استفاده می‌شود.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="نام و نام خانوادگی" required error={errors.reporterName}>
              <Input
                value={form.reporterName}
                onChange={(e) => set('reporterName', e.target.value)}
                placeholder="مثال: علی رضایی"
              />
            </Field>
            <Field label="واحد سازمانی" required error={errors.department}>
              <Select value={form.department} onValueChange={(v) => set('department', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب واحد" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="سمت / عنوان شغلی">
              <Input
                value={form.position}
                onChange={(e) => set('position', e.target.value)}
                placeholder="مثال: کارشناس ایمنی"
              />
            </Field>
            <Field label="راه ارتباطی" hint="ایمیل یا شماره تماس (اختیاری)">
              <Input
                value={form.contact}
                onChange={(e) => set('contact', e.target.value)}
                placeholder="name@company.com"
                dir="ltr"
                className="text-left"
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">مشخصات ریسک</CardTitle>
            <CardDescription>ریسکی که مشاهده کرده‌اید را دقیق و شفاف توضیح دهید.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="عنوان ریسک" required error={errors.title}>
              <Input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="مثال: نبود حفاظ ایمنی روی نوار نقاله خط ۲"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="دسته‌بندی ریسک" required error={errors.category}>
                <Select value={form.category} onValueChange={(v) => set('category', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب دسته" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="محل / موقعیت">
                <Input
                  value={form.location}
                  onChange={(e) => set('location', e.target.value)}
                  placeholder="مثال: سالن تولید، خط ۲"
                />
              </Field>
            </div>
            <Field label="شرح ریسک" required error={errors.description}>
              <Textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={4}
                placeholder="چه چیزی، کجا و در چه شرایطی اتفاق می‌افتد؟"
              />
            </Field>
            <Field
              label="خطرات و پیامدهای احتمالی"
              required
              error={errors.hazards}
              hint="در صورت وقوع، چه آسیب جانی، مالی یا عملیاتی به وجود می‌آید؟"
            >
              <Textarea
                value={form.hazards}
                onChange={(e) => set('hazards', e.target.value)}
                rows={3}
                placeholder="مثال: احتمال قطع عضو، توقف خط تولید و جریمه ایمنی"
              />
            </Field>
            <Field
              label="راهکار پیشنهادی"
              required
              error={errors.suggestion}
              hint="راهکار عملی و قابل اجرا پیشنهاد دهید."
            >
              <Textarea
                value={form.suggestion}
                onChange={(e) => set('suggestion', e.target.value)}
                rows={3}
                placeholder="مثال: نصب حفاظ فلزی و کلید قطع اضطراری در ورودی نوار نقاله"
              />
            </Field>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-4 w-4 text-indigo-600" />
              ارزیابی اولیه ریسک
            </CardTitle>
            <CardDescription>امتیاز = احتمال × شدت</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm text-slate-700">احتمال وقوع</Label>
              <ScalePicker
                value={form.probability}
                onChange={(v) => set('probability', v)}
                labels={PROBABILITY_LABELS}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-slate-700">شدت پیامد</Label>
              <ScalePicker value={form.impact} onChange={(v) => set('impact', v)} labels={IMPACT_LABELS} />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-xs text-slate-500">امتیاز ریسک</p>
              <p className="text-3xl font-black text-slate-800">{score}</p>
              <span
                className={cn(
                  'mt-2 inline-block rounded-full border px-3 py-0.5 text-xs font-semibold',
                  level.badge,
                )}
              >
                سطح {level.label}
              </span>
            </div>

            {serverError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <Button type="submit" disabled={saving} className="w-full gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {saving ? 'در حال ارسال…' : 'ارسال پیشنهاد'}
            </Button>
            <p className="text-center text-[11px] leading-relaxed text-slate-400">
              پیشنهاد شما محرمانه ثبت می‌شود و فقط برای تیم ارزیابی ریسک قابل مشاهده است.
            </p>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
