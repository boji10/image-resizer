// Import required modules
const path = require('path');
const os = require('os');
const fs = require('fs');
const resizeImg = require('resize-img');
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');

// Check if the application is running in development mode
const isDev = process.env.NODE_ENV !== 'production';
// Check if the platform is macOS
const isMac = process.platform === 'darwin';

// Initialize main and about windows
let mainWindow;
let aboutWindow;

// Function to create the main window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    // Set window properties
    width: isDev ? 1000 : 500,
    height: 600,
    icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    resizable: isDev,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Load the main HTML file
  mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
}

// Function to create the about window
function createAboutWindow() {
  aboutWindow = new BrowserWindow({
    width: 300,
    height: 300,
    title: 'About Electron',
    icon: `${__dirname}/assets/icons/Icon_256x256.png`,
  });

  // Load the about HTML file
  aboutWindow.loadFile(path.join(__dirname, './renderer/about.html'));
}

// Event listener when the app is ready
app.on('ready', () => {
  // Create the main window
  createMainWindow();

  // Create and set the application menu
  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  // Event listener when the main window is closed
  mainWindow.on('closed', () => (mainWindow = null));
});

// Menu template
const menu = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            {
              label: 'About',
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
  {
    role: 'fileMenu',
  },
  ...(!isMac
    ? [
        {
          label: 'Help',
          submenu: [
            {
              label: 'About',
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
  ...(isDev
    ? [
        {
          label: 'Developer',
          submenu: [
            { role: 'reload' },
            { role: 'forcereload' },
            { type: 'separator' },
            { role: 'toggledevtools' },
          ],
        },
      ]
    : []),
];

// Event listener for image resize request from renderer process
ipcMain.on('image:resize', (e, options) => {
  // Set destination path for resized images
  options.dest = path.join(os.homedir(), 'imageresizer');
  // Call the resizeImage function
  resizeImage(options);
});

// Function to resize the image
async function resizeImage({ imgPath, height, width, dest }) {
  try {
    // Read the image file and resize it
    const newPath = await resizeImg(fs.readFileSync(imgPath), {
      width: +width,
      height: +height,
    });

    // Get the filename from the original path
    const filename = path.basename(imgPath);

    // Create the destination directory if it doesn't exist
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }

    // Write the resized image to the destination directory
    fs.writeFileSync(path.join(dest, filename), newPath);

    // Send a message to the main window indicating image resize is done
    mainWindow.webContents.send('image:done');

    // Open the destination path in the file explorer
    shell.openPath(dest);
  } catch (err) {
    // Log any errors that occur during image resize
    console.log(err);
  }
}

// Event listener when all windows are closed
app.on('window-all-closed', () => {
  // Quit the app if it's not macOS
  if (!isMac) app.quit();
});

// Event listener when app is activated
app.on('activate', () => {
  // Create the main window if no windows are open
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
