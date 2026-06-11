const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib'); // Compression ke liye

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 🌐 Kosem Bot Frontend Beautiful Website Layout
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Kosem Bot Pairing System</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f0f12; color: white; text-align: center; padding: 50px; }
                .card { background: #1a1a24; max-width: 450px; margin: 0 auto; padding: 30px; border-radius: 15px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); border: 1px solid #2a2a3a; }
                h2 { color: #ff3e6c; margin-top: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 1px; }
                p { color: #a0a0b0; font-size: 14px; }
                input { padding: 14px; width: 80%; border-radius: 8px; border: 1px solid #3a3a50; background: #111116; color: white; margin-bottom: 15px; font-size: 16px; text-align: center; outline: none; }
                input:focus { border-color: #ff3e6c; }
                button { padding: 14px 30px; background: #ff3e6c; color: white; border: none; font-weight: bold; border-radius: 8px; cursor: pointer; font-size: 16px; transition: 0.3s; width: 87%; }
                button:hover { background: #e02453; box-shadow: 0 4px 12px rgba(255, 62, 108, 0.4); }
                #code { font-size: 24px; font-weight: bold; color: #ff3e6c; margin-top: 25px; letter-spacing: 2px; }
                .loading { color: #ffaa00; }
            </style>
        </head>
        <body>
            <div class="card">
                <h2>👑 Kosem Bot 👑</h2>
                <p>Enter your WhatsApp number with country code<br>(e.g., 923001234567)</p>
                <input type="number" id="number" placeholder="92300xxxxxxx"><br>
                <button onclick="getPairCode()">Generate Pairing Code</button>
                <div id="code"></div>
            </div>

            <script>
                async function getPairCode() {
                    const num = document.getElementById('number').value;
                    const codeDiv = document.getElementById('code');
                    if(!num) return alert('Please enter a valid number!');
                    
                    codeDiv.className = 'loading';
                    codeDiv.innerText = 'Connecting to WhatsApp Server...';
                    
                    try {
                        const response = await fetch('/code?number=' + num);
                        const data = await response.json();
                        if(data.code) {
                            codeDiv.className = '';
                            codeDiv.innerHTML = 'Your Pairing Code:<br><br><span style="color:#fff; background:#ff3e6c; padding:8px 15px; border-radius:6px; font-size: 28px;">' + data.code + '</span><br><br><p style="color:#a0a0b0; font-size:13px;">WhatsApp Notification me se link device par click karke ye code lagayein. Link hone ke baad aapko aapki Session ID aapke WhatsApp par mil jayegi.</p>';
                        } else {
                            codeDiv.className = '';
                            codeDiv.innerText = '❌ Error: ' + data.error;
                        }
                    } catch(e) {
                        codeDiv.className = '';
                        codeDiv.innerText = '⚠️ Server Timeout. Please try again.';
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// 📡 API Backend Token Core
app.get('/code', async (req, res) => {
    let phoneNumber = req.query.number;
    if (!phoneNumber) return res.status(400).json({ error: 'Number is required' });

    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');

    const tempSessionName = `kosem_${Date.now()}`;
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, tempSessionName));
    const { version } = await fetchLatestBaileysVersion();

    try {
        const sock = makeWASocket({
            version,
            auth: state,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false
        });

        if (!sock.authState.creds.registered) {
            setTimeout(async () => {
                try {
                    let code = await sock.requestPairingCode(phoneNumber);
                    code = code?.match(/.{1,4}/g)?.join('-') || code;
                    res.json({ code: code });
                } catch (err) {
                    res.json({ error: 'Failed to generate code. Try again.' });
                }
            }, 3000);
        }

        sock.ev.on('creds.update', saveCreds);
        
        sock.ev.on('connection.update', async (update) => {
            const { connection } = update;
            
            if (connection === 'open') {
                try {
                    // Jab user device link kar lega, automatic creds read honge
                    const credsFile = path.join(__dirname, tempSessionName, 'creds.json');
                    const credsData = fs.readFileSync(credsFile);
                    
                    // Gzip compression + Base64 Encoding
                    const compressed = zlib.gzipSync(credsData);
                    const base64Session = compressed.toString('base64');
                    
                    // 🔑 BRAND NEW KOSEM FORMAT
                    const finalSessionId = `Kosem!${base64Session}`;
                    
                    // User ko direct unke inbox mein session id send karna
                    await sock.sendMessage(sock.user.id, { 
                        text: `👑 *WELCOME TO KOSEM BOT* 👑\n\nYour session has been successfully generated!\n\n📋 *YOUR SESSION ID:* \n\n\`\`\`${finalSessionId}\`\`\`\n\n*Note:* Is session ID ko copy karein aur apne config file ya panel me use karein. Kisi ke sath share mat karna!` 
                    });

                    // Server ki memory se cache saaf karna
                    setTimeout(() => {
                        try { fs.rmSync(path.join(__dirname, tempSessionName), { recursive: true, force: true }); } catch(e){}
                    }, 5000);

                } catch (e) {
                    console.error("Error creating session ID:", e);
                }
            } else if (connection === 'close') {
                setTimeout(() => {
                    try { fs.rmSync(path.join(__dirname, tempSessionName), { recursive: true, force: true }); } catch(e){}
                }, 5000);
            }
        });

    } catch (e) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Kosem Pairing Server live on port ${PORT}`);
});