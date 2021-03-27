import { app, BrowserWindow, screen, dialog, ipcMain, nativeImage } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as fs from "fs";
import * as _ from "lodash";
import { v4 as uuidv4 } from 'uuid';
import * as db from 'electron-db';
import * as jwt from 'jsonwebtoken';
import * as superagent from 'superagent';
import * as async from 'async';

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
    width: 1200 || size.width,
    height: 800 || size.height,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: (serve) ? true : false,
      contextIsolation: false,  // false if you want to run 2e2 test with Spectron
      enableRemoteModule : true // true if you want to run 2e2 test  with Spectron or use remote module in renderer context (ie. Angular)
    },
  });

  if (serve) {

    // win.webContents.openDevTools();

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
db.createTable('images', dblocation, () => {
});
db.createTable('project', dblocation, () => {
});
db.createTable('secret', dblocation, () => {
});
db.createTable('dataset', dblocation, () => {
});
db.createTable('model', dblocation, () => {
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
      const image = nativeImage.createFromPath(path);
      const buffer = image.toJPEG(100);
      const uuid: string = uuidv4();
      const name = `${uuid}.jpg`;
      fs.writeFile(folder + name, buffer, (err)=> {
        if (err) throw err;
        const row = { name, uuid, project_id: arg.project_id, label: arg.label, uploaded: false };
        files.push(row);
        insertRow(row, event);
      });
    });
    // event.reply("chosenFile", files);
  });
});

const insertRow = (row: any, event: any)=> {
  if (db.valid('images', dblocation)) {
    db.insertTableContent('images', dblocation, row, (success: boolean, msg: string) => {
      // success - boolean, tells if the call is successful
      console.log("Success: " + success);
      console.log("Message: " + msg);
      event.reply("chosenFile", [row]);
    });
  }
};

ipcMain.on("resetDatabase", (event, arg) => {
  const table = [];

  _.each(['images', 'dataset', 'project', 'model'], (value:string)=> {
    table.push((callback)=>{
      db.clearTable(value, dblocation, (succ, msg)=>{
        console.log(value, succ, msg);
        if (succ) {
          callback(null, succ);
        }
        else {
          callback('error' + msg, false);
        }
      });
    });
  });

  async.series(table, (err, result)=>{
    if(fs.existsSync(folder)){
      fs.rmdirSync(folder, { recursive: true });
    }
    fs.mkdirSync(folder);
    event.reply("resetDatabaseCompleted", { err, result });
  });
});

ipcMain.on("saveCredentials", (event, arg) => {
  if (db.valid('secret', dblocation)) {
    db.clearTable('secret', dblocation, () => {
      db.insertTableContent('secret', dblocation, arg, (success: boolean, msg: string) => {
        // success - boolean, tells if the call is successful
        console.log("Success: " + success);
        console.log("Message: " + msg);
        if (success) {
          generateAccessToken()
          event.reply("credentialSaved", success);
        }
      });
    });
  }
});

