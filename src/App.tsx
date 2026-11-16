import { useCallback, useEffect, useState } from 'react'
import { LayoutDashboard, ShieldCheck, Send } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RiskForm } from '@/components/RiskForm'
import { ManagerDashboard } from '@/components/ManagerDashboard'
import { listReports } from '@/lib/api'
import type { RiskReport } from '@/lib/risk'

export default function App() {
  const [tab, setTab] = useState('submit')
  const [reports, setReports] = useState<RiskReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setReports(await listReports())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'دریافت اطلاعات انجام نشد.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-sm">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black leading-tight text-slate-900">
                سامانه پیشنهادات ارزیابی ریسک
              </h1>
              <p className="text-xs text-slate-500">
                ثبت مشاهدات کارکنان، خطرات و راهکارهای بهبود
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
              نسخه ۱.۰
            </span>
            <span className="hidden sm:inline">داده‌ها به‌صورت محلی ذخیره می‌شوند</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-5 grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="submit" className="gap-1.5">
              <Send className="h-3.5 w-3.5" />
              ثبت پیشنهاد
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-1.5">
              <LayoutDashboard className="h-3.5 w-3.5" />
              داشبورد مدیریت
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submit">
            <RiskForm onSubmitted={load} />
          </TabsContent>

          <TabsContent value="dashboard">
            <ManagerDashboard reports={reports} loading={loading} error={error} onReload={load} />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-8 pt-2 text-center text-[11px] text-slate-400 sm:px-6">
        پیشنهادات کارکنان نقش کلیدی در شناسایی ریسک‌های پنهان سازمان دارند.
      </footer>
    </div>
  )
}
