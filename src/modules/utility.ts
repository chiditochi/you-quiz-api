import fs from 'fs';
import colors from  'colors';
import path from 'path'
import moment from 'moment';


module.exports.currentTime = function () {
    return moment().format("YYYY-MM-DD HH:mm:ss")
}

const today = () => moment().format("YYYY-MM-DD");

export function getLogger(appName: string) {
    const t = today();
    const logFileName = `${appName}-${t}.log`;
    const logger = require('tracer').colorConsole({
        transport: [
            function (data: any) { //logging to file
                fs.appendFile('logs/' + logFileName, data.rawoutput + '\n', (err) => {
                    if (err) throw err;
                });
            },
            function (data: any) { //logging to console
                console.log(data.output);
            }
        ],
        filters: {
            log: [colors.bold],
            trace: colors.magenta,
            debug: colors.blue,
            info: colors.green,
            warn: colors.yellow,
            error: [colors.red, colors.bold]
        },
        format: [
            '{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}}) Path:: {{path}}', //default format
            {
                error:
                    '{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}})' // error format \nCall Stack:\n{{stack}}
            }
        ],
        dateformat: 'HH:MM:ss.L',
        preprocess: function (data: any) {
            data.title = data.title.toUpperCase()
            //format path variable
            const p = data.path.split(path.sep);
            const filename = p.pop();
            const folder = p.pop();
            const newPath = `${folder}${path.sep}${filename}`;
            //console.log("Pa: ", newPath);
            data.path = newPath;
        }
    });

    return logger;
}
