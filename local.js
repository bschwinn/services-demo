const execa = require('execa');
const fs = require('fs');
const {promisify} = require('util');
const appConfig = require('./apps.json');
const writeFile = promisify(fs.writeFile);

const local = async (port) => {
    try {
        await modifyPackageFile();
    } catch(e) {
        console.error(e);
        process.exit(1);
    }

    try {
        console.log('LOCAL: running npm install');
        await execa('npm', ['install'], {stdio: 'inherit'});
    } catch(e) {
        console.error(e);
        process.exit(1);
    }

    try {
        console.log('LOCAL: running npm run build');
        await execa('npm', ['run', 'build'], {stdio: 'inherit'});
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
            
    try {
        await modifyManifest(port)
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}

// modify the generated package.json
const modifyPackageFile = async () => {

    console.log('LOCAL: modifying package file');

    const packagePath = './package.json';
    const package = require(packagePath);

    for (let i in appConfig.services ) {
        const service = appConfig.services[i];
        package['dependencies']['openfin-'+service.name] = `file:../${service.name}-service/`;
    }

    await writeFile(packagePath, JSON.stringify(package, null, 4));

    console.log('LOCAL: package file modified');
}

const modifyManifest = async (port) => {
    // modify build/apps.json to use paths express is serving
    console.log('LOCAL: modifying manifest');
    const manifestPath = './build/apps.json';
    const manifest = require(manifestPath);

    for (let i in manifest.services ) {
        const service = manifest.services[i];
        service.manifestUrl = `http://localhost:${port}/${service.name}/app.json`;
    }

    await writeFile(manifestPath, JSON.stringify(manifest, null, 4));
    console.log('LOCAL: manifest modified');
}

module.exports = {
    local: local
}
