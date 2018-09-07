const execa = require('execa');
const getStream = require('get-stream');
const fetch = require('node-fetch');
const appConfig = require('./resources/apps.json');

const {lookupServiceUrl} = require('./utils');

const npmCommand = {name: "npm", args: ['i', '--save', 'openfin-__SERVICE__@alpha']};
const gitCommand = {name: "git", args: ['ls-remote', 'https://github.com/HadoukenIO/__SERVICE__-service.git']};

const update = async (port) => {
    // update each service listed in the manifest
    try {
        for (let i in appConfig.services ) {
            const service = appConfig.services[i];
            // update to alpha pre-release
            const npmMsg = await updateNPM(service);
            // get SHA from github.com
            const gitMsg = await getGitSHA(service);
            // if no manifest url, resolve service name remotely
            const serviceUrl = service.manifestUrl;
            if (!serviceUrl) {
                serviceUrl = await lookupServiceUrl(service.name);
            }
            // given manifest url, get startup_app.url
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

const updateNPM = async (service) => {
    const npmargs = Object.assign([], npmCommand.args);
    npmargs[npmargs.length-1] = npmargs[npmargs.length-1].replace('__SERVICE__', service.name);

    // run the npm command and await the ouput stream to parse out what was installed
    const npmOut = execa(npmCommand.name, npmargs).stdout;
    const npmStream = await getStream(npmOut);
    const npmMsg = processNPMOutput(npmStream.split('\n'));
    return npmMsg;
}

const getGitSHA = async (service) => {
    const gitargs = Object.assign([], gitCommand.args);
    gitargs[gitargs.length-1] = gitargs[gitargs.length-1].replace('__SERVICE__', service.name);

    // run the git command and await the ouput stream to parse out the git sha
    const gitOut = execa(gitCommand.name, gitargs).stdout;
    const gitStream = await getStream(gitOut);
    const gitMsg = getDevelopSha(gitStream.split('\n'));
    return gitMsg;
}

const getServiceAppUrl = async(serviceUrl) => {
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

const getDevelopSha = (lines) => {
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

const processNPMOutput = (lines) => {
    return lines[0].replace('+ ', '');
}

module.exports = {
    update: update
}