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

// 📝 LOGS STORAGE
let botLogs = "Bot logs will appear here...\n";

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html><html><head><title>Kosem Panel</title>
        <style>body{background:#111;color:#fff;font-family:monospace;padding:20px;} #log-box{background:#000;padding:10px;height:200px;overflow-y:scroll;border:1px solid #444;margin-top:10px;}</style></head>
        <body>
            <h2>Kosem Bot Control</h2>
            <button onclick="deploy()">Start Bot</button>
            <div id="log-box"></div>
            <script>
                const logBox = document.getElementById('log-box');
                const es = new EventSource('/logs');
                es.onmessage = (e) => { logBox.innerText += e.data + "\\n"; logBox.scrollTop = logBox.scrollHeight; };
                async function deploy(){ 
                    const sid = prompt("Paste Session ID:");
                    await fetch('/deploy-bot', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({sessionId:sid})});
                }
            </script>
        </body></html>`);
});

// 📡 LOGS STREAMING API
app.get('/logs', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const interval = setInterval(() => res.write(`data: ${new Date().toLocaleTimeString()} - System Status: OK\n\n`), 5000);
    req.on('close', () => clearInterval(interval));
});

// 🚀 DEPLOY & LOGS CAPTURE
app.post('/deploy-bot', async (req, res) => {
    const { sessionId } = req.body;
    const botProcess = spawn('node', ['index.js'], { env: { ...process.env } });
    
    botProcess.stdout.on('data', (data) => console.log(`Bot Log: ${data}`));
    botProcess.stderr.on('data', (data) => console.error(`Bot Error: ${data}`));
    
    res.json({ success: true, message: "Bot started! Check logs on page." });
});

app.listen(PORT, () => console.log('🚀 Server Live'));
