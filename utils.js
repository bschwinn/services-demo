const fetch = require('node-fetch');

var appDirHost = process.env.APPDIR_HOST || 'https://app-directory-staging.openfin.co'

module.exports = {
    defaultRuntimeVersion: "9.61.33.32",
    lookupServiceUrl : async (serviceName) => {
        if (appDirHost.length > 0) {
            const lookupUrl = `${appDirHost}/api/v1/apps/${serviceName}`;
            const res = await fetch(lookupUrl);
            const json = await res.json();
            if (json) {
                return json.manifest_url;
            }
            console.log(`error getting startup url for service: ${serviceName}, url: ${lookupUrl}, json: ${JSON.stringify(json, null, 4)}`);
            return '';
        }
        console.log(`error getting startup url for ${serviceName}, host: ${appDirHost}`);
        return '';
    }
};
