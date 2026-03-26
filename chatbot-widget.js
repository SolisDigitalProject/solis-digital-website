/**
 * Solis Digital — AI Chatbot Widget
 * Embeddable chat widget for client websites.
 *
 * Usage: Add before </body>:
 *   <script>
 *     window.SOLIS_CHAT_CONFIG = { projectId: 1, supabaseUrl: 'https://xxx.supabase.co', color: '#e8a23a' };
 *   </script>
 *   <script src="https://www.solisdigital.co.uk/chatbot-widget.js" defer></script>
 */
(function() {
  'use strict';

  var CFG = window.SOLIS_CHAT_CONFIG || {};
  if (!CFG.projectId || !CFG.supabaseUrl) {
    console.warn('[Solis Chat] Missing config: projectId and supabaseUrl required');
    return;
  }

  var COLOR = CFG.color || '#e8a23a';
  var PROJECT_ID = CFG.projectId;
  var SB_URL = CFG.supabaseUrl;
  var EDGE_FN_URL = SB_URL + '/functions/v1/chatbot';
  var isOpen = false;
  var messages = [];
  var chatConfig = null;

  // ── STYLES ──
  var style = document.createElement('style');
  style.textContent = `
    #solis-chat-btn{position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;background:${COLOR};border:none;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.25);z-index:99998;display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s}
    #solis-chat-btn:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(0,0,0,.35)}
    #solis-chat-btn svg{width:28px;height:28px;fill:#0a0a0a}
    #solis-chat-box{position:fixed;bottom:90px;right:20px;width:380px;max-height:520px;background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.2);z-index:99999;display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
    #solis-chat-box.open{display:flex}
    .solis-chat-header{background:linear-gradient(135deg,#0a0a0a,#1a1a2e);padding:16px 20px;display:flex;align-items:center;gap:10px}
    .solis-chat-header .dot{width:10px;height:10px;border-radius:50%;background:#34d399;flex-shrink:0}
    .solis-chat-header h4{margin:0;color:#fff;font-size:14px;font-weight:700;flex:1}
    .solis-chat-header .close{background:none;border:none;color:#666;font-size:18px;cursor:pointer;padding:0 4px}
    .solis-chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;min-height:280px;max-height:360px;background:#f9fafb}
    .solis-msg{max-width:85%;padding:10px 14px;border-radius:12px;font-size:14px;line-height:1.5;word-wrap:break-word}
    .solis-msg.bot{background:#fff;color:#333;border:1px solid #e5e7eb;align-self:flex-start;border-bottom-left-radius:4px}
    .solis-msg.user{background:${COLOR};color:#0a0a0a;align-self:flex-end;border-bottom-right-radius:4px;font-weight:500}
    .solis-msg.typing{color:#999;font-style:italic;background:#fff;border:1px solid #e5e7eb}
    .solis-chat-input{display:flex;border-top:1px solid #e5e7eb;padding:12px}
    .solis-chat-input input{flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:10px 14px;font-size:14px;outline:none;font-family:inherit}
    .solis-chat-input input:focus{border-color:${COLOR}}
    .solis-chat-input button{background:${COLOR};border:none;border-radius:8px;padding:10px 16px;margin-left:8px;cursor:pointer;font-weight:700;color:#0a0a0a;font-size:14px}
    .solis-chat-input button:disabled{opacity:.5;cursor:not-allowed}
    .solis-powered{text-align:center;padding:6px;font-size:10px;color:#999;background:#f9fafb;border-top:1px solid #f0f0f0}
    .solis-powered a{color:${COLOR};text-decoration:none;font-weight:600}
    @media(max-width:480px){#solis-chat-box{width:calc(100vw - 20px);right:10px;bottom:80px;max-height:70vh}}
  `;
  document.head.appendChild(style);

  // ── BUTTON ──
  var btn = document.createElement('button');
  btn.id = 'solis-chat-btn';
  btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>';
  btn.onclick = toggleChat;
  document.body.appendChild(btn);

  // ── CHAT BOX ──
  var box = document.createElement('div');
  box.id = 'solis-chat-box';
  box.innerHTML = '<div class="solis-chat-header"><div class="dot"></div><h4>Chat with us</h4><button class="close" onclick="document.getElementById(\'solis-chat-box\').classList.remove(\'open\')">&times;</button></div>'
    + '<div class="solis-chat-messages" id="solis-msgs"></div>'
    + '<div class="solis-chat-input"><input type="text" id="solis-input" placeholder="Type a message..." autocomplete="off"><button id="solis-send" onclick="window.__solisSend()">Send</button></div>'
    + '<div class="solis-powered">Powered by <a href="https://www.solisdigital.co.uk" target="_blank">Solis Digital</a></div>';
  document.body.appendChild(box);

  // Enter key
  document.getElementById('solis-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); window.__solisSend(); }
  });

  function toggleChat() {
    isOpen = !isOpen;
    box.classList.toggle('open', isOpen);
    if (isOpen && messages.length === 0) {
      addMessage('bot', 'Hi! How can I help you today? Feel free to ask me anything about our services.');
    }
    if (isOpen) document.getElementById('solis-input').focus();
  }

  function addMessage(role, text) {
    messages.push({ role: role, text: text });
    var msgsEl = document.getElementById('solis-msgs');
    var div = document.createElement('div');
    div.className = 'solis-msg ' + role;
    div.textContent = text;
    msgsEl.appendChild(div);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    return div;
  }

  window.__solisSend = async function() {
    var input = document.getElementById('solis-input');
    var sendBtn = document.getElementById('solis-send');
    var text = input.value.trim();
    if (!text) return;

    input.value = '';
    addMessage('user', text);
    sendBtn.disabled = true;

    var typingEl = addMessage('bot', 'Typing...');
    typingEl.classList.add('typing');

    try {
      var res = await fetch(EDGE_FN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: PROJECT_ID,
          message: text,
          history: messages.slice(-10).map(function(m) { return { role: m.role === 'user' ? 'user' : 'assistant', content: m.text }; })
        })
      });

      typingEl.remove();
      messages.pop(); // Remove typing message

      if (res.ok) {
        var data = await res.json();
        addMessage('bot', data.reply || 'Sorry, I could not process that. Please try again.');
      } else {
        addMessage('bot', 'Sorry, something went wrong. Please try again or contact us directly.');
      }
    } catch (err) {
      typingEl.remove();
      messages.pop();
      addMessage('bot', 'Connection error. Please try again.');
    }

    sendBtn.disabled = false;
    document.getElementById('solis-input').focus();
  };
})();
