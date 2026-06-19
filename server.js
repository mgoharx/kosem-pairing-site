const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { spawn } = require('child_process');

// 🛡️ ANTI-CRASH SYSTEM
process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err.message));
process.on('unhandledRejection', (err) => console.error('Unhandled Rejection:', err.message));

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

// 📝 LIVE LOGS SYSTEM
const clients = [];
function sendLog(msg) {
    console.log(msg); // Terminal me bhi dikhaye
    clients.forEach(c => c.write(`data: ${msg}\n\n`)); // Website par bhi bheje
}

// 🌐 KOSEM PREMIUM FRONTEND + PANEL
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Kosem Panel</title>
        <style>
            body{background:#111;color:#fff;font-family:sans-serif;text-align:center;padding:20px;margin:0;}
            .box{background:#222;padding:20px;border-radius:12px;max-width:400px;margin:auto;box-shadow:0 10px 30px rgba(0,0,0,0.5);border:1px solid #333;}
            button{padding:12px 18px;margin:5px;cursor:pointer;background:#fff;color:#000;border:none;border-radius:8px;font-weight:bold;transition:0.3s;}
            button:hover{background:#ddd;}
            input{padding:12px;width:90%;margin-bottom:15px;border-radius:8px;border:1px solid #444;background:#111;color:#fff;text-align:center;box-sizing:border-box;}
            .tab{display:none;margin-top:20px;} .active{display:block;}
            #log-box{background:#000;color:#0f0;padding:15px;height:250px;overflow-y:auto;border:1px solid #444;margin-top:20px;text-align:left;font-family:monospace;font-size:13px;border-radius:8px;}
            h3{color:#50fa7b;letter-spacing:2px;}
        </style></head>
        <body>
        <div class="box">
            <h2>Kosem Bot Panel</h2>
            <div style="display:flex;justify-content:center;gap:5px;">
                <button onclick="show('t-phone')">Pair Code</button>
                <button onclick="show('t-qr')">QR Code</button>
                <button onclick="show('t-deploy')">Deploy</button>
            </div>
            
            <div id="t-phone" class="tab active">
                <p style="color:#aaa;">Enter WhatsApp Number (e.g. 923001234567)</p>
                <input type="number" id="num" placeholder="923...">
                <button onclick="getPair()">Generate Code</button>
                <h3 id="res"></h3>
            </div>
            
            <div id="t-qr" class="tab">
                <p style="color:#aaa;">Scan this QR from Linked Devices</p>
                <button onclick="getQR()">Generate QR</button>
                <div id="qr-res" style="margin-top:15px;background:#fff;padding:10px;border-radius:10px;display:inline-block;min-width:200px;min-height:200px;"></div>
            </div>
            
            <div id="t-deploy" class="tab">
                <p style="color:#aaa;">Paste your Session ID to start bot</p>
                <input type="text" id="sid" placeholder="Kosem!...">
                <button onclick="deploy()">Start Bot in Background</button>
                <p id="d-res" style="color:#ffb86c;font-weight:bold;margin-top:10px;"></p>
                <div id="log-box">Waiting for bot to start...\\n</div>
            </div>
        </div>

        <script>
            function show(id){ document.querySelectorAll('.tab').forEach(e=>e.classList.remove('active')); document.getElementById(id).classList.add('active'); }
            
            async function getPair(){
                document.getElementById('res').innerText="Generating...";
                try {
                    const r=await fetch('/code?number='+document.getElementById('num').value);
                    const d=await r.json();
                    document.getElementById('res').innerText = d.code || d.error;
                } catch(e) { document.getElementById('res').innerText = "Error!"; }
            }
            
            async function getQR(){
                document.getElementById('qr-res').innerHTML="<span style='color:#000'>Loading...</span>";
                try {
                    const r=await fetch('/api/qr');
                    const d=await r.json();
                    if(d.qr) document.getElementById('qr-res').innerHTML = '<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&data='+encodeURIComponent(d.qr)+'">';
                    else document.getElementById('qr-res').innerText = 'Error generating QR';
                } catch(e) { document.getElementById('qr-res').innerHTML = "<span style='color:#000'>Error!</span>"; }
            }
            
            async function deploy(){
                document.getElementById('d-res').innerText="Sending command to server...";
                try {
                    const r=await fetch('/deploy-bot', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({sessionId:document.getElementById('sid').value})});
                    const d=await r.json();
                    if(!d.success) document.getElementById('d-res').innerText = "Error: " + d.message;
                    else document.getElementById('d-res').innerText = "Process Started! Check logs below.";
                } catch(e) { document.getElementById('d-res').innerText = "Server Error!"; }
            }
            
            // Connect to Live Logs
            const es = new EventSource('/logs');
            es.onmessage = e => { 
                const b = document.getElementById('log-box'); 
                b.innerText += e.data + '\\n'; 
                b.scrollTop = b.scrollHeight; 
            };
        </script>
        </body></html>
    `);
});

// 📡 LOGS API
app.get('/logs', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    clients.push(res);
    req.on('close', () => clients.splice(clients.indexOf(res), 1));
});

// 🚀 DEPLOY API (Starts bot.js/index.js)
app.post('/deploy-bot', async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId || !sessionId.startsWith('Kosem!')) return res.json({ success: false, message: "Invalid Session ID." });
    try {
        sendLog("📥 Processing Session ID...");
        const b64data = sessionId.split('!')[1].replace('...', '');
        const compressedData = Buffer.from(b64data, 'base64');
        const decompressedData = zlib.gunzipSync(compressedData);
        
        const sessionFolder = path.join(__dirname, 'session');
        if (!fs.existsSync(sessionFolder)) fs.mkdirSync(sessionFolder, { recursive: true });
        fs.writeFileSync(path.join(sessionFolder, 'creds.json'), decompressedData, 'utf8');
        
        sendLog("⚙️ Starting Bot process...");
        // Make sure index.js exists in your github folder!
        const botProcess = spawn('node', ['index.js'], { detached: true, env: { ...process.env } });
        
        // Capture bot output and send to frontend
        botProcess.stdout.on('data', data => sendLog(`[BOT] ${data.toString().trim()}`));
        botProcess.stderr.on('data', data => sendLog(`[ERROR] ${data.toString().trim()}`));
        botProcess.on('close', code => sendLog(`[SYSTEM] Bot stopped (Code: ${code})`));
        botProcess.unref();
        
        res.json({ success: true });
    } catch (e) { 
        sendLog(`❌ Deploy Error: ${e.message}`);
        res.json({ success: false, message: e.message }); 
    }
});

// 🔄 SMART AUTH HANDLER
async function handleWhatsAppAuth(sock, sessionPath) {
    sock.ev.on('connection.update', async (update) => {
        if (update.connection === 'open') {
            try {
                const credsData = fs.readFileSync(path.join(sessionPath, 'creds.json'));
                const sid = `Kosem!${zlib.gzipSync(credsData).toString('base64')}`;
                await sock.sendMessage(sock.user.id, { text: sid }); // Send ID to WhatsApp
                setTimeout(() => { try{ sock.ws.close(); fs.rmSync(sessionPath, { recursive: true, force: true }); }catch(e){} }, 5000);
            } catch(e) {}
        } else if (update.connection === 'close') {
            setTimeout(() => { try{ fs.rmSync(sessionPath, { recursive: true, force: true }); }catch(e){} }, 5000);
        }
    });
}

// 📱 PAIRING CODE API
app.get('/code', async (req, res) => {
    let num = req.query.number?.replace(/[^0-9]/g, '');
    if (!num) return res.status(400).json({ error: 'Number required' });
    const sessionPath = path.join(__dirname, 'kosem_' + Date.now());
    
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({ version, auth: state, logger: pino({ level: 'silent' }), browser: ['Ubuntu', 'Chrome', '20.0'] });
    sock.ev.on('creds.update', saveCreds);
    
    handleWhatsAppAuth(sock, sessionPath);
    
    setTimeout(async () => {
        try { res.json({ code: await sock.requestPairingCode(num) }); } 
        catch (err) { res.json({ error: 'Failed' }); }
    }, 3000);
});

// 📱 QR CODE API
app.get('/api/qr', async (req, res) => {
    const sessionPath = path.join(__dirname, 'kosem_qr_' + Date.now());
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({ version, auth: state, logger: pino({ level: 'silent' }), browser: ['Ubuntu', 'Chrome', '20.0'] });
    sock.ev.on('creds.update', saveCreds);
    
    handleWhatsAppAuth(sock, sessionPath);
    
    sock.ev.on('connection.update', (update) => {
        if (update.qr && !res.headersSent) res.json({ qr: update.qr });
    });
});

app.listen(PORT, () => console.log('🚀 Server Live on Port ' + PORT));
