import { app, BrowserWindow, screen, dialog, ipcMain, nativeImage } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as fs from "fs";
import * as _ from "lodash";
import { v4 as uuidv4 } from 'uuid';
import * as db from 'electron-db';


let win: BrowserWindow = null;
const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

function createWindow(): BrowserWindow {

  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: 800 || size.width,
    height: 800 || size.height,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: (serve) ? true : false,
      contextIsolation: false,  // false if you want to run 2e2 test with Spectron
      enableRemoteModule : true // true if you want to run 2e2 test  with Spectron or use remote module in renderer context (ie. Angular)
    },
  });

  if (serve) {

    win.webContents.openDevTools();

    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });
    win.loadURL('http://localhost:4200');

  } else {
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  return win;
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => setTimeout(createWindow, 400));

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}

/////////// KEVAN HERE
const folder = "images/";
if(!fs.existsSync(folder)){
  fs.mkdirSync(folder);
}

// This will save the database in the same directory as the application.
const dblocation = path.join(__dirname, '');
const dbname = 'images';
db.createTable(dbname, dblocation, (success, msg: string) => {
  if (success) {
    console.log(msg);
  } else {
    console.log('An error has occurred. ' + msg);
  }
});
db.createTable('project', dblocation, () => {
});
db.createTable('secret', dblocation, () => {
});


ipcMain.on("chooseFile", (event, arg) => {
  const result = dialog.showOpenDialog(win, {
    title: "Choose Images",
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "Images", extensions: ["png","jpg","jpeg"] }]
  });

  result.then(({canceled, filePaths, bookmarks}) => {
    const files = [];
    _.each(filePaths, (path)=> {
      console.log('>>> path: ' + path)
      const image = nativeImage.createFromPath(path);
      const buffer = image.toJPEG(100);
      const uuid: string = uuidv4();
      const name = `${uuid}.jpg`;
      fs.writeFile(folder + name, buffer, (err)=> {
        if (err) throw err;
        console.log('Image has been created: ' + name);
      });
      const row = { name, uuid, project_id: arg.project_id };
      files.push(row);
      insertRow(row);
    });
    event.reply("chosenFile", files);
  });
});

const insertRow = (row: any)=> {
  if (db.valid(dbname, dblocation)) {
    console.log('valid');
    db.insertTableContent(dbname, dblocation, row, (success: boolean, msg: string) => {
      // success - boolean, tells if the call is successful
      console.log("Success: " + success);
      console.log("Message: " + msg);
    });
  }
};

const truncate = (callback)=> {
  // Delete all the data
  db.clearTable(dbname, dblocation, (succ, msg) => {
    if (succ) {
      console.log(msg);
      callback(true);
      // Show the content now
      db.getAll(dbname, dblocation, (succ, data) => {
        if (succ) {
          console.log(data);
        }
      });
      return;
    }
    callback(false);
  });
};

ipcMain.on("resetDatabase", (event, arg) => {
  truncate((success)=>{
    event.reply("resetDatabaseCompleted", success);
  });
});

ipcMain.on("saveCredentials", (event, arg) => {
  console.log('>>>>>> ', arg)
  if (db.valid('secret', dblocation)) {
    db.clearTable('secret', dblocation, () => {
      db.insertTableContent('secret', dblocation, arg, (success: boolean, msg: string) => {
        // success - boolean, tells if the call is successful
        console.log("Success: " + success);
        console.log("Message: " + msg);
        if (success) {
          event.reply("credentialSaved", success);
        }
      });
    });
  }
});

ipcMain.on("loadConfiguration", (event, arg) => {
  db.getAll('secret', dblocation, (succ, data) => {
    console.log(succ, data);
    if (succ) {
      console.log(data);
      event.reply('configurationLoaded', data);
    }
  });
});

ipcMain.on("createProject", (event, arg) => {
  if (db.valid('project', dblocation)) {
    arg.uuid = uuidv4();
    db.insertTableContent('project', dblocation, arg, (success: boolean, msg: string) => {
      // success - boolean, tells if the call is successful
      console.log("Success: " + success);
      console.log("Message: " + msg);
      if (success) {
        event.reply('projectCreated', arg);
      }
    });
  }
});

ipcMain.on("listProjects", (event, arg) => {
  if (db.valid('project', dblocation)) {
    db.getAll('project', dblocation, (success, data)=>{
      event.reply('projectListed', data);
    });
  }
});

ipcMain.on("listProject", (event, arg) => {
  if (db.valid('project', dblocation)) {
    console.log('............ 1332', arg)
    db.getRows('project', dblocation, { uuid: arg.id }, (success, result) => {
      event.reply('listProjectCompleted', result);
    });
  }
});

ipcMain.on("listProjectImages", (event, arg) => {
  if (db.valid('images', dblocation)) {
    console.log('............', arg);
    const im = []
    db.getRows('images', dblocation, { project_id: arg.project_id }, (success, result) => {
      _.each(result, (image)=> {
        im.push(image);
        // const a = fs.readFileSync('images/'+image.name, {encoding: 'base64'});
        // console.log(a)
      });

    });
    event.reply('listProjectImagesCompleted', im);
  }
});


