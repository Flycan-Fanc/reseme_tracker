// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            // 启用 node 集成，允许在渲染进程中使用 require
            nodeIntegration: true,
            contextIsolation: false, // 为了简化示例，禁用上下文隔离
            preload: path.join(__dirname, 'renderer.js') // 实际逻辑在 renderer.js 中处理
        }
    });

    mainWindow.loadFile('index.html');

    // 可以选择打开开发者工具
    // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});