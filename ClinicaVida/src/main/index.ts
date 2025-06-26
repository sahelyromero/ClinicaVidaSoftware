import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import { join } from 'path';
import * as path from 'node:path';

let mainWindow: BrowserWindow | null = null;
let childWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Carga la app React
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

function createChildWindow(): void {
  if (childWindow !== null) {
    childWindow.focus();
    return;
  }

  childWindow = new BrowserWindow({
    width: 600,
    height: 400,
    parent: mainWindow || undefined,
    modal: false,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  });

  childWindow.once('ready-to-show', () => {
    childWindow?.show();
  });

  childWindow.on('closed', () => {
    childWindow = null;
  });

  // Carga el componente /#/child en React
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    childWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/#/child`);
  } else {
    childWindow.loadFile(
      path.join(__dirname, '../renderer/index.html'),
      { hash: '/child' } // 👈 Corrección clave
    );
  }
}

// Registrar IPC para abrir la ventana hija
ipcMain.on('open-child-window', createChildWindow);

// Iniciar app
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  ipcMain.on('ping', () => console.log('pong'));

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
