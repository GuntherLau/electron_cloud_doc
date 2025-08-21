import { useEffect } from 'react';

const { ipcRenderer } = window.require('electron');

interface KeyCallbackMap {
  [key: string]: (...args: any[]) => void;
}

const useIpcRenderer = (keyCallbackMap: KeyCallbackMap): void => {
  useEffect(() => {
    // Add event listeners
    Object.keys(keyCallbackMap).forEach(key => {
      ipcRenderer.on(key, keyCallbackMap[key]);
    });

    return () => {
      // Remove event listeners on cleanup
      Object.keys(keyCallbackMap).forEach(key => {
        ipcRenderer.removeListener(key, keyCallbackMap[key]);
      });
    };
  }, [keyCallbackMap]);
};

export default useIpcRenderer;