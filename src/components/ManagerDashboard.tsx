import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react'
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
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RiskMatrix } from '@/components/RiskMatrix'
import { deleteReport, updateReport } from '@/lib/api'
import {
  CATEGORIES,
  DEPARTMENTS,
  LEVELS,
  STATUSES,
  downloadCsv,
  formatDate,
  formatDateTime,
  levelKey,
  levelOf,
  shortCode,
  statusMeta,
  type RiskReport,
} from '@/lib/risk'
import { cn } from '@/lib/cn'

const STATUS_COLORS: Record<string, string> = {
  new: '#0ea5e9',
  reviewing: '#f59e0b',
  accepted: '#6366f1',
  implemented: '#10b981',
  rejected: '#94a3b8',
}

function Kpi({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string
  value: string | number
  hint?: string
  icon: React.ReactNode
  tone: string
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-black text-slate-800">{value}</p>
          {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
        </div>
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', tone)}>
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}

export function ManagerDashboard({
  reports,
  loading,
  error,
  onReload,
}: {
  reports: RiskReport[]
  loading: boolean
  error: string | null
  onReload: () => void
}) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')
  const [department, setDepartment] = useState('all')
  const [level, setLevel] = useState('all')
  const [cell, setCell] = useState<{ probability: number; impact: number } | null>(null)
  const [selected, setSelected] = useState<RiskReport | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return reports.filter((r) => {
      if (status !== 'all' && r.status !== status) return false
      if (category !== 'all' && r.category !== category) return false
      if (department !== 'all' && r.department !== department) return false
      if (level !== 'all' && levelKey(r.score) !== level) return false
      if (cell && (r.probability !== cell.probability || r.impact !== cell.impact)) return false
      if (!q) return true
      return [r.title, r.description, r.suggestion, r.reporterName, r.department, r.location ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [reports, search, status, category, department, level, cell])

  const stats = useMemo(() => {
    const total = reports.length
    const pending = reports.filter((r) => r.status === 'new' || r.status === 'reviewing').length
    const critical = reports.filter((r) => r.score >= 15).length
    const implemented = reports.filter((r) => r.status === 'implemented').length
    const avg = total ? reports.reduce((s, r) => s + r.score, 0) / total : 0
    return { total, pending, critical, implemented, avg }
  }, [reports])

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of reports) map.set(r.category, (map.get(r.category) ?? 0) + 1)
    return [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7)
  }, [reports])

  const byStatus = useMemo(() => {
    return STATUSES.map((s) => ({
      name: s.label,
      value: reports.filter((r) => r.status === s.value).length,
      key: s.value,
    })).filter((s) => s.value > 0)
  }, [reports])

  const activeFilters =
    (status !== 'all' ? 1 : 0) +
    (category !== 'all' ? 1 : 0) +
    (department !== 'all' ? 1 : 0) +
    (level !== 'all' ? 1 : 0) +
    (cell ? 1 : 0) +
    (search.trim() ? 1 : 0)

  function resetFilters() {
    setSearch('')
    setStatus('all')
    setCategory('all')
    setDepartment('all')
    setLevel('all')
    setCell(null)
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi
          label="کل پیشنهادات"
          value={stats.total}
          icon={<ShieldAlert className="h-4 w-4 text-indigo-600" />}
          tone="bg-indigo-50"
        />
        <Kpi
          label="در انتظار بررسی"
          value={stats.pending}
          icon={<Clock className="h-4 w-4 text-amber-600" />}
          tone="bg-amber-50"
        />
        <Kpi
          label="ریسک بحرانی"
          value={stats.critical}
          hint="امتیاز ۱۵ و بالاتر"
          icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
          tone="bg-red-50"
        />
        <Kpi
          label="میانگین امتیاز"
          value={stats.avg.toFixed(1)}
          icon={<TrendingUp className="h-4 w-4 text-sky-600" />}
          tone="bg-sky-50"
        />
        <Kpi
          label="اجرا شده"
          value={stats.implemented}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          tone="bg-emerald-50"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">ماتریس ریسک</CardTitle>
            <CardDescription className="text-xs">
              برای فیلتر روی هر خانه کلیک کنید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RiskMatrix reports={reports} onSelectCell={setCell} activeCell={cell} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">پیشنهادات بر اساس دسته‌بندی</CardTitle>
          </CardHeader>
          <CardContent className="h-[220px]">
            {byCategory.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCategory} layout="vertical" margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={90}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v} مورد`, 'تعداد']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, direction: 'rtl' }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">وضعیت بررسی</CardTitle>
          </CardHeader>
          <CardContent className="h-[220px]">
            {byStatus.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byStatus}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    {byStatus.map((s) => (
                      <Cell key={s.key} fill={STATUS_COLORS[s.key]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number, n: string) => [`${v} مورد`, n]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, direction: 'rtl' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
              {byStatus.map((s) => (
                <span key={s.key} className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[s.key] }}
                  />
                  {s.name} ({s.value})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-3 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm">فهرست پیشنهادات</CardTitle>
              <CardDescription className="text-xs">
                {filtered.length} مورد از {reports.length} پیشنهاد
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onReload} disabled={loading} className="gap-1.5">
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                به‌روزرسانی
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => downloadCsv(filtered)}
                disabled={filtered.length === 0}
              >
                <Download className="h-3.5 w-3.5" />
                خروجی اکسل
              </Button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجو در عنوان، شرح، راهکار…"
                className="h-9 pr-8 text-xs"
              />
            </div>
            <div className="relative">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 text-xs">
                  {status === 'all' ? 'همه وضعیت‌ها' : statusMeta(status).label}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 text-xs">
                  {category === 'all' ? 'همه دسته‌ها' : category}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه دسته‌ها</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative">
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="h-9 text-xs">
                  {department === 'all' ? 'همه واحدها' : department}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه واحدها</SelectItem>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative">
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="h-9 text-xs">
                  {level === 'all' ? 'همه سطوح' : LEVELS[level as 'low'].label}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه سطوح</SelectItem>
                  {(['critical', 'high', 'medium', 'low'] as const).map((k) => (
                    <SelectItem key={k} value={k}>
                      {LEVELS[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {activeFilters > 0 && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Filter className="h-3 w-3" />
                {activeFilters} فیلتر فعال
              </span>
              <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-[11px]" onClick={resetFilters}>
                <X className="h-3 w-3" />
                حذف فیلترها
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {error && (
            <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          {loading && reports.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              در حال بارگذاری…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400">
              پیشنهادی با این فیلترها یافت نشد.
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-right text-xs">
                  <thead className="border-y bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">کد</th>
                      <th className="px-3 py-2 font-medium">عنوان ریسک</th>
                      <th className="px-3 py-2 font-medium">دسته</th>
                      <th className="px-3 py-2 font-medium">واحد</th>
                      <th className="px-3 py-2 font-medium">گزارش‌دهنده</th>
                      <th className="px-3 py-2 text-center font-medium">امتیاز</th>
                      <th className="px-3 py-2 font-medium">سطح</th>
                      <th className="px-3 py-2 font-medium">وضعیت</th>
                      <th className="px-3 py-2 font-medium">تاریخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const lv = levelOf(r.score)
                      const st = statusMeta(r.status)
                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelected(r)}
                          className="cursor-pointer border-b transition-colors last:border-0 hover:bg-slate-50"
                        >
                          <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[10px] text-slate-400">
                            {shortCode(r.id)}
                          </td>
                          <td className="max-w-[240px] px-3 py-2.5">
                            <p className="truncate font-medium text-slate-800">{r.title}</p>
                            {r.location && (
                              <p className="truncate text-[10px] text-slate-400">{r.location}</p>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{r.category}</td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{r.department}</td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{r.reporterName}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={cn('text-sm font-bold', lv.text)}>{r.score}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={cn(
                                'inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                                lv.badge,
                              )}
                            >
                              {lv.label}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={cn(
                                'inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                                st.className,
                              )}
                            >
                              {st.label}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-[10px] text-slate-400">
                            {formatDate(r.createdAt)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y md:hidden">
                {filtered.map((r) => {
                  const lv = levelOf(r.score)
                  const st = statusMeta(r.status)
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelected(r)}
                      className="w-full space-y-2 p-4 text-right transition-colors hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800">{r.title}</p>
                        <span className={cn('shrink-0 text-sm font-bold', lv.text)}>{r.score}</span>
                      </div>
                      <p className="line-clamp-2 text-xs text-slate-500">{r.description}</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', lv.badge)}>
                          {lv.label}
                        </span>
                        <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', st.className)}>
                          {st.label}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {r.department} · {formatDate(r.createdAt)}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ReportDialog
        report={selected}
        onClose={() => setSelected(null)}
        onChanged={() => {
          setSelected(null)
          onReload()
        }}
      />
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-xs text-slate-400">
      هنوز داده‌ای ثبت نشده است
    </div>
  )
}

function ReportDialog({
  report,
  onClose,
  onChanged,
}: {
  report: RiskReport | null
  onClose: () => void
  onChanged: () => void
}) {
  const [status, setStatus] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const open = Boolean(report)
  const currentId = report?.id

  // Reset local state whenever a different report is opened.
  const [lastId, setLastId] = useState<string | undefined>(undefined)
  if (currentId !== lastId) {
    setLastId(currentId)
    setStatus(report?.status ?? 'new')
    setNote(report?.managerNote ?? '')
    setConfirmDelete(false)
    setErr(null)
  }

  if (!report) {
    return <Dialog open={false} onOpenChange={() => {}} />
  }

  const lv = levelOf(report.score)

  async function save() {
    setSaving(true)
    setErr(null)
    try {
      await updateReport(report!.id, { status, managerNote: note.trim() || null })
      onChanged()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'ذخیره تغییرات انجام نشد.')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    setSaving(true)
    setErr(null)
    try {
      await deleteReport(report!.id)
      onChanged()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'حذف انجام نشد.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base leading-relaxed">{report.title}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono">{shortCode(report.id)}</span>
            <span>·</span>
            <span>{formatDateTime(report.createdAt)}</span>
            <span>·</span>
            <span>{report.category}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MiniStat label="احتمال" value={String(report.probability)} />
            <MiniStat label="شدت" value={String(report.impact)} />
            <MiniStat label="امتیاز" value={String(report.score)} />
            <div className="rounded-lg border bg-slate-50 p-2 text-center">
              <p className="text-[10px] text-slate-500">سطح</p>
              <span className={cn('mt-0.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold', lv.badge)}>
                {lv.label}
              </span>
            </div>
          </div>

          <div className="grid gap-2 rounded-lg border bg-slate-50/60 p-3 text-xs sm:grid-cols-2">
            <Info label="گزارش‌دهنده" value={report.reporterName} />
            <Info label="واحد سازمانی" value={report.department} />
            <Info label="سمت" value={report.position || '—'} />
            <Info label="راه ارتباطی" value={report.contact || '—'} />
            <Info label="محل / موقعیت" value={report.location || '—'} />
          </div>

          <Section title="شرح ریسک" body={report.description} />
          <Section title="خطرات و پیامدهای احتمالی" body={report.hazards || '—'} />
          <Section title="راهکار پیشنهادی" body={report.suggestion} tone="emerald" />

          <div className="space-y-3 rounded-lg border p-3">
            <p className="text-xs font-semibold text-slate-700">بررسی مدیر</p>
            <div className="relative space-y-1.5">
              <Label className="text-xs text-slate-600">وضعیت</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 text-xs">
                  {statusMeta(status).label}
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">یادداشت / اقدام انجام‌شده</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="text-xs"
                placeholder="مثال: ارجاع به واحد فنی، بازدید در تاریخ …"
              />
            </div>
            {err && <p className="text-xs text-red-600">{err}</p>}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <Button variant="destructive" size="sm" onClick={remove} disabled={saving} className="gap-1.5">
                <Trash2 className="h-3.5 w-3.5" />
                تأیید حذف
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                انصراف
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              حذف
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              بستن
            </Button>
            <Button size="sm" onClick={save} disabled={saving} className="gap-1.5">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              ذخیره تغییرات
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-2 text-center">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className="text-sm font-bold text-slate-800">{value}</p>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  )
}

function Section({ title, body, tone }: { title: string; body: string; tone?: 'emerald' }) {
  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        tone === 'emerald' ? 'border-emerald-200 bg-emerald-50/50' : 'bg-white',
      )}
    >
      <p className="mb-1 text-xs font-semibold text-slate-700">{title}</p>
      <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-600">{body}</p>
    </div>
  )
}
