import * as Discord from 'discord-rpc';
import { ipcMain, BrowserWindow } from 'electron';
import * as path from "path";

const rpc = new Discord.Client({ transport: 'ipc' });

export let RPC_STARTED = false;
let PREV_TOKEN = "";
let buttons: [{ label: string, url: string }];

export async function startHandler(mainWindow: BrowserWindow) {
    ipcMain.on("@rpc/update", async (event, data) => {
        if (data.button_1_label) {
            if (!buttons) {
                buttons = [{ label: data.button_1_label, url: data.button_1_url }];
            } else {
                buttons.push({ label: data.button_1_label, url: data.button_1_url });
            }

            delete data.button_1_label;
            delete data.button_1_url;
        }
        if (data.button_2_label) {
            if (!buttons) {
                buttons = [{ label: data.button_2_label, url: data.button_2_url }];
            } else {
                buttons.push({ label: data.button_2_label, url: data.button_2_url });
            }

            delete data.button_2_label;
            delete data.button_2_url;
        }



        if (data.startTimestamp) {
            data.startTimestamp = Number(data.startTimestamp)
        }
        if (data.endTimestamp) {
            data.endTimestamp = Number(data.endTimestamp)
        }
        if (data.partySize) {
            data.partySize = Number(data.partySize)
        }
        if (data.partyMax) {
            data.partyMax = Number(data.partyMax)
        }
        data.instance = true;

        if (data.partyId && data.partySize && data.partyMax && data.joinSecret) {
            data.matchSecret = await randomString(8);
            data.spectateSecret = await randomString(8);
            delete data.buttons;
        }
        if (buttons) {
            data.buttons = buttons;
        }
        let presenceData = await cleanData(data);
        if (RPC_STARTED == false || data.token != PREV_TOKEN) {
            rpc.login({ clientId: presenceData.token }).catch(console.error);
        }
        delete presenceData.token;

        if (RPC_STARTED) {
            rpc.setActivity(presenceData);
            mainWindow.webContents.send("@rpc/status", RPC_STARTED);
        } else {
            rpc.on('ready', () => {
                RPC_STARTED = true;
                rpc.setActivity(presenceData);
                mainWindow.webContents.send("@rpc/status", RPC_STARTED);
            });
        }

    });

    ipcMain.on("@window/navigate", (event, file) => {
        mainWindow.webContents.loadFile(path.join(__dirname, `../public/${file}`)).catch(console.error);
    })

    ipcMain.on("@rpc/status", (event, args) => {
        mainWindow.webContents.send("@rpc/status", RPC_STARTED);
    })
}


async function cleanData(obj) {
    for (var n in obj) {
        if (obj[n] === null || obj[n] === undefined || obj[n] === '') {
            delete obj[n];
        }
    }
    return obj
}
async function randomString(length: number) {
    var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
}