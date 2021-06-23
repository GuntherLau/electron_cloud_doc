
const { remote, ipcRenderer } = require('electron')
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
    $('#select-new-location').addEventListener('click', () => {
        ipcRenderer.send('settings-select-new-location', 'select-new-location clicked')
        remote.dialog.showOpenDialog({
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
                ipcRenderer.send('settings-saveToStore', selector, value)
            }
        })

        ipcRenderer.send('settings-saveToStore', '#saved-file-location', $('#saved-file-location').value)
        remote.getCurrentWindow().close()
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
            remote.getCurrentWindow().setBounds({ height: 550 })
        } else {
            remote.getCurrentWindow().setBounds({ height: 280 })
        }
    })

    ipcRenderer.on('settings-request-update-success', (event, settingsStore) => {
        Object.keys(settingsStore).forEach(key => {
            if($(key)) {
                $(key).value = settingsStore[key]
            }
        })
    })
    ipcRenderer.send('settings-request-update')
    
})