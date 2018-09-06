import * as ofnotes from "openfin-notifications"
import * as oflayouts from "openfin-layouts"
import * as offdc3 from "openfin-fdc3"

document.addEventListener("DOMContentLoaded", function () {

    const logs = document.getElementById('logger');

    function logit(msg) {
        const theDate = new Date().toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'});
        const logEntry = document.createElement('div');
        logEntry.innerHTML = `${theDate} - ${msg}`;
        logs.insertBefore(logEntry, logs.firstChild);
    }

    const noteOpts = { subtitle: '', icon: '', context: { testContext: 'testContext'}, date: Date.now()};

    document.getElementById('createNote').addEventListener('click', () => {
        const id = document.getElementById('notificationId').value;
        const title = document.getElementById('notificationTitle').value;
        const body = document.getElementById('notificationBody').value;
        const opts = Object.assign({}, noteOpts, {body: body, title: title});
        logit(`creating notification: ${id} with options:\n${JSON.stringify(opts, null, 4)}`);
        ofnotes.create(id, opts).then( (notification) => {
            if (!notification.success) {
                logit(`Notification ids must be unique!\nID: ${id} already exists!`);
            }
        })
    });

    document.getElementById('clearNote').addEventListener('click', () => {
        const id = document.getElementById('notificationId').value;
        ofnotes.clear(id).then(() => {
            logit(`notification_${index} cleared`)
        });
    });

    document.getElementById('genNoteId').addEventListener('click', () => {
        const newId = generateId(7);
        document.getElementById('notificationId').value = newId;
    });
  
    // generateId :: Integer -> String
    function generateId (len) {
        var arr = new Uint8Array((len || 40) / 2);
        window.crypto.getRandomValues(arr);
        return Array.from(arr, (dec) => ('0' + dec.toString(16)).substr(-2) ).join('');
    }
  
    document.getElementById(`getAllNotes`).addEventListener('click', () => {
        ofnotes.getAll().then((notifications) => {
            logit(`${notifications.value.length} notifications in the center`);
        })
    });

    document.getElementById(`clearAllNotes`).addEventListener('click', () => {
        ofnotes.clearAll().then(() => {
            logit(`all notifications cleared`);
        })
    });

    ofnotes.addEventListener('click', (payload) => {
        logit(`notification clicked for id: ${payload.id}`);
    });
    
    ofnotes.addEventListener('close', (payload) => {
        logit(`notification closed for id: ${payload.id}`);
    });

    const dockBtn = document.getElementById('undockBtn');
    dockBtn.addEventListener('click', () => {
        oflayouts.undock().then(() => logit('window undocked'));
    });

    new offdc3.IntentListener( (context) => {
        logit('fdc3 intent event:\n' + JSON.stringify(context, null, 4));
    });

    new offdc3.ContextListener( (context) => {
        logit('fdc3 context event:\n' + JSON.stringify(context, null, 4));
    });

    const fdc3Symbols = [
        {
            "object" : "fdc3-context", 
            "definition" : " https://fdc3.org...", 
            "version" : "1.0.0",
            "data" : [ 
                { 
                    "type" : "security",
                    "name" : "Apple",
                    "id" : {
                        "ticker" : "aapl",
                        "ISIN" : "US0378331005",
                        "CUSIP" : "037833100",
                        "FIGI" : "BBG000B9XRY4",
                        "default" : "aapl"
                    }
                }
            ]
        },
        {
            "object" : "fdc3-context", 
            "definition" : " https://fdc3.org...", 
            "version" : "1.0.0",
            "data" : [ 
                { 
                    "type" : "security",
                    "name" : "Tesla",
                    "id" : {
                        "ticker" : "TSLA",
                        "ISIN" : "US0378331005",
                        "CUSIP" : "037833100",
                        "FIGI" : "BBG000B9XRY4",
                        "default" : "tsla"
                    }
                }
            ]
        }
    ];

    const fdc3Links = document.getElementById('fdc3Links');
    if (fdc3Links) {
        for (let i in fdc3Symbols) {
            const sym = fdc3Symbols[i];
            const symName = sym.data[0].name;
            const div = document.createElement('div');
            div.classList.add('row');
            const btn = document.createElement('button');
            btn.innerHTML = symName;
            btn.addEventListener('click', () => {
                offdc3.broadcast(sym);
            });
            div.appendChild(btn);
            fdc3Links.appendChild(div);
        }
    }
});