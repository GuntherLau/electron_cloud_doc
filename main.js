
const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const isDev = require('electron-is-dev')
const menuTemplate = require('./src/utils/menuTemplate')
const AppWindow = require('./AppWindow')
const path = require('path')
const Store = require('electron-store')
const settingsStore = new Store({'name': 'Settings'})

let mainWindow, settingsWindow;

app.on('ready', () => {
    let mainWindowConfig = {
        width: 1024,
        height: 680
    }
    let urlLocation = isDev ? 'http://localhost:3000' : ""

    mainWindow = new AppWindow(mainWindowConfig, urlLocation)
    mainWindow.on('close', () => {
        mainWindow = null
    })

    ipcMain.on('open-settings-window', () => {
        const settingsWindowConfig = {
            width: 500,
            height: 280,
            parent: mainWindow,
        }
        const settingsFileLocation = `file://${path.join(__dirname, './public/settings.html')}`
        settingsWindow = new AppWindow(settingsWindowConfig, settingsFileLocation)
        settingsWindow.removeMenu()
        settingsWindow.on('close', () => {
            settingsWindow = null
        })
    })

    ipcMain.on('settings-request-update', (event) => {
        console.log('settingsStore.store', settingsStore.store)
        event.sender.send('settings-request-update-success', settingsStore.store)
    })

    ipcMain.on('settings-saveToStore', (event, key, value) => {
        settingsStore.set(key, value)
        console.log('settingsStore.store', settingsStore.store)
    })

    const menu = Menu.buildFromTemplate(menuTemplate)
    Menu.setApplicationMenu(menu)
    mainWindow.toggleDevTools()
})