
const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const isDev = require('electron-is-dev')
const menuTemplate = require('./src/utils/menuTemplate')
const AppWindow = require('./AppWindow')
const path = require('path')
const Store = require('electron-store')
const settingsStore = new Store({'name': 'Settings'})

const AliOssManager = require('./src/utils/AliOssManager')
const createManager = () => {
    const Region = settingsStore.get('#settings-Region')
    const AccessKeyId = settingsStore.get('#settings-AccessKeyId')
    const AccessKeySecret = settingsStore.get('#settings-AccessKeySecret')
    const Bucket = settingsStore.get('#settings-Bucket')
    return new AliOssManager(Region, AccessKeyId, AccessKeySecret, Bucket)
}

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

    let menu = Menu.buildFromTemplate(menuTemplate)
    Menu.setApplicationMenu(menu)
    mainWindow.toggleDevTools()

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

    ipcMain.on('config-is-saved', (event) => {
        let aliMenu = process.platform === 'darwin' ? menu.items[4] : menu.items[3]

        const switchItems = (toggle) => {
            [1,2,3].forEach(number => {
                aliMenu.submenu.items[number].enabled = toggle
            })
        }
        const aliIsConfig = [
            '#settings-Region',
            '#settings-AccessKeyId',
            '#settings-AccessKeySecret',
            '#settings-Bucket'
        ].every(key =>  !!settingsStore.get(key) )
        
        if(aliIsConfig) {
            switchItems(true)
        } else {
            switchItems(false)
        }
    })

    ipcMain.on('upload-file', (event, data) => {
        const manager = createManager()
        manager.uploadFile(data.key, data.path).then(data => {
            console.log('上传成功', data)
            mainWindow.webContents.send('active-file-uploaded')
        }).catch(e => {
            console.log(e)
            dialog.showErrorBox('同步失败','请检查阿里云同步参数是否正确')
        })
    })
    
})