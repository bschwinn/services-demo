#!/usr/bin/env node

const execa = require('execa');
const getStream = require('get-stream');
const fetch = require('node-fetch');
const appConfig = require('./apps.json');

const {lookupServiceUrl} = require('./utils');

async function update() {
    try {
        const npmCommand = {name: "npm", args: ['i', '--save', 'openfin-__SERVICE__@alpha']};
        const gitCommand = {name: "git", args: ['ls-remote', 'https://github.com/HadoukenIO/__SERVICE__-service.git']};

        for (let i in appConfig.services ) {
            const service = appConfig.services[i];

            // fill out command arg template strings
            const npmargs = Object.assign([], npmCommand.args);
            npmargs[npmargs.length-1] = npmargs[npmargs.length-1].replace('__SERVICE__', service.name);
            const gitargs = Object.assign([], gitCommand.args);
            gitargs[gitargs.length-1] = gitargs[gitargs.length-1].replace('__SERVICE__', service.name);

            // run the commands and process the output
            const npmOut = execa(npmCommand.name, npmargs).stdout;
            const npmStream = await getStream(npmOut);
            const npmMsg = processNPMOutput(npmStream.split('\n'));
            const gitOut = execa(gitCommand.name, gitargs).stdout;
            const gitStream = await getStream(gitOut);
            const gitMsg = getDevelopSha(gitStream.split('\n'));

            // find service's manifest url and then get the startup_app.url
            const serviceUrl = service.manifestUrl;
            if (!serviceUrl) {
                serviceUrl = await lookupServiceUrl(service.name);
            }
            let appURL = '??';
            if (serviceUrl.length >0) {
                appURL = await getServiceAppUrl(serviceUrl);
            }

            // a nice message to the user
            console.log(`\nService: ${service.name}`);
            console.log(`    prerelease: ${npmMsg}`);
            console.log(`    github sha: ${gitMsg}`);
            console.log(`   service url: ${serviceUrl}`);
            console.log(`       app url: ${appURL}\n\n`);
        }
    } catch(e) {
        console.error(e);
    }
}

async function getServiceAppUrl(serviceUrl) {
    try {
        const res = await fetch(serviceUrl);
        const json = await res.json();
        if (json && json.startup_app) {
            return json.startup_app.url;
        }
    } catch(e) {
        console.error(e);
    }
    return '??';
}

function getDevelopSha(lines) {
    // extract sha from output
    let sha = '';
    for (let j=0; j<lines.length; j++) {
        const ref = lines[j];
        if (ref.indexOf('refs/heads/develop') > -1) {
            sha = ref.split('\t')[0];
            break;
        }
    }
    return sha;
}

function processNPMOutput(lines) {
    return lines[0].replace('+ ', '');
}

update();