ipcMain.on("loadConfiguration", (event, arg) => {
  db.getAll('secret', dblocation, (succ, data) => {
    if (succ) {
      // console.log(data);
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
    db.getRows('project', dblocation, { uuid: arg.id }, (success, result) => {
      event.reply('listProjectCompleted', result);
    });
  }
});

ipcMain.on("listProjectImages", (event, arg) => {
  if (db.valid('images', dblocation)) {
    const im = [];
    db.getRows('images', dblocation, { project_id: arg.project_id }, (success, result) => {
      _.each(result, (image)=> {
        im.push(image);
        // const a = fs.readFileSync('images/'+image.name, {encoding: 'base64'});
      });
    });
    event.reply('listProjectImagesCompleted', im);
  }
});

ipcMain.on("deleteImage", (event, arg) => {
  if (db.valid('images', dblocation)) {
    db.getRows('images', dblocation, { uuid: arg.id }, (success, result) => {
      db.deleteRow('images', dblocation, {'id': result[0].id}, (succ, msg) => {
        if (succ) {
          event.reply('imageDeleted', { image_id: arg.id, data: result });
        }
      });
    });
  }
});

ipcMain.on("loadDataset", (event, arg) => {
  if (db.valid('dataset', dblocation)) {
    db.getRows('dataset', dblocation, { project_id: arg.project_id }, (success, result) => {
      if (result.length > 0) {
        result = result[0];
      }
      else {
        result = null;
      }
      event.reply('datasetLoaded', result);
    });
  }
});

let access_token = '';
const generateAccessToken = () => {
  if (db.valid('dataset', dblocation)) {
    db.getAll('secret', dblocation, (succ, data) => {
      if (succ) {
        const email = data[0].email;
        const privateKey = data[0].secret;

        const payload = {
          "sub": email,
          "aud": "https://api.einstein.ai/v2/oauth2/token",
          "exp": Math.floor((new Date().getTime()) / 1000 + (12 * 60 * 60))
        };
        const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

        superagent
          .post('https://api.einstein.ai/v2/oauth2/token')
          .set('Content-type', 'application/x-www-form-urlencoded')
          .send({ scope: 'offline', assertion: token, grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer' })
          .then((response) => {
            // console.log(response.body);
            access_token = response.body.access_token;
          }).catch(console.error);
      }
    });
  }
};
generateAccessToken();

ipcMain.on('createDataset', (event, arg)=> {
  if (db.valid('dataset', dblocation)) {
    db.deleteRow('dataset', dblocation, {'project_id': arg.project_id}, (succ, msg) => {

    });
    createDataset(arg.name, arg.labels, (err, data)=>{
      console.log('Errororroro', err);
      if (err == null) {
        console.log(data);
        arg.dataset = data;
        db.insertTableContent('dataset', dblocation, arg, (success: boolean, _msg: string) => {
          if (success) {
            event.reply('datasetCreated', arg);
            uploadImages(arg, event);
          }
        });
      }
    });
  }
});

const createDataset = (name, labels, callback) => {
  const endpoint = 'https://api.einstein.ai/v2/vision/datasets';

  superagent
    .post(endpoint)
    .set('Content-type', 'multipart/form-data')
    .set('Cache-Control', 'no-cache')
    .set('Authorization', `Bearer ${access_token}`)
    .field('name', name)
    .field('labels', _.join(labels, ','))
    .field('type', 'image')
    .then((response) => {
      console.log(response.body);
      callback(null, response.body);
    })
    .catch((error) => {
      callback(error);
    });
};

const uploadImages = (arg, event) => {
  let dataset;

  db.getRows('dataset', dblocation, { project_id: arg.project_id }, (success, result) => {
    if (result.length > 0) {
      dataset = result[0].dataset;
    }
    const dataset_id = dataset.id;
    const labels = {};
    _.each(dataset.labelSummary.labels, (value)=> {
      labels[value.name] = value.id;
    });
    db.getRows('images', dblocation, { project_id: arg.project_id }, (success, images : {id: number, name:string, uuid: string, project_id:string, label:string, uploaded: boolean}[]) => {
      const tasks = [];
      _.each(images, (image)=> {
        if (image.uploaded) { return; }

        const payload = { name: image.uuid, labelId: labels[image.label], path: `images/${image.name}` };
        tasks.push((callback) => {
          upload(dataset_id, payload, (err, res) => {
            db.updateRow('images', dblocation, { uuid: image.uuid }, { uploaded: true }, (succ, msg)=> {
              if (succ) {
                console.log('**** IMAGE UPLOADED **** ' + image.uuid);
                event.reply('imageUploaded', image);
              }
              else {
                console.log('**** IMAGE NOT UPLOADED **** ' + image.uuid, msg);
              }
            });

            callback(err, res);
          });
        });
      });

      async.series(tasks, (err, results)=> {
        console.log('##############################################');
        console.log(err, results);
        db.updateRow('dataset', dblocation, { project_id: arg.project_id }, { completed: true }, (succ, msg)=> {
          if (succ) {
            console.log('****** UPDATE DATASET COMPLETED ******');
          }
          else {
            console.log('****** UPDATE DATASET ERROR ******', msg);
          }
        });
      });
    });
  });
};
const upload = (datasetId: string, payload: {name:string, labelId:number, path:string}, callback) => {
  const endpoint = `https://api.einstein.ai/v2/vision/datasets/${datasetId}/examples`;

  superagent
    .post(endpoint)
    .attach('data', payload.path)
    .set('Cache-Control', 'no-cache')
    .set('Authorization', `Bearer ${access_token}`)
    .field('name', payload.name)
    .field('labelId', payload.labelId)
    .then((response) => {
      callback(null, response.body);
      console.log("$$$$$$$$$$$", response.body);
    })
    .catch((error) => {
      console.log("********", error);
      callback(error);
    });
};

ipcMain.on('uploadImages', (event, arg)=> {
  uploadImages(arg, event);
});

ipcMain.on('refreshDataset', (event, arg)=> {
  refreshDataset(arg.dataset_id, (err, res)=> {
    console.log('*** DATASET REFRESHED ERROR ***', err);
    console.log('*** DATASET REFRESHED RESULT ***', res);
    if (err == null) {
      db.updateRow('dataset', dblocation, { project_id: arg.project_id }, { dataset: res }, (succ, msg)=> {
        if (succ) {
          console.log('****** UPDATE DATASET COMPLETED ******');
          event.reply('datasetRefreshed', res);
        }
        else {
          console.log('****** UPDATE DATASET ERROR ******', msg);
        }
      });
    }
  });
});

const refreshDataset = (dataset_id :string, callback) => {
  const endpoint = `https://api.einstein.ai/v2/vision/datasets/${dataset_id}`;

  superagent
    .get(endpoint)
    .set('Authorization', `Bearer ${access_token}`)
    .then((response) => {
      callback(null, response.body);
    })
    .catch((error) => {
      callback(error);
    });
};

ipcMain.on('loadModel', (event, arg)=> {
  db.getRows('model', dblocation, { project_id: arg.project_id }, (success, result) => {
    console.log('**** LOAD MODEL ***', success);
    console.log('*** LOAD MODEL ERROR ****', result);
    if (result.length > 0) {
      event.reply('modelLoaded', result[0]);
    }
  });
});


const trainDataset = (name, dataset_id, callback) => {
  const endpoint = 'https://api.einstein.ai/v2/vision/train';

  superagent
    .post(endpoint)
    .set('Content-type', 'multipart/form-data')
    .set('Cache-Control', 'no-cache')
    .set('Authorization', `Bearer ${access_token}`)
    .field('name', name)
    .field('datasetId', dataset_id)
    .then((response) => {
      console.log(response.body);
      callback(null, response.body);
    })
    .catch((error) => {
      callback(error);
    });
};

ipcMain.on('createModel', (event, arg)=> {
  trainDataset(arg.name, arg.dataset_id, (err, result)=> {
    if (result) {
      const row = { name: arg.name, project_id: arg.project_id, model: result };
      db.insertTableContent('model', dblocation, row, (success: boolean, _msg: string) => {
        if (success) {
          event.reply('modelCreated', row);
        }
      });
    }
  });
});

const trainingStatus = (modelId :string, callback) => {
  const endpoint = `https://api.einstein.ai/v2/vision/train/${modelId}`;

  superagent
    .get(endpoint)
    .set('Authorization', `Bearer ${access_token}`)
    .then((response) => {
      console.log('*** TRAINING STATUS *** ', response.body);
      callback(null, response.body);
    })
    .catch((error) => {
      console.log('*** TRAINING STATUS ERROR *** ', error);
      callback(error);
    });
};

ipcMain.on('modelStatus', (event, arg)=> {
  trainingStatus(arg.modelId, (err, result)=> {
    if (result) {
      db.updateRow('model', dblocation, { project_id: arg.project_id }, { model: result }, (success, msg)=> {
        if (success) {
          event.reply('modelStatusUpdated', result);
        }
      });
    }
  });
});

const predictImage = (modelId, callback) => {
  const result = dialog.showOpenDialog(win, {
    title: "Choose Images for Prediction",
    properties: ["openFile"],
    filters: [{ name: "Images", extensions: ["png","jpg","jpeg"] }]
  });

  result.then(({canceled, filePaths, bookmarks}) => {
    if (canceled) {
      return callback('no file selected');
    }

    const filePath = filePaths[0];
    const endpoint = 'https://api.einstein.ai/v2/vision/predict';

    superagent
      .post(endpoint)
      .attach('sampleContent', filePath)
      .set('Cache-Control', 'no-cache')
      .set('Authorization', `Bearer ${access_token}`)
      .field('modelId', modelId)
      .then((response) => {
        callback(null, response.body);
        console.log("$$$$$$$$$$$", response.body);
      })
      .catch((error) => {
        console.log("********", error);
        callback(error);
      });
  });
};

ipcMain.on('predictImage', (event, arg)=> {
  predictImage(arg.modelId, (err, result)=> {
    console.log(result, err)
    event.reply('predictImageCompleted', result);
  });
});
