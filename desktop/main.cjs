const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

const DEFAULT_SERVER_URL =
  'https://4a28f8c9-4566-4d2a-b5a2-09ff6d89122a.preview.shogo.ai/p/4a28f8c9-4566-4d2a-b5a2-09ff6d89122a/'

let mainWindow = null
let settingsWindow = null

function configPath() {
  return path.join(app.getPath('userData'), 'config.json')
}

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath(), 'utf8'))
  } catch {
    return {}
  }
}

function writeConfig(patch) {
  const next = { ...readConfig(), ...patch }
  fs.mkdirSync(path.dirname(configPath()), { recursive: true })
  fs.writeFileSync(configPath(), JSON.stringify(next, null, 2), 'utf8')
  return next
}

function serverUrl() {
  const fromEnv = process.env.RISK_SERVER_URL
  const fromConfig = readConfig().serverUrl
  const url = (fromEnv || fromConfig || DEFAULT_SERVER_URL).trim()
  return url.endsWith('/') ? url : `${url}/`
}

function errorPage(url, description) {
  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>عدم دسترسی به سرور</title>
<style>
  body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;
       font-family:'Segoe UI',Tahoma,sans-serif;background:#f8fafc;color:#0f172a}
  .box{max-width:520px;padding:32px;text-align:center}
  h1{font-size:20px;margin:0 0 8px}
  p{color:#64748b;font-size:13px;line-height:1.9;margin:0 0 6px}
  code{background:#e2e8f0;padding:2px 6px;border-radius:4px;font-size:12px;direction:ltr;display:inline-block}
  button{margin-top:20px;padding:9px 22px;border:0;border-radius:8px;background:#4f46e5;color:#fff;
         font-size:13px;cursor:pointer;font-family:inherit}
  button:hover{background:#4338ca}
</style></head>
<body><div class="box">
  <h1>اتصال به سرور برقرار نشد</h1>
  <p>آدرس سرور: <code>${url}</code></p>
  <p>${description || 'اینترنت یا دسترسی به شبکه سازمان را بررسی کنید.'}</p>
  <button onclick="location.reload()">تلاش مجدد</button>
</div></body></html>`
  return 'data:text/html;charset=utf-8,' + encodeURIComponent(html)
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 900,
    minHeight: 640,
    backgroundColor: '#f8fafc',
    title: 'سامانه پیشنهادات ارزیابی ریسک',
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const url = serverUrl()
  mainWindow.loadURL(url)

  mainWindow.webContents.on('did-fail-load', (_e, code, desc, failedUrl) => {
    if (code === -3) return // aborted, usually a redirect
    mainWindow.loadURL(errorPage(failedUrl || url, desc))
  })

  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    shell.openExternal(target)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function openSettings() {
  if (settingsWindow) {
    settingsWindow.focus()
    return
  }

  settingsWindow = new BrowserWindow({
    width: 560,
    height: 320,
    resizable: false,
    parent: mainWindow ?? undefined,
    modal: Boolean(mainWindow),
    title: 'تنظیم آدرس سرور',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  settingsWindow.setMenuBarVisibility(false)
  settingsWindow.loadFile(path.join(__dirname, 'settings.html'))
  settingsWindow.on('closed', () => {
    settingsWindow = null
  })
}

function buildMenu() {
  const template = [
    {
      label: 'فایل',
      submenu: [
        { label: 'تنظیم آدرس سرور…', click: openSettings },
        {
          label: 'بازخوانی صفحه',
          accelerator: 'F5',
          click: () => mainWindow?.reload(),
        },
        { type: 'separator' },
        { label: 'خروج', role: 'quit' },
      ],
    },
    {
      label: 'نمایش',
      submenu: [
        { label: 'بزرگ‌نمایی', role: 'zoomIn' },
        { label: 'کوچک‌نمایی', role: 'zoomOut' },
        { label: 'اندازه اصلی', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'تمام‌صفحه', role: 'togglefullscreen' },
        { label: 'ابزار توسعه‌دهنده', role: 'toggleDevTools' },
      ],
    },
    {
      label: 'راهنما',
      submenu: [
        {
          label: 'درباره برنامه',
          click: () =>
            dialog.showMessageBox(mainWindow ?? undefined, {
              type: 'info',
              title: 'درباره برنامه',
              message: 'سامانه پیشنهادات ارزیابی ریسک',
              detail:
                'نسخه ۱.۰ — ثبت مشاهدات کارکنان، خطرات و راهکارهای بهبود.\n' +
                `آدرس سرور: ${serverUrl()}`,
              buttons: ['بستن'],
            }),
        },
      ],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

ipcMain.handle('config:get', () => serverUrl())

ipcMain.handle('config:set', (_event, value) => {
  const raw = String(value ?? '').trim()
  if (!/^https?:\/\//i.test(raw)) {
    return { ok: false, error: 'آدرس باید با http:// یا https:// شروع شود.' }
  }
  writeConfig({ serverUrl: raw })
  if (mainWindow) mainWindow.loadURL(serverUrl())
  return { ok: true, url: serverUrl() }
})

ipcMain.on('settings:close', () => {
  settingsWindow?.close()
})

app.whenReady().then(() => {
  buildMenu()
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
