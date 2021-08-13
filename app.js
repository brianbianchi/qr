const express = require("express");
const qr = require("qrcode");
const app = express();

app.set("view engine", "ejs");
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
app.use("/img", express.static('img'));
app.use(express.urlencoded({
    extended: false
}));
app.use(express.json());

app.get("/", (req, res) => {
    res.render("index", { src: undefined, message: "" });
});

app.post("/", (req, res) => {
    const { type } = req.body;
    let qrData = '';

    switch (type) {
        case 'url':
            qrData = req.body.url;
            break;
        case 'phone':
            const { phone } = req.body;
            qrData = `tel: ${phone}`;
            break;
        case 'sms':
            const { sms, smsMessage } = req.body;
            qrData = `SMSTO: ${sms}`;
            if (smsMessage) {
                qrData += `:${smsMessage}`;
            }
            break;
        case 'wifi':
            const { auth, name, password } = req.body;
            if (auth === 'none') {
                qrData = `WIFI:S:${name};`;
            } else {
                qrData = `WIFI:T:${auth};S:${name};P:${password};`;
            }
            break;
        case 'email':
            const { email, emailSubject } = req.body;
            qrData = `mailto: ${email}`;
            if (emailSubject) {
                qrData += `?subject=${encodeURIComponent(emailSubject)}`
            }
            break;
        case 'contact':
            const { contactFirstName, contactLastName, contactPhone, contactEmail, } = req.body;
            qrData = `
BEGIN:VCARD
N:${contactFirstName};${contactLastName};
TEL;TYPE=mobile:${contactPhone}
EMAIL:${contactEmail}
VERSION:3.0
END:VCARD
`;
            break;
        case 'event':
            const { eventOrganizerName, eventOrganizerEmail, eventTitle, eventStart, eventEnd } = req.body;
            qrData = `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
ORGANIZER;CN=${eventOrganizerName}:MAILTO:${eventOrganizerEmail}
DTSTART:${formatTimestring(new Date(eventStart).toISOString())}
DTEND:${formatTimestring(new Date(eventEnd).toISOString())}
SUMMARY:${eventTitle}
END:VEVENT
END:VCALENDAR
`;
            break;
        default:
            break;
    }

    if (!qrData.length) {
        res.render("index", { src: undefined, message: "No data to create QR with." });
        return;
    }

    qr.toDataURL(qrData, (err, src) => {
        if (err) res.render("index", { src: undefined, message: err });;

        res.render("index", { src, message: "" });
    });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server running on port ${port}.`);
});

/**
 * Date.toISOString() => yyyymmddThhmmssZ
 * ISO 8601
 */
function formatTimestring(s) {
    return b = s.replace(/-/gi, '').replace(/:/gi, '').replace('.', '').replace('000Z', 'Z');
}