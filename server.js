const openfinLauncher = require('hadouken-js-adapter');
const express = require('express');
const http = require('http');
const path = require('path');
const os = require('os');
const fs = require('fs');
const URL = require('url').URL;
const {lookupServiceUrl} = require('./utils');
const {update} = require('./update');
const {local} = require('./local');
const {promisify} = require('util');
const readFile = promisify(fs.readFile);

const port = process.env.PORT || 3011;
const confPath  = path.resolve('build', 'apps.json');

let mode = 'latest';
if (process.env.MODE && process.env.MODE.length>0 && (process.env.MODE === 'latest' || process.env.MODE === 'local')) {
    mode = process.env.MODE;
    console.log(`running in mode ${mode}`);
}

// main routine (needed async sequencing)
const start = async () => {
    const app = express();
    app.use(express.static('./build'));
    
    try {
        if (mode === 'local') {
            await local(port);
            setupLocalRoutes(app);
        } else {
            await update(port);
        }
    } catch(e) {
        console.error(`error running setup in ${mode} mode`, e);
        process.exit(1);
    }
    
    http.createServer(app).listen(port, async function(){
        console.log('Express server listening on port ' + port);
        // on OS X we need to launch the provider manually (no RVM)
        if (os.platform() === 'darwin') {
            await startServices();
        }
        // now launch the app itself
        console.log('launching application');
        openfinLauncher.launch({ manifestUrl: confPath }).catch(err => console.log(err));
    });
}

const startServices = async () => {
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

const setupLocalRoutes = (app) => {
    // override manifest requests to alter the provider html path
    app.get('/:service/app.json', function (req, res, next) {
        const conf = loadConfigFile(req.params.service);
        if (conf === null) {
            res.sendStatus(404);
            return;
        }
        res.json(conf);
    });

    // oh layouts project, why are you just slightly different for no good reason
    app.get('/:service/provider/app.json', function (req, res, next) {
        const conf = loadConfigFile(req.params.service);
        if (conf === null) {
            res.sendStatus(404);
            return;
        }
        res.json(conf);
    });

    app.use('/layouts', express.static('../layouts-service/build'));
    app.use('/notifications', express.static('../notifications-service/build'));
    app.use('/fdc3', express.static('../fdc3-service/build'));
}

const loadConfigFile = (serviceName) => {
    let manifestPath = `../${serviceName}-service/build/app.json`;
    if (serviceName == 'layouts') {
        manifestPath = `../${serviceName}-service/build/provider/app.json`;
    }

    try {
        let conf = fs.readFileSync(manifestPath);
        conf = JSON.parse(conf);
        let appUrl = new URL(conf.startup_app.url)
        appUrl.host = `localhost:${port}`
        appUrl.pathname = `/${serviceName}${appUrl.pathname}`
        conf.startup_app.url = appUrl.href;
        return conf
    } catch(e) {
        return {};
    }
}

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

start();