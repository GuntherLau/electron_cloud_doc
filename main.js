
const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const isDev = require('electron-is-dev')
const menuTemplate = require('./src/utils/menuTemplate')
const AppWindow = require('./AppWindow')
const path = require('path')
const Store = require('electron-store')
const fileStore = new Store({'name': 'Files Data'})
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

    ipcMain.on('download-file', (event, data) => {
        const manager = createManager()
        manager.isExistObject(data.key).then((isExistObjectData) => {
            // console.log('isExistObject', isExistObjectData)
            // console.log(data.key, data.path)
            let serverUpdatedTime = new Date(isExistObjectData.res.headers['last-modified']).getTime()
            let localUpdatedTime = fileStore.get('files')[data.id].updatedAt
            
            if(serverUpdatedTime > localUpdatedTime || !localUpdatedTime) {
                manager.downloadFile(data.key, data.path).then((downloadFileData) => {
                    mainWindow.webContents.send('file-download', { id: data.id, status: 'download-file-success'})
                }).catch(e => {
                    console.log('云端文件下载失败', e)
                    mainWindow.webContents.send('file-download', { id: data.id, status: 'download file fail'})
                })
            } else {
                mainWindow.webContents.send('file-download', { id: data.id, status: 'no new file'})
            }
        }).catch(e => {
            if(e.status === 404) {
                console.log('云端文件不存在', e)
                mainWindow.webContents.send('file-download', { id: data.id, status: 'Object not exists'})
            }
        })
    })

    ipcMain.on('upload-all-to-aliyun', (event) => {
        mainWindow.webContents.send('loading-status', true)

        const manager = createManager()
        const filesObj = fileStore.get('files') || {}
        const uploadPromiseArr = Object.keys(filesObj).map(key => {
            const file = filesObj[key]
            return manager.uploadFile(`${file.title}.md`, file.path)
        })
        Promise.all(uploadPromiseArr).then((result) => {
            console.log('upload-all-to-aliyun 上传成功')
            dialog.showMessageBox({
                type: 'info',
                title: '上传成功',
                message: `成功上传了${result.length}个文件`
            })
            mainWindow.webContents.send('file-upload')
        }).catch(e => {
            dialog.showErrorBox('同步失败','请检查阿里云同步参数是否正确')
        }).finally(() => {
            mainWindow.webContents.send('loading-status', false)
        })
    })

    ipcMain.on('download-all-to-local', (event) => {

    })
    
})