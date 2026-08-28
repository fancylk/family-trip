// 乐乐需求提交（文字版）+ 刷新按钮（trip 网站增强组件）
// 语音改文字：手机/iPad 输入法自带「语音转文字」，按住说话即可，
// 服务端不再接收音频、不再跑 ASR（whisper + MiMo），省掉识别成本，识别也更准。
(function() {
  // ===== 1. 刷新按钮（右上角）=====
  const refreshBtn = document.createElement("button");
  refreshBtn.innerHTML = "⟳";
  refreshBtn.title = "刷新页面";
  refreshBtn.style.cssText = "position:fixed;top:14px;right:14px;z-index:300;width:44px;height:44px;border-radius:50%;border:none;background:rgba(40,35,26,.85);color:#fff;font-size:22px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.3)";
  refreshBtn.onclick = function() {
    // 强制拉最新内容
    fetch("version.json", {cache: "no-store"}).catch(()=>{});
    location.reload(true);
  };
  document.body.appendChild(refreshBtn);

  // ===== 2. 需求按钮（右下角）=====
  const ideaBtn = document.createElement("button");
  ideaBtn.innerHTML = "💬";
  ideaBtn.title = "告诉 AI 工程师你的新想法";
  ideaBtn.style.cssText = "position:fixed;right:16px;bottom:80px;z-index:300;width:60px;height:60px;border-radius:50%;border:none;background:linear-gradient(135deg,#b5432a,#8f3220);color:#fff;font-size:26px;cursor:pointer;box-shadow:0 6px 18px rgba(181,67,42,.4)";
  document.body.appendChild(ideaBtn);

  // 需求输入面板
  const panel = document.createElement("div");
  panel.style.cssText = "position:fixed;right:16px;bottom:150px;z-index:300;background:rgba(40,35,26,.94);color:#fff;padding:14px 16px;border-radius:16px;font-size:14px;display:none;width:min(320px,calc(100vw - 32px));line-height:1.6;box-shadow:0 6px 18px rgba(0,0,0,.35);box-sizing:border-box";
  panel.innerHTML =
    '<b>🧒 乐乐的新想法</b>' +
    '<textarea id="lele-idea-text" rows="3" placeholder="想加什么景点故事、小游戏或新玩法？&#10;点输入法上的 🎤 直接说话，它帮你变成文字～" style="width:100%;margin-top:8px;padding:10px;border-radius:10px;border:none;background:#fff7ea;color:#3a2a10;font-size:16px;font-family:inherit;resize:none;box-sizing:border-box"></textarea>' +
    '<div style="display:flex;align-items:center;gap:10px;margin-top:8px">' +
      '<button id="lele-idea-send" style="flex:none;padding:9px 16px;border:none;border-radius:99px;background:linear-gradient(135deg,#e8b95a,#d49430);color:#221500;font-size:15px;font-weight:600;cursor:pointer">🚀 发送给 AI 工程师</button>' +
      '<small style="opacity:.75">说错没关系，工程师会努力看懂～</small>' +
    '</div>';
  document.body.appendChild(panel);
  const statusLine = document.createElement("div");
  statusLine.style.cssText = "margin-top:8px;font-size:13px;display:none";
  panel.appendChild(statusLine);

  function showPanel() {
    panel.style.display = "block";
    if (window.innerWidth > 400) document.getElementById("lele-idea-text").focus();
  }
  function hidePanel() {
    panel.style.display = "none";
    statusLine.style.display = "none";
    ideaBtn.style.display = "";
  }
  function say(txt, ms) {
    statusLine.innerHTML = txt;
    statusLine.style.display = "block";
    if (ms) setTimeout(() => { statusLine.style.display = "none"; }, ms);
  }

  ideaBtn.addEventListener("click", () => {
    if (panel.style.display === "block") hidePanel();
    else showPanel();
  });

  // ===== 3. 提交文字需求 → AI 工程师开工 =====
  let submitting = false;

  async function submitIdea() {
    if (submitting) return;
    const ta = document.getElementById("lele-idea-text");
    const send = document.getElementById("lele-idea-send");
    const text = (ta.value || "").trim();
    if (!text) { say("先写点什么再发送吧 ✏️", 2500); return; }
    submitting = true;
    send.disabled = true;
    send.textContent = "⏳ 提交中...";
    try {
      const resp = await fetch("/api/text", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({text})
      });
      const j = await resp.json();
      if (j.id) {
        ta.value = "";
        send.style.display = "none";
        pollProgress(j.id);
      } else {
        say("❌ 提交失败，再试一次吧", 3000);
        resetSend(send);
      }
    } catch (e) {
      say("❌ 网络错误：" + e.message, 3000);
      resetSend(send);
    }
  }

  function resetSend(send) {
    submitting = false;
    send.disabled = false;
    send.textContent = "🚀 发送给 AI 工程师";
    send.style.display = "";
  }

  async function pollProgress(id) {
    const stages = [
      [0, "🤖 AI 工程师开工啦"],
      [20, "📖 正在读网站代码"],
      [45, "✏️ 正在写你的新内容"],
      [70, "🔍 检查中，马上好"],
      [90, "⏳ 快完成了"],
    ];
    let start = Date.now();
    const timer = setInterval(async () => {
      try {
        const resp = await fetch("/api/progress?id=" + id, {cache: "no-store"});
        const j = await resp.json();
        if (j.status === "done") {
          clearInterval(timer);
          say((j.ok ? "🎉 " : "ℹ️ ") + j.msg + "<br>自动刷新中...");
          // 触发网站自动刷新（复用 version.json 机制）
          setTimeout(() => location.reload(true), 2500);
        } else {
          const sec = Math.floor((Date.now() - start) / 1000);
          const stage = stages.reverse().find(s => sec >= s[0]) || stages[stages.length-1];
          say("💬 收到需求！<br>" + stage[1] + "<br><small>" + sec + " 秒</small>");
        }
      } catch (e) { /* ignore */ }
    }, 3000);
  }

  document.getElementById("lele-idea-send").addEventListener("click", submitIdea);
  document.getElementById("lele-idea-text").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitIdea();
  });
})();
