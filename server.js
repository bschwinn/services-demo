const openfinLauncher = require('hadouken-js-adapter');
const express = require('express');
const http = require('http');
const path = require('path');
const os = require('os');
const {lookupServiceUrl} = require('./utils');
const {update} = require('./update');
const {local} = require('./local');

const port = process.env.PORT || 3011;
const confPath  = path.resolve('build', 'apps.json');

const app = express();
app.use(express.static('./build'));

let mode = 'latest';
if (process.env.MODE && process.env.MODE.length>0 && (process.env.MODE === 'latest' || process.env.MODE === 'local')) {
    mode = process.env.MODE;
    console.log(`running in mode ${mode}`);
}

http.createServer(app).listen(port, async function(){
    console.log('Express server listening on port ' + port);

    try {
        if (mode === 'local') {
            await local(port);
            app.use('/layouts', express.static('../layouts-service/build'));
            app.use('/notifications', express.static('../notifications-service/build'));
            app.use('/fdc3', express.static('../fdc3-service/build'));
        } else {
            await update(port);
        }
    } catch(e) {
        console.error(`error running setup in ${mode} mode`, e);
        process.exit(1);
    }

    // on OS X we need to launch the provider manually (no RVM)
    if (os.platform() === 'darwin') {
        const conf = require(confPath);
        if (conf && conf.services) {
            for (let i=0; i<conf.services.length; i++) {
                const service = conf.services[i];
                try {
                    await launchService(service);
                } catch(e) {
                    console.error(e);
                }
            }
        }
    }

    // now launch the app itself
    console.log('launching application');
    openfinLauncher.launch({ manifestUrl: confPath }).catch(err => console.log(err));
});

const launchService = async (service) => {
    if (service.manifestUrl) {
        await openfinLauncher.launch({ manifestUrl: service.manifestUrl });
        console.log(`launching service: ${service.name} from manifestUrl: ${service.manifestUrl}`);
    } else {
        const sUrl = await lookupServiceUrl(service.name);
        if (sUrl.length > 0) {
            await openfinLauncher.launch({ manifestUrl: sUrl });
            console.log(`launching service: ${service.name} from app directory url: ${sUrl}`);
        } else {
            console.log(`unable to launch service: ${service.name}, could not determine url.`);
        }
    }
};
