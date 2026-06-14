const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

// 🌐 FRONTEND PANEL
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Kosem Bot Panel</title>
        <style>body{background:#000;color:#fff;font-family:sans-serif;text-align:center;padding:20px;} button{padding:10px 20px;margin:5px;cursor:pointer;background:#444;color:#fff;border:none;border-radius:5px;} input{padding:10px;width:250px;}</style></head>
        <body><h2>Kosem Bot Panel</h2>
        <div id="tabs">
            <button onclick="document.getElementById('p').style.display='block';document.getElementById('d').style.display='none'">Pair</button>
            <button onclick="document.getElementById('p').style.display='none';document.getElementById('d').style.display='block'">Deploy</button>
        </div>
        <div id="p"><input type="number" id="num" placeholder="Number (e.g. 923...)"><button onclick="getPair()">Generate</button><div id="res"></div></div>
        <div id="d" style="display:none;"><input type="text" id="sid" placeholder="Paste Session ID"><button onclick="deploy()">Start Bot</button><div id="dres"></div></div>
        <script>
            async function getPair(){ const n=document.getElementById('num').value; const r=await fetch('/code?number='+n); const d=await r.json(); document.getElementById('res').innerText=d.code||d.error; }
            async function deploy(){ const sid=document.getElementById('sid').value; const r=await fetch('/deploy-bot', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({sessionId:sid})}); const d=await r.json(); document.getElementById('dres').innerText=d.message; }
        </script></body></html>`);
});

// 🚀 DEPLOY API
app.post('/deploy-bot', async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId || !sessionId.startsWith('Kosem!')) return res.json({ success: false, message: "Invalid ID" });
    try {
        const b64data = sessionId.split('!')[1];
        const compressedData = Buffer.from(b64data, 'base64');
        const decompressedData = zlib.gunzipSync(compressedData);
        const sessionFolder = path.join(__dirname, 'session');
        if (!fs.existsSync(sessionFolder)) fs.mkdirSync(sessionFolder, { recursive: true });
        fs.writeFileSync(path.join(sessionFolder, 'creds.json'), decompressedData, 'utf8');
        
        const botProcess = spawn('node', ['index.js'], { detached: true, stdio: 'ignore', env: { ...process.env } });
        botProcess.unref();
        res.json({ success: true, message: "Bot Started Successfully!" });
    } catch (e) { res.json({ success: false, message: e.message }); }
});

// 📡 PAIRING API
app.get('/code', async (req, res) => {
    let phoneNumber = req.query.number;
    if (!phoneNumber) return res.status(400).json({ error: 'Number required' });
    const sessionPath = path.join(__dirname, 'temp_' + Date.now());
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const sock = makeWASocket({ auth: state, logger: pino({ level: 'silent' }) });
    sock.ev.on('creds.update', saveCreds);
    setTimeout(async () => {
        try {
            let code = await sock.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''));
            res.json({ code: code });
        } catch (e) { res.json({ error: 'Failed' }); }
    }, 2000);
});

app.listen(PORT, () => console.log('🚀 Server Live on Port ' + PORT));
