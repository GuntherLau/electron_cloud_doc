
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
            height: 400,
            parent: mainWindow
        }
        const settingsFileLocation = `file://${path.join(__dirname, './public/settings.html')}`
        settingsWindow = new AppWindow(settingsWindowConfig, settingsFileLocation)
        settingsWindow.on('close', () => {
            settingsWindow = null
        })
    })

    ipcMain.on('settings-request-savedFileLocation', (event) => {
        event.sender.send('settings-request-savedFileLocation-success', settingsStore.get('savedFileLocation'))
    })

    ipcMain.on('settings-update-savedFileLocation', (event, savedFileLocation) => {
        settingsStore.set('savedFileLocation', savedFileLocation)
    })

    const menu = Menu.buildFromTemplate(menuTemplate)
    Menu.setApplicationMenu(menu)
    mainWindow.toggleDevTools()
})