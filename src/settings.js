
const { remote, ipcRenderer } = require('electron')
const { dialog, getCurrentWindow, app } = require('@electron/remote')
const Store = require('electron-store')
const settingsStore = new Store({'name': 'Settings'})
const aliOssConfigArr = [
    '#settings-Region',
    '#settings-AccessKeyId',
    '#settings-AccessKeySecret',
    '#settings-Bucket'
]

const $ = (selector) => {
    const result = document.querySelectorAll(selector)
    return result.length > 1 ? result : result[0]
}

document.addEventListener('DOMContentLoaded', () => {

    Object.keys(settingsStore.store).forEach(key => {
        if($(key)) {
            $(key).value = settingsStore.store[key]
        }
    })

    $('#select-new-location').addEventListener('click', () => {
        ipcRenderer.send('settings-select-new-location', 'select-new-location clicked')
        dialog.showOpenDialog({
            properties: ['openDirectory'],
            message: '选择文件的储存路径'
        }).then(result => {
            if(!result.canceled && Array.isArray(result.filePaths)) {
                $('#saved-file-location').value = result.filePaths[0]
            }
        })
    })

    $('#settings-form').addEventListener('submit', (e) => {
        

        aliOssConfigArr.forEach(selector => {
            if($(selector)) {
                let { id, value } = $(selector)
                settingsStore.set(selector, value)
            }
        })

        settingsStore.set('#saved-file-location', $('#saved-file-location').value)
        ipcRenderer.send('config-is-saved')
        getCurrentWindow().close()
    })

    $('#pills-tab').addEventListener('click', (e) => {
        e.preventDefault()
        $('.nav-link').forEach(element => {
            element.classList.remove('active')
        })
        e.target.classList.add('active')

        $('.tab-pane').forEach(element => {
            element.style.display = 'none'
        })
        $(e.target.dataset.tab).style.display = 'block'

        if(e.target.dataset.tab === '#aliyun-sync-params') {
            getCurrentWindow().setBounds({ height: 550 })
        } else {
            getCurrentWindow().setBounds({ height: 280 })
        }
    })
    
})