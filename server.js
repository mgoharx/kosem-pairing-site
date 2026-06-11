const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 🌐 KOSEM PREMIUM FRONTEND (GREYSCALE GLASSMORPHISM WITH SOFT REALISTIC SHADOWS)
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
                    background: linear-gradient(135deg, #111111, #000000, #1a1a1a);
                    color: #ffffff; display: flex; justify-content: center; align-items: center; overflow: hidden;
                }
                
                .circle1, .circle2 {
                    position: absolute; border-radius: 50%; filter: blur(90px); z-index: 0;
                    animation: float 8s ease-in-out infinite alternate;
                }
                .circle1 { width: 350px; height: 350px; background: rgba(255, 255, 255, 0.04); top: -10%; left: -10%; }
                .circle2 { width: 400px; height: 400px; background: rgba(255, 255, 255, 0.06); bottom: -10%; right: -10%; animation-delay: -4s; }
                @keyframes float { 0% { transform: translateY(0); } 100% { transform: translateY(20px); } }

                /* 🚀 FIXED: ULTRA SOFT AMBIENT LAYERED SHADOWS 🚀 */
                .glass-card {
                    position: relative; z-index: 1; width: 100%; max-width: 420px; padding: 40px 30px;
                    background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(30px);
                    -webkit-backdrop-filter: blur(30px);
                    border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px;
                    
                    /* Real Multi-layered Diffuse Drop Shadow (No solid black block feel) */
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 
                                0 20px 40px -10px rgba(0, 0, 0, 0.6), 
                                0 40px 80px -15px rgba(0, 0, 0, 0.8);
                                
                    text-align: center; box-sizing: border-box;
                    transition: height 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); overflow: hidden;
                }
                h2 { margin: 0 0 10px; font-size: 28px; font-weight: 700; letter-spacing: 1px; }
                p { color: rgba(255, 255, 255, 0.5); font-size: 14px; margin-bottom: 25px; line-height: 1.5; }
                
                .toggle-box { display: flex; background: rgba(0, 0, 0, 0.4); border-radius: 12px; margin-bottom: 25px; position: relative; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.05); }
                .toggle-btn { flex: 1; padding: 12px; cursor: pointer; color: rgba(255,255,255,0.4); font-weight: 600; font-size: 14px; z-index: 2; position: relative; }
                .toggle-btn.active { color: #ffffff; }
                .toggle-bg { position: absolute; top: 0; left: 0; width: 50%; height: 100%; background: rgba(255, 255, 255, 0.12); border-radius: 12px; z-index: 1; transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); }

                input { width: 100%; padding: 16px; margin-bottom: 20px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; color: white; text-align: center; outline: none; box-sizing: border-box; transition: all 0.3s ease; }
                input:focus { background: rgba(0, 0, 0, 0.5); border-color: rgba(255, 255, 255, 0.3); box-shadow: 0 0 15px rgba(255, 255, 255, 0.05); }
                
                /* 🚀 FIXED: BUTTON SOFT DEFIUSE SHADOW 🚀 */
                .action-btn { 
                    width: 100%; padding: 16px; background: #ffffff; color: #000000; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; 
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: all 0.3s ease; 
                }
                .action-btn:hover { background: #f0f0f0; transform: translateY(-1px); box-shadow: 0 6px 15px rgba(0,0,0,0.3); }
                .action-btn:active { transform: translateY(1px); box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
                
                .tab-content { display: none; opacity: 0; transform: translateY(15px); transition: opacity 0.35s ease, transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); }
                .tab-content.active { display: block; }
                .tab-content.show { opacity: 1; transform: translateY(0); }

                #code-container, #qr-result { margin-top: 30px; }
                .code-box { font-size: 32px; font-weight: bold; letter-spacing: 6px; background: rgba(0, 0, 0, 0.4); padding: 15px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); display: inline-block; margin-bottom: 15px; color: #fff; }
                .qr-image { border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); padding: 10px; background: white; margin-bottom: 15px; }
                .instructions { font-size: 13px; color: rgba(255, 255, 255, 0.4); line-height: 1.5; }
                .loading { color: #cccccc; font-weight: 500; animation: pulse 1.5s infinite; }
                .error { color: #ff5555; font-weight: 500; }
                @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
            </style>
        </head>
        <body>
            <div class="circle1"></div><div class="circle2"></div>
            <div class="glass-card" id="main-card">
                <h2>Kosem Bot</h2>
                <p>Choose a method to link your device securely.</p>
                <div class="toggle-box">
                    <div class="toggle-bg" id="toggle-bg"></div>
                    <div class="toggle-btn active" id="btn-phone" onclick="switchTab('phone')">Phone Number</div>
                    <div class="toggle-btn" id="btn-qr" onclick="switchTab('qr')">QR Code</div>
                </div>
                <div id="section-phone" class="tab-content active show">
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
                function animateHTMLChange(element, newHTML) {
                    const card = document.getElementById('main-card');
                    const startHeight = card.offsetHeight;
                    card.style.height = startHeight + 'px';
                    element.innerHTML = newHTML;
                    card.style.height = 'auto';
                    const targetHeight = card.offsetHeight;
                    card.style.height = startHeight + 'px';
                    void card.offsetHeight;
                    card.style.height = targetHeight + 'px';
                    setTimeout(() => { card.style.height = 'auto'; }, 400);
                }

                function switchTab(tab) {
                    const phoneSection = document.getElementById('section-phone');
                    const qrSection = document.getElementById('section-qr');
                    const btnPhone = document.getElementById('btn-phone');
                    const btnQr = document.getElementById('btn-qr');
                    const toggleBg = document.getElementById('toggle-bg');
                    const card = document.getElementById('main-card');

                    const targetSection = tab === 'phone' ? phoneSection : qrSection;
                    const activeSection = document.querySelector('.tab-content.show');
                    if (activeSection === targetSection) return;

                    if (tab === 'phone') {
                        toggleBg.style.transform = 'translateX(0)';
                        btnPhone.classList.add('active'); btnQr.classList.remove('active');
                    } else {
                        toggleBg.style.transform = 'translateX(100%)';
                        btnQr.classList.add('active'); btnPhone.classList.remove('active');
                    }

                    const startHeight = card.offsetHeight;
                    card.style.height = startHeight + 'px';
                    activeSection.classList.remove('show');
                    
                    setTimeout(() => {
                        activeSection.classList.remove('active');
                        targetSection.classList.add('active');
                        document.getElementById('code-container').innerHTML = '';
                        document.getElementById('qr-result').innerHTML = '';
                        
                        card.style.height = 'auto';
                        const targetHeight = card.offsetHeight;
                        card.style.height = startHeight + 'px';
                        void card.offsetHeight;
                        card.style.height = targetHeight + 'px';
                        
                        setTimeout(() => {
                            targetSection.classList.add('show');
                            setTimeout(() => { card.style.height = 'auto'; }, 400);
                        }, 30);
                    }, 350);
                }

                async function getPairCode() {
                    const num = document.getElementById('number').value;
                    const container = document.getElementById('code-container');
                    if(!num) return animateHTMLChange(container, '<span class="error">Please enter a valid phone number.</span>');
                    
                    animateHTMLChange(container, '<span class="loading">Establishing secure connection...</span>');
                    try {
                        const response = await fetch('/code?number=' + num);
                        const data = await response.json();
                        if(data.code) {
                            animateHTMLChange(container, \`<div class="code-box">\${data.code}</div><div class="instructions">Open WhatsApp > Linked Devices > Link with phone number instead.<br><br>Session ID will be sent to your WhatsApp.</div>\`);
                        } else { animateHTMLChange(container, \`<span class="error">Error: \${data.error}</span>\`); }
                    } catch(e) { animateHTMLChange(container, '<span class="error">Connection timeout. Please try again.</span>'); }
                }

                async function getQRCode() {
                    const container = document.getElementById('qr-result');
                    animateHTMLChange(container, '<span class="loading">Generating QR Code...</span>');
                    try {
                        const response = await fetch('/api/qr');
                        const data = await response.json();
                        if(data.qr) {
                            const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=1&data=' + encodeURIComponent(data.qr);
                            animateHTMLChange(container, \`<img src="\${qrUrl}" width="200" height="200" class="qr-image" alt="QR Code"><div class="instructions">Scan this QR code from WhatsApp > Linked Devices.<br><br>Your Session ID will be sent to your inbox.</div>\`);
                        } else { animateHTMLChange(container, \`<span class="error">Error generating QR.</span>\`); }
                    } catch(e) { animateHTMLChange(container, '<span class="error">Timeout. Try again.</span>'); }
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
            version, auth: state, logger: pino({ level: 'silent' }), printQRInTerminal: false,
            browser: Browsers.macOS('Desktop'), syncFullHistory: false, markOnlineOnConnect: false
        });

        if (!sock.authState.creds.registered) {
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
            version, auth: state, logger: pino({ level: 'silent' }), printQRInTerminal: false,
            browser: Browsers.macOS('Desktop'), syncFullHistory: false, markOnlineOnConnect: false
        });

        let qrSent = false;

        sock.ev.on('connection.update', async (update) => {
            const { qr, connection } = update;
            if (qr && !qrSent) {
                qrSent = true;
                res.json({ qr: qr });
            }
            if (connection === 'close' && !qrSent) {
                if (!res.headersSent) res.json({ error: 'Failed to generate QR.' });
            }
        });

        handleSessionConnection(sock, saveCreds, tempSessionName);
    } catch (e) { if (!res.headersSent) res.status(500).json({ error: 'Server error' }); }
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

                setTimeout(() => { try { fs.rmSync(path.join(__dirname, tempSessionName), { recursive: true, force: true }); } catch(e){} }, 5000);
            } catch (e) { console.error(e); }
        } else if (connection === 'close') {
            setTimeout(() => { try { fs.rmSync(path.join(__dirname, tempSessionName), { recursive: true, force: true }); } catch(e){} }, 5000);
        }
    });
}

app.listen(PORT, () => {
    console.log(`🚀 Kosem Pairing Server live on port ${PORT}`);
});
