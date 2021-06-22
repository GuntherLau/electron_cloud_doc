import { useEffect } from 'react'
const { ipcRenderer } = window.require('electron')

// const obj = {
//     'create-new-file': () => {},
//     'save-edit-file': () => {}
// }
const useIpcRenderer = (keyCallbackMap) => {

    useEffect(() => {
        // ipcRenderer.on(eventName, createNewFile)

        Object.keys(keyCallbackMap).forEach(key => {
            ipcRenderer.on(key, keyCallbackMap[key])
        })

        return () => {
            // ipcRenderer.removeListener(eventName, createNewFile)

            Object.keys(keyCallbackMap).forEach(key => {
                ipcRenderer.removeListener(key, keyCallbackMap[key])
            })
        }
    })

}

export default useIpcRenderer