import { app, Menu, ipcMain, dialog, BrowserWindow } from 'electron';
const isDev = require('electron-is-dev');
const menuTemplate = require('./src/utils/menuTemplate');
const AppWindow = require('./AppWindow');
import * as path from 'path';
const Store = require('electron-store');
const AliOssManager = require('./src/utils/AliOssManager');
import { IpcMessage } from './src/types';

const fileStore = new Store({ name: 'Files Data' });
const settingsStore = new Store({ name: 'Settings' });

// Initialize @electron/remote in main process
const remoteMain = require('@electron/remote/main');
remoteMain.initialize();

const createManager = (): any => {
  const Region = settingsStore.get('#settings-Region') as string;
  const AccessKeyId = settingsStore.get('#settings-AccessKeyId') as string;
  const AccessKeySecret = settingsStore.get('#settings-AccessKeySecret') as string;
  const Bucket = settingsStore.get('#settings-Bucket') as string;
  return new AliOssManager(Region, AccessKeyId, AccessKeySecret, Bucket);
};

let mainWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;

app.on('ready', () => {
  console.log('process.versions.node:', process.versions.node);
  console.log('process.versions.electron:', process.versions.electron);

  const mainWindowConfig = {
    width: 1024,
    height: 680,
    minHeight: 680,
    minWidth: 1024
  };

  const urlLocation = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, './index.html')}`;

  mainWindow = new AppWindow(mainWindowConfig, urlLocation);
  mainWindow!.on('close', () => {
    mainWindow = null;
  });

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
  if (isDev) {
    mainWindow!.webContents.openDevTools();
  }

  ipcMain.on('open-settings-window', () => {
  const settingsWindowConfig = {
    width: 500,
    height: 280,
    parent: mainWindow!
  };
    const settingsFileLocation = `file://${path.join(__dirname, './public/settings.html')}`;
    settingsWindow = new AppWindow(settingsWindowConfig, settingsFileLocation);
    settingsWindow!.removeMenu();
    settingsWindow!.on('close', () => {
      settingsWindow = null;
    });
  });

  ipcMain.on('settings-request-update', (event) => {
    console.log('settingsStore.store', settingsStore.store);
    event.sender.send('settings-request-update-success', settingsStore.store);
  });

  ipcMain.on('config-is-saved', (event) => {
    const aliMenu = process.platform === 'darwin' ? menu.items[4] : menu.items[3];

    const switchItems = (toggle: boolean) => {
      [1, 2, 3].forEach(number => {
        if (aliMenu.submenu?.items[number]) {
          aliMenu.submenu.items[number].enabled = toggle;
        }
      });
    };

    const aliIsConfig = [
      '#settings-Region',
      '#settings-AccessKeyId',
      '#settings-AccessKeySecret',
      '#settings-Bucket'
    ].every(key => !!settingsStore.get(key));

    if (aliIsConfig) {
      switchItems(true);
    } else {
      switchItems(false);
    }
  });

  ipcMain.on('upload-file', (event, data: IpcMessage) => {
    console.log('upload-file', data);
    const manager = createManager();
    manager.uploadFile(path.basename(data.path!), data.path!).then((result: any) => {
      console.log('上传成功');
      mainWindow?.webContents.send('active-file-uploaded');
    }).catch((error: any) => {
      console.log('error:', error);
    });
  });

  ipcMain.on('download-file', (event, data: IpcMessage) => {
    const manager = createManager();
    const savePath = settingsStore.get('savedFileLocation') || app.getPath('documents');
    manager.downloadFile(data.id, path.join(savePath as string, `${data.id}`)).then(() => {
      mainWindow?.webContents.send('file-downloaded', { status: 'download-file-success', id: data.id });
    });
  });

  ipcMain.on('upload-all-file', () => {
    if (!mainWindow) return;
    
    mainWindow.webContents.send('loading-status', true);
    const files = fileStore.get('files') || {};
    const filesArr = Object.keys(files).map(key => (files as any)[key]);
    const manager = createManager();
    const uploadPromiseArr = filesArr.map((file: any) => {
      return manager.uploadFile(path.basename(file.path), file.path);
    });

    Promise.all(uploadPromiseArr).then(result => {
      console.log('全部上传完毕');
      dialog.showMessageBox({
        type: 'info',
        title: '上传完成',
        message: `上传完成，总计上传${result.length}个文件`
      });
      mainWindow?.webContents.send('files-uploaded');
      mainWindow?.webContents.send('loading-status', false);
    }).catch(() => {
      dialog.showErrorBox('同步失败', '请检查阿里云同步参数是否正确');
    }).finally(() => {
      mainWindow?.webContents.send('loading-status', false);
    });
  });

  ipcMain.on('download-all-file', async () => {
    if (!mainWindow) return;
    
    mainWindow.webContents.send('loading-status', true);
    const manager = createManager();
    const savedLocation = settingsStore.get('savedFileLocation') || app.getPath('documents');
    
    try {
      const list = await manager.objects();
      const downloadPromiseArr = list.map((file: any) => {
        return manager.downloadFile(file.name, path.join(savedLocation as string, file.name));
      });

      const result = await Promise.all(downloadPromiseArr);
      const newFiles = list.reduce((newFilesObj: any, file: any, index: number) => {
        const fileId = path.basename(file.name, path.extname(file.name));
        newFilesObj[fileId] = {
          id: fileId,
          title: fileId,
          path: path.join(savedLocation as string, file.name),
          isSynced: true,
          updatedAt: new Date().getTime()
        };
        return newFilesObj;
      }, {});

      mainWindow?.webContents.send('all-file-download', newFiles);
      mainWindow?.webContents.send('loading-status', false);
      dialog.showMessageBox({
        type: 'info',
        title: '下载完成',
        message: `下载完成，总计下载${list.length}个文件`
      });
    } catch (e) {
      dialog.showErrorBox('同步失败', '请检查阿里云同步参数是否正确');
    } finally {
      mainWindow?.webContents.send('loading-status', false);
    }
  });

  ipcMain.on('update-fileName', (event, data: IpcMessage) => {
    console.log('update-fileName', data);
    mainWindow?.webContents.send('loading-status', true);
    const manager = createManager();
    manager.deleteFile(path.basename(data.oldPath!)).then(() => {
      manager.uploadFile(path.basename(data.newPath!), data.newPath!).then(() => {
        console.log('重命名完成');
        mainWindow?.webContents.send('loading-status', false);
      });
    });
  });

  ipcMain.on('delete-file', (event, data: IpcMessage) => {
    const manager = createManager();
    manager.deleteFile(path.basename(data.path!)).then(() => {
      console.log('删除成功');
    });
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    // Re-create main window when clicking on dock icon on macOS
  }
});