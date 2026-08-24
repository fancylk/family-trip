// Lele AI Tour Guide Web Audio Sync & Notification Engine
(function() {
    let lastVersion = 0;
    let audioPlayer = new Audio();

    async function pollLeleUpdates() {
        try {
            const resp = await fetch('version.json?t=' + Date.now());
            if (!resp.ok) return;
            const data = await resp.json();
            
            if (lastVersion === 0) {
                lastVersion = data.version;
                return;
            }

            if (data.version > lastVersion) {
                console.log("[🎉 Lele Sync] New Tour Task Deployed:", data.msg);
                lastVersion = data.version;

                // 1. Play Xiaomi MiMo TTS Narration Audio
                if (data.audio_url) {
                    audioPlayer.src = data.audio_url + '?t=' + Date.now();
                    audioPlayer.play().catch(e => console.log("Audio autoplay prevented, user gesture needed:", e));
                }

                // 2. Show Animated Top Notification Banner
                showCelebrationBanner(data.msg || "乐乐小导游发布了新任务！");
                
                // 3. Auto reload content after 2.5s
                setTimeout(() => {
                    window.location.reload();
                }, 2500);
            }
        } catch (e) {
            // silent network retry
        }
    }

    function showCelebrationBanner(msg) {
        let banner = document.getElementById('lele-celebrate-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'lele-celebrate-banner';
            banner.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #FF6B6B, #FFE66D);
                color: #1A1A2E;
                padding: 16px 28px;
                border-radius: 50px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.35);
                font-size: 18px;
                font-weight: bold;
                z-index: 99999;
                display: flex;
                align-items: center;
                gap: 12px;
                animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            `;
            document.body.appendChild(banner);
        }
        banner.innerHTML = `🎉 <span>${msg}</span> 🎙️ <small style="opacity:0.8;">(正在播放 MiMo 语音讲解)</small>`;
    }

    setInterval(pollLeleUpdates, 2000);
    console.log("[+] Lele Web Audio Sync Engine Activated.");
})();
