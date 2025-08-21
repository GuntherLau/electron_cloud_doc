
const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const isDev = require('electron-is-dev')
const menuTemplate = require('./src/utils/menuTemplate')
const AppWindow = require('./AppWindow')
const path = require('path')
const Store = require('electron-store')
const fileStore = new Store({'name': 'Files Data'})
const settingsStore = new Store({'name': 'Settings'})

// Initialize @electron/remote in main process
const remoteMain = require('@electron/remote/main')
remoteMain.initialize()

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

    console.log('process.versions.node:', process.versions.node)
    console.log('process.versions.electron:', process.versions.electron)

    let mainWindowConfig = {
        width: 1024,
        height: 680,
        minHeight: 680,
        minWidth: 1024

    }
    let urlLocation = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, './index.html')}`

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
        console.log('upload-file', data)
        const manager = createManager()
        manager.uploadFile(data.key, data.path).then(uploadFileData => {
            console.log('上传成功', uploadFileData)

            //  更新文件元数据
            console.log('更新文件元数据', data)
            manager.putMeta(data.key, {
                id: data.id,
                title: data.title,
                createAt: data.createAt,
                path: data.path
            }).then((putMetaData) => {
                console.log('putMeta成功', putMetaData)
                mainWindow.webContents.send('active-file-uploaded')
            })
        }).catch(e => {
            console.log(e)
            dialog.showErrorBox('同步失败','请检查阿里云同步参数是否正确')
        })
    })

    ipcMain.on('download-file', (event, data) => {
        console.log('download-file==========>>>', data)
        const manager = createManager()
        manager.isExistObject(data.key).then((isExistObjectData) => {
            console.log('isExistObject', isExistObjectData)
            // console.log(data.key, data.path)
            let serverUpdatedTime = new Date(isExistObjectData.res.headers['last-modified']).getTime()
            let localUpdatedTime = fileStore.get('files')[data.id].updatedAt

            if(serverUpdatedTime > localUpdatedTime || !localUpdatedTime) {
                manager.downloadFile(data.key, data.path).then((downloadFileData) => {
                    console.log('download-file-success', downloadFileData)
                    mainWindow.webContents.send('file-download', { ...data, status: 'download-file-success'})
                }).catch(e => {
                    console.log('云端文件下载失败', e)
                    mainWindow.webContents.send('file-download', { ...data, status: 'download file fail'})
                })
            } else {
                mainWindow.webContents.send('file-download', { ...data, status: 'no new file'})
            }
        }).catch(e => {
            if(e.status === 404) {
                console.log('云端文件不存在', e)
                mainWindow.webContents.send('file-download', { ...data, status: 'Object not exists'})
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
        mainWindow.webContents.send('loading-status', true)

        let newFiles = fileStore.get('files')
        console.log('newFiles', newFiles)

        let defaultSavePath = settingsStore.get('#saved-file-location')
        console.log('savedFileLocation', defaultSavePath)

        const manager = createManager()
        manager.objects().then((list) => {
            // console.log('objects', list)
            /*
            let arr = []
            list.forEach(async obj => {

                let objectName = obj.name

                await manager.isExistObject(objectName).then(async isExistObjectData => {
                    console.log('正在下载', objectName, isExistObjectData.meta)
                    
                    
                    // console.log('downloadFile ========== >', isExistObjectData.meta.title)
                    
                    
                    
                    // let localExist = !!newFile
                    await manager.downloadFile(objectName, path.join(defaultSavePath, objectName))
                })
            })
            console.log('下载完成')
            // mainWindow.webContents.send('file-all-download', arr)
            mainWindow.webContents.send('loading-status', false)
            dialog.showMessageBox({
                type: 'info',
                title: '下载完成',
                message: `下载完成，总计下载${list.length}个文件`
            })

            */

            let newFiles = []
            const downloadPromiseArr = list.map(async obj => {
                let objectName = obj.name
                return new Promise(async (resolve, reject) => {
                    await manager.isExistObject(objectName).then(async isExistObjectData => {
                        await manager.downloadFile(objectName, path.join(defaultSavePath, objectName)).then(() => {
                            console.log(isExistObjectData.meta)
                            newFiles[isExistObjectData.meta.id] = {
                                id: isExistObjectData.meta.id,
                                title: isExistObjectData.meta.title,
                                createAt: isExistObjectData.meta.createAt,
                                path: isExistObjectData.meta.path,
                                isLoaded: false
                            }
                            resolve()
                        })
                    })
                })
            })
            Promise.all(downloadPromiseArr).then((result) => {
                console.log('download-all-to-local 下载完成', result)
                console.log('********************************')
                console.log('newFiles', newFiles)
                // result.forEach(obj => {
                //     console.log(obj.res.headers)
                // })
                mainWindow.webContents.send('all-file-download', newFiles)
                mainWindow.webContents.send('loading-status', false)
                dialog.showMessageBox({
                    type: 'info',
                    title: '下载完成',
                    message: `下载完成，总计下载${list.length}个文件`
                })
            }).catch(e => {
                dialog.showErrorBox('同步失败','请检查阿里云同步参数是否正确')
            }).finally(() => {
                mainWindow.webContents.send('loading-status', false)
            })


            
        })
    })

    ipcMain.on('update-fileName', (event, data) => {
        console.log('update-fileName', data)
        mainWindow.webContents.send('loading-status', true)
        const manager = createManager()
        manager.deleteFile(path.basename(data.oldPath)).then(() => {
            manager.uploadFile(path.basename(data.newPath), data.newPath).then(() => {
                console.log('重命名完成')
                mainWindow.webContents.send('loading-status', false)
            })
        })
    })

    ipcMain.on('delete-file', (event, data) => {
        mainWindow.webContents.send('loading-status', true)
        const manager = createManager()
        const objectName = path.basename(data.path)
        manager.isExistObject(objectName).then((isExistObjectData) => {
            manager.deleteFile(objectName).then(() => {
                console.log('删除成功')
                mainWindow.webContents.send('loading-status', false)
            })
        }).catch(() => {
            console.log('云端文件不存在')
            mainWindow.webContents.send('loading-status', false)
        })
    })
    
})