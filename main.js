import * as ofnotes from "openfin-notifications"
import * as oflayouts from "openfin-layouts"
import * as offdc3 from "openfin-fdc3"

document.addEventListener("DOMContentLoaded", function (evt) {

    const btns = document.getElementById('notifsButtons');
    const tmpl = document.getElementById('notifCreateClear');
    const logs = document.getElementById('logger');

    function logit(msg) {
        logEntry = document.createElement('div');
        logEntry.innerHTML = msg;
        logs.insertBefore(logEntry, logs.firstChild);
    }

    for (let index = 1; index < 7; index++) {
        const opts = { body: 'Notification Body ' + index, title: 'Notification Title ' + index, subtitle: 'testSubtitle', icon: 'favicon.ico', context: { testContext: 'testContext'}, date: Date.now()}
        const clone = document.importNode(tmpl.content, true);
        const createBtn = clone.querySelector('.row .create');
        const clearBtn = clone.querySelector('.row .clear');

        createBtn.addEventListener('click', () => {
            ofnotes.create(`notification_${index}`, opts)
            .then((notification) => {
                if (!notification.success) {
                    logit(`Notification ids must be unique! ID: notification_${index} already exists!`)
                }
            })
        });
        createBtn.innerHTML = `Create Notification ${index}`;

        clearBtn.addEventListener('click', () => {
            ofnotes.clear(`notification_${index}`)
            .then(() => {
                logit(`notification_${index} cleared`)
            });
        });
        clearBtn.innerHTML = `Clear Notification ${index}`;

        btns.appendChild(clone);
    }

    document.getElementById(`getAllNotes`).addEventListener('click', () => {
        ofnotes.getAll().then((notifications) => {
            logit(`Recieved ${notifications.value.length} notifications from the Notification Center!`);
        })
    });

    document.getElementById(`clearAllNotes`).addEventListener('click', () => {
        ofnotes.clearAll().then(() => {
            logit(`All notifications cleared from the Notification Center!`);
        })
    });

    ofnotes.addEventListener('click', (payload) => {
        logit(`CLICK action received from notification ${payload.id}`);
    });
    
    ofnotes.addEventListener('close', (payload) => {
        logit(`CLOSE action received from notification ${payload.id}`);
    });

    const dockBtn = document.getElementById('undockBtn');
    dockBtn.addEventListener('click', () => {
        console.log('undocking window');
        oflayouts.undock();
    });

    new offdc3.IntentListener( (context) => {
        console.log('fdc3 intent event: ' + JSON.stringify(context, null, 4));
    });

    new offdc3.ContextListener( (context) => {
        console.log('fdc3 context event: ' + JSON.stringify(context, null, 4));
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
                console.log('broadcasting FDC3 context for: ' + symName);
                offdc3.broadcast(sym);
            });
            div.appendChild(btn);
            fdc3Links.appendChild(div);
        }
    }
});