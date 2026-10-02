/*
 * BLSS Assistant - embeddable chat widget
 * -----------------------------------------
 * Drop chat-widget.css and this file into any page. Set the API endpoint
 * BEFORE including this script:
 *
 *   <script>window.BLSS_CHAT_API_URL = "https://your-backend-domain.com/api/chat";</script>
 *   <link rel="stylesheet" href="chat-widget.css">
 *   <script src="chat-widget.js"></script>
 *
 * No API keys live in this file or anywhere in the browser - the widget only
 * ever talks to your own backend (server/server.js), which holds the real
 * Groq key server-side.
 */
(function () {
  const API_URL = window.BLSS_CHAT_API_URL || "http://localhost:3000/api/chat";

  const QUICK_EN = [
    { label: "Admissions", q: "How do I apply for Form One admission?" },
    { label: "Pre-Form One course", q: "Tell me about the Pre-Form One course and its fees." },
    { label: "Results", q: "What were the school's recent CSEE results?" },
    { label: "Contact", q: "How can I contact the school?" },
  ];
  const QUICK_SW = [
    { label: "Kujiunga", q: "Nitajiungaje na Kidato cha Kwanza?" },
    { label: "Kozi ya Pre-Form One", q: "Niambie kuhusu kozi ya Pre-Form One na ada yake." },
    { label: "Matokeo", q: "Matokeo ya hivi karibuni ya CSEE yalikuwaje?" },
    { label: "Mawasiliano", q: "Ninawezaje kuwasiliana na shule?" },
  ];

  let lang = "en";
  let history = []; // {role: "user"|"assistant", content: string}
  let open = false;

  function injectMarkup() {
    const fab = document.createElement("button");
    fab.className = "chat-fab";
    fab.id = "chatFab";
    fab.setAttribute("aria-label", "Open school assistant chat");
    fab.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="#20160a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span class="dot"></span>';
    fab.onclick = toggleChat;

    const panel = document.createElement("div");
    panel.className = "chat-panel";
    panel.id = "chatPanel";
    panel.innerHTML = `
      <div class="chat-head">
        <div class="who">
          <div class="av">B</div>
          <div>
            <div class="nm">BLSS Assistant</div>
            <div class="st" id="chatStatusText">Online &middot; usually replies in seconds</div>
          </div>
        </div>
        <div class="chat-head-btns">
          <button class="chat-lang" id="chatLangBtn">SW</button>
          <button class="chat-close" aria-label="Close chat">&times;</button>
        </div>
      </div>
      <div class="chat-body" id="chatBody"></div>
      <div class="chat-quick" id="chatQuick"></div>
      <div class="chat-inputrow">
        <input type="text" id="chatInput" placeholder="Type your question...">
        <button id="chatSendBtn" aria-label="Send">&#10148;</button>
      </div>
      <div class="chat-foot" id="chatFootText">Answers are based on BLSS's own published information.</div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    panel.querySelector(".chat-close").onclick = toggleChat;
    panel.querySelector("#chatLangBtn").onclick = toggleLang;
    panel.querySelector("#chatSendBtn").onclick = sendChat;
    panel.querySelector("#chatInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendChat();
    });
  }

  function toggleChat() {
    open = !open;
    document.getElementById("chatPanel").classList.toggle("open", open);
    if (open && history.length === 0) greet();
  }

  function toggleLang() {
    lang = lang === "en" ? "sw" : "en";
    renderLangUI();
  }

  function renderLangUI() {
    const btn = document.getElementById("chatLangBtn");
    const input = document.getElementById("chatInput");
    const foot = document.getElementById("chatFootText");
    const status = document.getElementById("chatStatusText");
    if (lang === "en") {
      btn.textContent = "SW";
      input.placeholder = "Type your question...";
      foot.textContent = "Answers are based on BLSS's own published information.";
      status.textContent = "Online \u00b7 usually replies in seconds";
    } else {
      btn.textContent = "EN";
      input.placeholder = "Andika swali lako...";
      foot.textContent = "Majibu yanatokana na taarifa rasmi za BLSS.";
      status.textContent = "Mtandaoni \u00b7 hujibu ndani ya sekunde";
    }
    renderQuick();
  }

  function renderQuick() {
    const wrap = document.getElementById("chatQuick");
    wrap.innerHTML = "";
    const list = lang === "en" ? QUICK_EN : QUICK_SW;
    list.forEach((item) => {
      const b = document.createElement("button");
      b.textContent = item.label;
      b.onclick = () => {
        document.getElementById("chatInput").value = item.q;
        sendChat();
      };
      wrap.appendChild(b);
    });
  }

  function greet() {
    const msg =
      lang === "en"
        ? "Habari! I'm the BLSS Assistant. Ask me about our school."
        : "Habari! Mimi ni Msaidizi wa BLSS. Niulize kuhusu shule yetu.";
    addMsg("bot", msg);
    renderQuick();
  }

  function addMsg(role, text) {
    const body = document.getElementById("chatBody");
    const div = document.createElement("div");
    div.className = "chat-msg " + (role === "user" ? "user" : "bot");
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return div;
  }

  async function sendChat() {
    const input = document.getElementById("chatInput");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    document.getElementById("chatSendBtn").disabled = true;
    addMsg("user", text);
    history.push({ role: "user", content: text });

    const body = document.getElementById("chatBody");
    const typing = document.createElement("div");
    typing.className = "chat-typing";
    typing.id = "chatTyping";
    typing.textContent = lang === "en" ? "BLSS Assistant is typing..." : "Msaidizi wa BLSS anaandika...";
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, lang }),
      });

      typing.remove();

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Request failed");
      }

      const data = await res.json();
      const reply = (data.reply || "").trim();
      const fallback =
        lang === "en"
          ? "I'm not sure about that yet - please contact the school office at +255 787 112 153."
          : "Sina uhakika na hilo bado - tafadhali wasiliana na ofisi ya shule kwa +255 787 112 153.";
      addMsg("bot", reply || fallback);
      history.push({ role: "assistant", content: reply || fallback });
    } catch (err) {
      const t = document.getElementById("chatTyping");
      if (t) t.remove();
      addMsg(
        "bot",
        lang === "en"
          ? "Sorry, something went wrong. Please contact the school directly at +255 787 112 153 or bukobalutheran@gmail.com."
          : "Samahani, hitilafu imetokea. Tafadhali wasiliana na shule kwa +255 787 112 153 au bukobalutheran@gmail.com."
      );
    }
    document.getElementById("chatSendBtn").disabled = false;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      injectMarkup();
      renderLangUI();
    });
  } else {
    injectMarkup();
    renderLangUI();
  }
})();
