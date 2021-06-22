
const { remote, ipcRenderer } = require('electron')

const $ = (id) => {
    return document.getElementById(id)
}

document.addEventListener('DOMContentLoaded', () => {
    let saveLocation = null
    $('select-new-location').addEventListener('click', () => {
        ipcRenderer.send('settings-select-new-location', 'select-new-location clicked')
        remote.dialog.showOpenDialog({
            properties: ['openDirectory'],
            message: '选择文件的储存路径'
        }).then(result => {
            if(!result.canceled && Array.isArray(result.filePaths)) {
                $('saved-file-location').value = result.filePaths[0]
                saveLocation = result.filePaths[0]
                
            }
        })
    })

    $('settings-form').addEventListener('submit', () => {
        ipcRenderer.send('settings-update-savedFileLocation', saveLocation)
        remote.getCurrentWindow().close()
    })

    ipcRenderer.on('settings-request-savedFileLocation-success', (event, savedFileLocation) => {
        if(savedFileLocation) {
            saveLocation = savedFileLocation
            $('saved-file-location').value = savedFileLocation
        }  
    })
    ipcRenderer.send('settings-request-savedFileLocation')
    
})