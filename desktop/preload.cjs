const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('riskDesktop', {
  getServerUrl: () => ipcRenderer.invoke('config:get'),
  saveServerUrl: (url) => ipcRenderer.invoke('config:set', url),
  closeSettings: () => ipcRenderer.send('settings:close'),
})
