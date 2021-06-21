
// require('@electron/remote/main').initialize()
const { app, BrowserWindow } = require('electron')
const isDev = require('electron-is-dev')


let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 680,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false,
            preload: __dirname + '/preload.js'
        }
    })

    let urlLocation = isDev ? 'http://localhost:3000' : ""

    mainWindow.loadURL(urlLocation)
})