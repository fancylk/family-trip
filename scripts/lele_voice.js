// 乐乐语音提交 + 刷新按钮（trip 网站增强组件）
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

  // ===== 2. 语音按钮（右下角）=====
  const voiceBtn = document.createElement("button");
  voiceBtn.innerHTML = "🎙️";
  voiceBtn.title = "按住说话";
  voiceBtn.style.cssText = "position:fixed;right:16px;bottom:80px;z-index:300;width:60px;height:60px;border-radius:50%;border:none;background:linear-gradient(135deg,#b5432a,#8f3220);color:#fff;font-size:26px;cursor:pointer;box-shadow:0 6px 18px rgba(181,67,42,.4)";
  document.body.appendChild(voiceBtn);

  // 状态面板
  const panel = document.createElement("div");
  panel.style.cssText = "position:fixed;right:16px;bottom:150px;z-index:300;background:rgba(40,35,26,.92);color:#fff;padding:12px 16px;border-radius:14px;font-size:14px;display:none;max-width:260px;line-height:1.6;box-shadow:0 6px 18px rgba(0,0,0,.35)";
  document.body.appendChild(panel);
  function showPanel(txt) { panel.innerHTML = txt; panel.style.display = "block"; }
  function hidePanel() { panel.style.display = "none"; }

  let mediaRecorder = null, chunks = [], recording = false;

  function setBtnRecording(on) {
    voiceBtn.innerHTML = on ? "⏹" : "🎙️";
    voiceBtn.style.background = on ? "linear-gradient(135deg,#2c5f5d,#1a3a38)" : "linear-gradient(135deg,#b5432a,#8f3220)";
  }

  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      mediaRecorder = new MediaRecorder(stream);
      chunks = [];
      mediaRecorder.ondataavailable = e => chunks.push(e.data);
      mediaRecorder.start();
      recording = true;
      setBtnRecording(true);
      showPanel("🔴 正在录音...<br>说完点击按钮停止");
    } catch (e) {
      showPanel("❌ 麦克风权限被拒绝");
      setTimeout(hidePanel, 3000);
    }
  }

  async function stopAndSubmit() {
    recording = false;
    setBtnRecording(false);
    mediaRecorder.stop();
    await new Promise(r => mediaRecorder.onstop = r);
    mediaRecorder.stream.getTracks().forEach(t => t.stop());
    showPanel("⏳ 语音识别中...");
    const blob = new Blob(chunks, {type: mediaRecorder.mimeType || "audio/webm"});
    try {
      const resp = await fetch("/api/voice", {method: "POST", body: blob});
      const j = await resp.json();
      if (j.id) pollProgress(j.id);
      else { showPanel("❌ 提交失败"); setTimeout(hidePanel, 3000); }
    } catch (e) {
      showPanel("❌ 网络错误：" + e.message);
      setTimeout(hidePanel, 3000);
    }
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
          showPanel((j.ok ? "🎉 " : "ℹ️ ") + j.msg + "<br>自动刷新中...");
          // 触发网站自动刷新（复用 version.json 机制）
          setTimeout(() => location.reload(true), 2500);
        } else {
          const sec = Math.floor((Date.now() - start) / 1000);
          const stage = stages.reverse().find(s => sec >= s[0]) || stages[stages.length-1];
          showPanel("🎙️ 收到需求！<br>" + stage[1] + "<br><small>" + sec + " 秒</small>");
        }
      } catch (e) { /* ignore */ }
    }, 3000);
  }

  voiceBtn.addEventListener("click", () => recording ? stopAndSubmit() : startRec());
})();
