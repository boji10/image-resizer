// Import necessary modules from Electron and other libraries
const os = require('os');
const path = require('path');
const { contextBridge, ipcRenderer } = require('electron');
const Toastify = require('toastify-js');

// Expose 'os' module to the renderer process
contextBridge.exposeInMainWorld('os', {
  // Define a function 'homedir' that returns the user's home directory
  homedir: () => os.homedir(),
});

// Expose 'path' module to the renderer process
contextBridge.exposeInMainWorld('path', {
  // Define a function 'join' that joins path segments into a single path
  join: (...args) => path.join(...args),
});

// Expose 'ipcRenderer' module to the renderer process
contextBridge.exposeInMainWorld('ipcRenderer', {
  // Define a function 'send' that sends a message to the main process on a specified channel with provided data
  send: (channel, data) => ipcRenderer.send(channel, data),
  // Define a function 'on' that listens for messages on a specified channel and invokes a callback function with the received data
  on: (channel, func) =>
    ipcRenderer.on(channel, (event, ...args) => func(...args)),
});

// Expose 'Toastify' module to the renderer process
contextBridge.exposeInMainWorld('Toastify', {
  // Define a function 'toast' that creates and displays a Toastify notification with the provided options
  toast: (options) => Toastify(options).showToast(),
});
