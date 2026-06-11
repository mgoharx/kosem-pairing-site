const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 🌐 KOSEM PREMIUM FRONTEND (WITH SMOOTH ANIMATIONS)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Kosem Pairing System</title>
            <style>
                body, html {
                    margin: 0; padding: 0; height: 100%;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    background: linear-gradient(135deg, #1e0b36, #000000, #3a1c71);
                    color: #ffffff; display: flex; justify-content: center; align-items: center; overflow: hidden;
                }
                .circle1, .circle2 {
                    position: absolute; border-radius: 50%; filter: blur(80px); z-index: 0;
                    animation: float 8s ease-in-out infinite alternate;
                }
                .circle1 { width: 350px; height: 350px; background: #ff3e6c; top: -10%; left: -10%; animation-delay: 0s; }
                .circle2 { width: 400px; height: 400px; background: #00f2fe; bottom: -10%; right: -10%; animation-delay: -4s; }
                @keyframes float {
                    0% { transform: translateY(0) scale(1); }
                    100% { transform: translateY(30px) scale(1.1); }
                }
                .glass-card {
                    position: relative; z-index: 1; width: 100%; max-width: 420px; padding: 40px 30px;
                    background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(25px);
                    -webkit-backdrop-filter: blur(25px);
                    border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 24px;
                    box-shadow: 0 25px 45px rgba(0, 0, 0, 0.4); text-align: center; box-sizing: border-box;
                }
                h2 { margin: 0 0 10px; font-size: 28px; font-weight: 700; letter-spacing: 1px; }
                p { color: rgba(255, 255, 255, 0.7); font-size: 14px; margin-bottom: 20px; line-height: 1.5; }
                
                /* Stylish Toggle Switch */
                .toggle-box {
                    display: flex; background: rgba(0, 0, 0, 0.3); border-radius: 12px; margin-bottom: 25px;
                    overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .toggle-btn {
                    flex: 1; padding: 12px; cursor: pointer; color: rgba(255,255,255,0.6); font-weight: 600;
                    font-size: 14px; transition: 0.3s;
                }
                .toggle-btn.active { background: #ff3e6c; color: white; }

                input {
                    width: 100%; padding: 16px; margin-bottom: 20px; background: rgba(0, 0, 0, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; color: white;
                    font-size: 16px; text-align: center; outline: none; box-sizing: border-box; transition: all 0.3s ease;
                }
                input:focus { background: rgba(0, 0, 0, 0.4); border-color: rgba(255, 255, 255, 0.4); box-shadow: 0 0 15px rgba(255, 255, 255, 0.1); }
                
                .action-btn {
                    width: 100%; padding: 16px; background: linear-gradient(135deg, #ff3e6c, #f50057);
                    color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer;
                    box-shadow: 0 8px 20px rgba(255, 62, 108, 0.3); transition: all 0.3s ease;
                }
                .action-btn:hover { transform: translateY(-3px); box-shadow: 0 12px 25px rgba(255, 62, 108, 0.5); }
                
                /* SMOOTH ANIMATION CLASSES */
                .tab-content { display: none; }
                .tab-content.active {
                    display: block;
                    animation: fadeSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                #code-container, #qr-result { margin-top: 30px; }
                .code-box {
                    font-size: 32px; font-weight: bold; letter-spacing: 4px; background: rgba(255, 255, 255, 0.1);
                    padding: 15px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.2);
                    display: inline-block; margin-bottom: 15px; color: #fff; text-shadow: 0 2px 10px rgba(255,255,255,0.3);
                }
                .qr-image { border-radius: 12px; border: 3px solid #ff3e6c; padding: 10px; background: white; margin-bottom: 15px; width: 200px; height: 200px; }
                .instructions { font-size: 13px; color: rgba(255, 255, 255, 0.6); }
                .loading { color: #00f2fe; font-weight: 500; animation: pulse 1.5s infinite; }
                .error { color: #ff3e6c; font-weight: 500; }
                @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
            </style>
        </head>
        <body>
            <div class="circle1"></div>
            <div class="circle2"></div>
            <div class="glass-card">
                <h2>Kosem Bot</h2>
                <p>Choose a method to link your device securely.</p>
                
                <div class="toggle-box">
                    <div class="toggle-btn active" id="btn-phone" onclick="switchTab('phone')">Phone Number</div>
                    <div class="toggle-btn" id="btn-qr" onclick="switchTab('qr')">QR Code</div>
                </div>

                <div id="section-phone" class="tab-content active">
                    <input type="number" id="number" placeholder="e.g. 923001234567">
                    <button class="action-btn" onclick="getPairCode()">Generate Code</button>
                    <div id="code-container"></div>
                </div>

                <div id="section-qr" class="tab-content">
                    <button class="action-btn" onclick="getQRCode()">Generate QR</button>
                    <div id="qr-result"></div>
                </div>
            </div>

            <script>
                // ANIMATED TAB SWITCHING LOGIC
                function switchTab(tab) {
                    const phoneSection = document.getElementById('section-phone');
                    const qrSection = document.getElementById('section-qr');
                    const btnPhone = document.getElementById('btn-phone');
                    const btnQr = document.getElementById('btn-qr');

                    if (tab === 'phone') {
                        qrSection.classList.remove('active');
                        setTimeout(() => { phoneSection.classList.add('active'); }, 50);
                        btnPhone.className = 'toggle-btn active';
                        btnQr.className = 'toggle-btn';
                    } else {
                        phoneSection.classList.remove('active');
                        setTimeout(() => { qrSection.classList.add('active'); }, 50);
                        btnQr.className = 'toggle-btn active';
                        btnPhone.className = 'toggle-btn';
                    }
                    
                    document.getElementById('code-container').innerHTML = '';
                    document.getElementById('qr-result').innerHTML = '';
                }

                async function getPairCode() {
                    const num = document.getElementById('number').value;
                    const container = document.getElementById('code-container');
                    if(!num) return container.innerHTML = '<span class="error">Please enter a valid phone number.</span>';
                    
                    container.innerHTML = '<span class="loading">Establishing secure connection... Please wait.</span>';
                    try {
                        const response = await fetch('/code?number=' + num);
                        const data = await response.json();
                        if(data.code) {
                            container.innerHTML = \`
                                <div class="code-box">\${data.code}</div>
                                <div class="instructions">Open WhatsApp > Linked Devices > Link with phone number instead.<br><br>Session ID will be sent to your WhatsApp.</div>
                            \`;
                        } else { container.innerHTML = \`<span class="error">Error: \${data.error}</span>\`; }
                    } catch(e) { container.innerHTML = '<span class="error">Connection timeout. Please try again.</span>'; }
                }

                async function getQRCode() {
                    const container = document.getElementById('qr-result');
                    container.innerHTML = '<span class="loading">Generating QR Code... Please wait.</span>';
                    try {
                        const response = await fetch('/api/qr');
                        const data = await response.json();
                        if(data.qr) {
                            const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=1&data=' + encodeURIComponent(data.qr);
                            container.innerHTML = \`
                                <img src="\${qrUrl}" class="qr-image" alt="QR Code">
                                <div class="instructions">Scan this QR code from WhatsApp > Linked Devices.<br><br>Your Session ID will be sent to your inbox.</div>
                            \`;
                        } else { container.innerHTML = \`<span class="error">Error generating QR.</span>\`; }
                    } catch(e) { container.innerHTML = '<span class="error">Timeout. Try again.</span>'; }
                }
            </script>
        </body>
        </html>
    `);
});

// ==========================================
// 📡 API: PAIRING CODE GENERATOR (macOS Anti-Block)
// ==========================================
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
            printQRInTerminal: false,
            // 🚀 FIX: WhatsApp ko lagay ga yeh ek asli Apple Mac hai, block nahi hoga
            browser: Browsers.macOS('Desktop'), 
            syncFullHistory: false, 
            markOnlineOnConnect: false
        });

        if (!sock.authState.creds.registered) {
            // Socket connect hone ka theek 4 second intezar phir code request
            setTimeout(async () => {
                try {
                    let code = await sock.requestPairingCode(phoneNumber);
                    code = code?.match(/.{1,4}/g)?.join('-') || code;
                    res.json({ code });
                } catch (err) { res.json({ error: 'Failed to generate code.' }); }
            }, 4000); 
        }

        handleSessionConnection(sock, saveCreds, tempSessionName);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ==========================================
// 📡 API: QR CODE GENERATOR (macOS Anti-Block)
// ==========================================
app.get('/api/qr', async (req, res) => {
    const tempSessionName = `kosem_qr_${Date.now()}`;
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, tempSessionName));
    const { version } = await fetchLatestBaileysVersion();

    try {
        const sock = makeWASocket({
            version, 
            auth: state, 
            logger: pino({ level: 'silent' }), 
            printQRInTerminal: false,
            // 🚀 FIX: macOS Signature for QR as well
            browser: Browsers.macOS('Desktop'), 
            syncFullHistory: false, 
            markOnlineOnConnect: false
        });

        let qrSent = false;

        sock.ev.on('connection.update', async (update) => {
            const { qr, connection } = update;
            if (qr && !qrSent) {
                qrSent = true;
                res.json({ qr: qr });
            }
            if (connection === 'open' || connection === 'close') {
                if(!qrSent && connection === 'close'){
                    if (!res.headersSent) res.json({ error: 'Failed to generate QR.' });
                }
            }
        });

        handleSessionConnection(sock, saveCreds, tempSessionName);
    } catch (e) { 
        if (!res.headersSent) res.status(500).json({ error: 'Server error' }); 
    }
});

// ==========================================
// 🔄 UNIVERSAL SESSION HANDLER 
// ==========================================
function handleSessionConnection(sock, saveCreds, tempSessionName) {
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', async (update) => {
        const { connection } = update;
        if (connection === 'open') {
            try {
                const credsFile = path.join(__dirname, tempSessionName, 'creds.json');
                const credsData = fs.readFileSync(credsFile);
                const compressed = zlib.gzipSync(credsData);
                const base64Session = compressed.toString('base64');
                const finalSessionId = `Kosem!${base64Session}`;
                
                await sock.sendMessage(sock.user.id, { 
                    text: `👑 *Kosem MD Initialized* 👑\n\nYour session has been successfully generated.\n\n📋 *SESSION ID:*\n\`\`\`${finalSessionId}\`\`\`\n\n_Keep this token secure and do not share it with anyone._` 
                });

                setTimeout(() => {
                    try { fs.rmSync(path.join(__dirname, tempSessionName), { recursive: true, force: true }); } catch(e){}
                }, 5000);
            } catch (e) { console.error(e); }
        } else if (connection === 'close') {
            setTimeout(() => {
                try { fs.rmSync(path.join(__dirname, tempSessionName), { recursive: true, force: true }); } catch(e){}
            }, 5000);
        }
    });
}

app.listen(PORT, () => {
    console.log(`🚀 Kosem Pairing Server live on port ${PORT} with QR Support`);
});
