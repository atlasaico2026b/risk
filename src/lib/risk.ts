export type RiskReport = {
  id: string
  reporterName: string
  department: string
  position: string | null
  contact: string | null
  title: string
  category: string
  location: string | null
  description: string
  hazards: string | null
  suggestion: string
  probability: number
  impact: number
  score: number
  level: string
  status: string
  managerNote: string | null
  createdAt: string
  updatedAt: string
}

export const CATEGORIES = [
  'ایمنی و بهداشت',
  'عملیاتی',
  'مالی',
  'زیست‌محیطی',
  'امنیت اطلاعات',
  'منابع انسانی',
  'کیفیت',
  'تجهیزات و نگهداری',
  'سایر',
]

export const DEPARTMENTS = [
  'تولید',
  'فنی و مهندسی',
  'نگهداری و تعمیرات',
  'ایمنی و بهداشت (HSE)',
  'کیفیت',
  'مالی و حسابداری',
  'منابع انسانی',
  'فناوری اطلاعات',
  'انبار و لجستیک',
  'فروش و بازاریابی',
  'اداری و پشتیبانی',
]

export type StatusKey = 'new' | 'reviewing' | 'accepted' | 'implemented' | 'rejected'

export const STATUSES: { value: StatusKey; label: string; className: string }[] = [
  { value: 'new', label: 'جدید', className: 'bg-sky-100 text-sky-800 border-sky-200' },
  { value: 'reviewing', label: 'در حال بررسی', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'accepted', label: 'تأیید شده', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { value: 'implemented', label: 'اجرا شده', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'rejected', label: 'رد شده', className: 'bg-slate-100 text-slate-600 border-slate-200' },
]

export function statusMeta(value: string) {
  return STATUSES.find((s) => s.value === value) ?? STATUSES[0]
}

export type LevelKey = 'low' | 'medium' | 'high' | 'critical'

export const LEVELS: Record<LevelKey, { label: string; badge: string; solid: string; text: string }> = {
  low: {
    label: 'کم',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    solid: 'bg-emerald-500',
    text: 'text-emerald-700',
  },
  medium: {
    label: 'متوسط',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    solid: 'bg-amber-400',
    text: 'text-amber-700',
  },
  high: {
    label: 'زیاد',
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    solid: 'bg-orange-500',
    text: 'text-orange-700',
  },
  critical: {
    label: 'بحرانی',
    badge: 'bg-red-100 text-red-800 border-red-200',
    solid: 'bg-red-600',
    text: 'text-red-700',
  },
}

export function levelKey(score: number): LevelKey {
  if (score <= 4) return 'low'
  if (score <= 9) return 'medium'
  if (score <= 14) return 'high'
  return 'critical'
}

export function levelOf(score: number) {
  const key = levelKey(score)
  return { key, ...LEVELS[key] }
}

export const PROBABILITY_LABELS = ['خیلی کم', 'کم', 'متوسط', 'زیاد', 'خیلی زیاد']
export const IMPACT_LABELS = ['ناچیز', 'جزئی', 'متوسط', 'شدید', 'فاجعه‌بار']

export function scoreOf(probability: number, impact: number) {
  return Math.max(1, Math.min(5, probability)) * Math.max(1, Math.min(5, impact))
}

const faDate = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const faDateTime = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDate(value: string) {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : faDate.format(d)
}

export function formatDateTime(value: string) {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : faDateTime.format(d)
}

export function shortCode(id: string) {
  return `RSK-${id.slice(-6).toUpperCase()}`
}

export function toCsv(rows: RiskReport[]) {
  const headers = [
    'کد',
    'تاریخ',
    'عنوان ریسک',
    'دسته‌بندی',
    'واحد',
    'محل',
    'گزارش‌دهنده',
    'سمت',
    'تماس',
    'شرح ریسک',
    'خطرات و پیامدها',
    'راهکار پیشنهادی',
    'احتمال',
    'شدت',
    'امتیاز',
    'سطح',
    'وضعیت',
    'نظر مدیر',
  ]

  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`

  const lines = rows.map((r) =>
    [
      shortCode(r.id),
      formatDate(r.createdAt),
      r.title,
      r.category,
      r.department,
      r.location ?? '',
      r.reporterName,
      r.position ?? '',
      r.contact ?? '',
      r.description,
      r.hazards ?? '',
      r.suggestion,
      r.probability,
      r.impact,
      r.score,
      levelOf(r.score).label,
      statusMeta(r.status).label,
      r.managerNote ?? '',
    ]
      .map(escape)
      .join(','),
  )

  return '\uFEFF' + [headers.map(escape).join(','), ...lines].join('\r\n')
}

export function downloadCsv(rows: RiskReport[]) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `risk-reports-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
