import { app, shell, ipcMain, MenuItemConstructorOptions, BrowserWindow } from 'electron';
const Store = require('electron-store');

const settingsStore = new Store({ name: 'Settings' });
let enableAutoSync = settingsStore.get('enableAutoSync');

const aliIsConfig = [
  '#settings-Region',
  '#settings-AccessKeyId',
  '#settings-AccessKeySecret',
  '#settings-Bucket'
].every(key => !!settingsStore.get(key));

const template: MenuItemConstructorOptions[] = [
  {
    label: '文件',
    submenu: [
      {
        label: '新建',
        accelerator: 'CmdOrCtrl+N',
        click: (menuItem, browserWindow: BrowserWindow | undefined, event) => {
          if (browserWindow) {
            browserWindow.webContents.send('create-new-file');
          }
        }
      },
      {
        label: '保存',
        accelerator: 'CmdOrCtrl+S',
        click: (menuItem, browserWindow: BrowserWindow | undefined, event) => {
          if (browserWindow) {
            browserWindow.webContents.send('save-edit-file');
          }
        }
      },
      {
        label: '导入',
        accelerator: 'CmdOrCtrl+O',
        click: (menuItem, browserWindow: BrowserWindow | undefined, event) => {
          if (browserWindow) {
            browserWindow.webContents.send('import-file');
          }
        }
      }
    ]
  },
  {
    label: '编辑',
    submenu: [
      {
        label: '撤销',
        accelerator: 'CmdOrCtrl+Z',
        role: 'undo'
      },
      {
        label: '重做',
        accelerator: 'Shift+CmdOrCtrl+Z',
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        label: '剪切',
        accelerator: 'CmdOrCtrl+X',
        role: 'cut'
      },
      {
        label: '复制',
        accelerator: 'CmdOrCtrl+C',
        role: 'copy'
      },
      {
        label: '粘贴',
        accelerator: 'CmdOrCtrl+V',
        role: 'paste'
      }
    ]
  },
  {
    label: '视图',
    submenu: [
      {
        label: '刷新当前页面',
        accelerator: 'CmdOrCtrl+R',
        click: (item, focusedWindow: BrowserWindow | undefined) => {
          if (focusedWindow) {
            focusedWindow.reload();
          }
        }
      },
      {
        label: '切换开发者工具',
        accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
        click: (item, focusedWindow: BrowserWindow | undefined) => {
          if (focusedWindow) {
            focusedWindow.webContents.toggleDevTools();
          }
        }
      },
      {
        type: 'separator'
      },
      {
        label: '实际大小',
        accelerator: 'CmdOrCtrl+0',
        click: (item, focusedWindow: BrowserWindow | undefined) => {
          if (focusedWindow) {
            focusedWindow.webContents.zoomLevel = 0;
          }
        }
      },
      {
        label: '收缩',
        accelerator: 'CmdOrCtrl+-',
        click: (item, focusedWindow: BrowserWindow | undefined) => {
          if (focusedWindow) {
            const currentZoom = focusedWindow.webContents.zoomLevel;
            focusedWindow.webContents.zoomLevel = currentZoom - 0.5;
          }
        }
      },
      {
        label: '放大',
        accelerator: 'CmdOrCtrl+=',
        click: (item, focusedWindow: BrowserWindow | undefined) => {
          if (focusedWindow) {
            const currentZoom = focusedWindow.webContents.zoomLevel;
            focusedWindow.webContents.zoomLevel = currentZoom + 0.5;
          }
        }
      },
      {
        type: 'separator'
      },
      {
        label: '切换全屏',
        accelerator: process.platform === 'darwin' ? 'Ctrl+Command+F' : 'F11',
        click: (item, focusedWindow: BrowserWindow | undefined) => {
          if (focusedWindow) {
            focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
          }
        }
      }
    ]
  },
  {
    label: '阿里云',
    submenu: [
      {
        label: '设置',
        accelerator: 'CmdOrCtrl+,',
        click: () => {
          ipcMain.emit('open-settings-window');
        }
      },
      {
        label: '自动同步',
        enabled: aliIsConfig,
        type: 'checkbox',
        checked: !!enableAutoSync,
        click: () => {
          settingsStore.set('enableAutoSync', !enableAutoSync);
          enableAutoSync = !enableAutoSync;
        }
      },
      {
        label: '上传所有云文档',
        enabled: aliIsConfig,
        click: () => {
          ipcMain.emit('upload-all-file');
        }
      },
      {
        label: '下载所有云文档',
        enabled: aliIsConfig,
        click: () => {
          ipcMain.emit('download-all-file');
        }
      }
    ]
  },
  {
    label: '窗口',
    submenu: [
      {
        label: '最小化',
        accelerator: 'CmdOrCtrl+M',
        role: 'minimize'
      },
      {
        label: '关闭',
        accelerator: 'CmdOrCtrl+W',
        role: 'close'
      }
    ]
  },
  {
    role: 'help',
    label: '帮助',
    submenu: [
      {
        label: '关于阿里云文档',
        click: () => {
          shell.openExternal('https://github.com/GuntherLau/electron_cloud_doc');
        }
      }
    ]
  }
];

if (process.platform === 'darwin') {
  const name = '阿里云文档';
  template.unshift({
    label: name,
    submenu: [
      {
        label: `关于 ${name}`,
        role: 'about'
      },
      {
        type: 'separator'
      },
      {
        label: '服务',
        role: 'services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        label: `隐藏 ${name}`,
        accelerator: 'Command+H',
        role: 'hide'
      },
      {
        label: '隐藏其它',
        accelerator: 'Command+Alt+H',
        role: 'hideOthers'
      },
      {
        label: '显示全部',
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {
        label: '退出',
        accelerator: 'Command+Q',
        click: () => {
          app.quit();
        }
      }
    ]
  });
}

module.exports = template;