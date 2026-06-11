await sock.sendMessage(cleanJid, { text: plainText });
        console.log("✅ Matagumpay na naipadala ang session message.");
    } catch (error) {
        console.log("❌ Error sa pagpapadala ng message:", error);
    }
}

// ==========================================
// 📡 API: PAIRING CODE GENERATOR
// ==========================================
app.get('/code', async (req, res) => {
    let phoneNumber = req.query.number;
    if (!phoneNumber) return res.status(400).json({ error: 'Kinakailangan ang numero' });
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');

    const tempSessionName = `kosem_${Date.now()}`;
    const sessionPath = path.join(__dirname, tempSessionName);

    async function startKosem() {
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version, 
            auth: state, 
            logger: pino({ level: 'silent' }), 
            printQRInTerminal: false,
            browser: ['Ubuntu', 'Chrome', '20.0.04'], 
            syncFullHistory: false, 
            markOnlineOnConnect: false
        });

        sock.ev.on('creds.update', saveCreds);

        if (!sock.authState.creds.registered && !res.headersSent) {
            setTimeout(async () => {
                try {
                    let code = await sock.requestPairingCode(phoneNumber);
                    code = code?.match(/.{1,4}/g)?.join('-') || code;
                    res.json({ code });
                } catch (err) { 
                    if(!res.headersSent) res.json({ error: 'Nabigong makabuo ng code.' }); 
                }
            }, 3000); 
        }

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                try {
                    const credsData = fs.readFileSync(path.join(sessionPath, 'creds.json'));
                    const compressed = zlib.gzipSync(credsData);
                    const base64Session = compressed.toString('base64');
                    const finalSessionId = `Kosem!${base64Session}`;
                    
                    await sendSessionText(sock, finalSessionId);

                    setTimeout(() => {
                        try { sock.ws.close(); } catch(e){}
                        try { fs.rmSync(sessionPath, { recursive: true, force: true }); } catch(e){}
                    }, 5000); 
                } catch (e) { console.log(e); }
            } else if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (reason === DisconnectReason.restartRequired || reason === 515 || reason === 408 || reason === 503) {
                    startKosem(); 
                } else {
                    setTimeout(() => { try { fs.rmSync(sessionPath, { recursive: true, force: true }); } catch(e){} }, 5000);
                }
            }
        });
    }

    startKosem().catch(e => { if (!res.headersSent) res.status(500).json({ error: 'Error sa server' }); });
});

// ==========================================
// 📡 API: QR CODE GENERATOR
// ==========================================
app.get('/api/qr', async (req, res) => {
    const tempSessionName = `kosem_qr_${Date.now()}`;
    const sessionPath = path.join(__dirname, tempSessionName);

    async function startKosemQR() {
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version, 
            auth: state, 
            logger: pino({ level: 'silent' }), 
            printQRInTerminal: false,
            browser: ['Ubuntu', 'Chrome', '20.0.04'], 
            syncFullHistory: false, 
            markOnlineOnConnect: false
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { qr, connection, lastDisconnect } = update;
            if (qr && !res.headersSent) res.json({ qr: qr });

            if (connection === 'open') {
                try {
                    const credsData = fs.readFileSync(path.join(sessionPath, 'creds.json'));
                    const compressed = zlib.gzipSync(credsData);
                    const base64Session = compressed.toString('base64');
                    const finalSessionId = `Kosem!${base64Session}`;
                    
                    await sendSessionText(sock, finalSessionId);

                    setTimeout(() => {
                        try { sock.ws.close(); } catch(e){}
                        try { fs.rmSync(sessionPath, { recursive: true, force: true }); } catch(e){}
                    }, 5000);
                } catch (e) { console.log(e); }
            } else if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (reason === DisconnectReason.restartRequired || reason === 515 || reason === 408 || reason === 503) {
                    startKosemQR(); 
                } else {
                    if (!res.headersSent) res.json({ error: 'Nabigong makabuo ng QR.' });
                    setTimeout(() => { try { fs.rmSync(sessionPath, { recursive: true, force: true }); } catch(e){} }, 5000);
                }
            }
        });
    }

    startKosemQR().catch(e => { if (!res.headersSent) res.status(500).json({ error: 'Error sa server' }); });
});

app.listen(PORT, () => {
    console.log(`🚀 Gumagana na ang Kosem Pairing Server sa port ${PORT}`);
});
