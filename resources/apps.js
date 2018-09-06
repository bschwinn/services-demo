document.addEventListener("DOMContentLoaded", function (evt) {
    let appCount = 0;
    const defaultNumApps = 4;

    const createApplication = () => {
        const conf = { 
            "name" : "openfin services demo",
            "uuid": "openfin-service-demo-" + appCount,
            "url" : "http://localhost:3011/main.html",
            "mainWindowOptions" : {
                defaultHeight : 500,
                defaultWidth: 420,
                defaultTop: 80*appCount + 30,
                defaultLeft: 80*appCount + 30,
                saveWindowState: false,
                autoShow: true
            }
        };
        const app = new fin.desktop.Application(conf, () => {app.run();}, console.error);
        appCount++;
    }

    for (let i = 0; i < defaultNumApps; i++) {
        createApplication();
    }

    document.getElementById('createAnotherWindow').addEventListener('click', () => {
        createApplication();
    });
});