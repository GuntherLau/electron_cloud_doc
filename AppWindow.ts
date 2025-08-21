import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron';

class AppWindow extends BrowserWindow {
  constructor(config: Partial<BrowserWindowConstructorOptions> = {}, urlLocation: string) {
    const basicConfig: BrowserWindowConstructorOptions = {
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false
      },
      show: false,
      backgroundColor: '#efefef'
    };

    const finalConfig = { ...basicConfig, ...config };
    super(finalConfig);
    
    this.loadURL(urlLocation);
    this.once('ready-to-show', () => {
      this.show();
    });
  }
}

module.exports = AppWindow;