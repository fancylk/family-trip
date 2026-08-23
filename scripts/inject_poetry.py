import json

with open('/vol1/1000/esp32_passport_workspace/family-trip/scripts/poetry_guide.js', 'r', encoding='utf-8') as f:
    text = f.read()

start = text.find('{')
end = text.rfind('}') + 1
guide_json = text[start:end]

with open('/vol1/1000/esp32_passport_workspace/family-trip/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

inject_code = f'<script>\nwindow.POETRY_GUIDE = {guide_json};\n</script>\n'
if 'window.POETRY_GUIDE' not in html:
    html = html.replace('</head>', inject_code + '</head>')

if 'data-t="poetry"' not in html:
    nav_item = '<div class="tab" data-t="poetry"><span class="ic">📜</span><span>诗词导游</span></div>'
    html = html.replace('<div class="tab" data-t="spots">', nav_item + '\n<div class="tab" data-t="spots">')

poetry_section = '''
<div id="p-poetry" style="display:none;padding:16px 14px 100px;max-width:760px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#24324a,#1a2436);color:#f4ebd9;padding:20px 18px;border-radius:18px;margin-bottom:18px;border:1px solid rgba(232,207,154,0.3);box-shadow:0 8px 24px rgba(0,0,0,0.25);">
    <div style="font-size:12px;color:#e8cf9a;letter-spacing:0.2em;margin-bottom:6px;">🪶 统编版语文教材同步 · 乐乐专属</div>
    <h2 style="font-size:24px;margin:0 0 8px;font-weight:600;">山河诗词 · 小小导游手记</h2>
    <div style="font-size:13.5px;color:#c9beaa;line-height:1.7;">
      七座古城，万里山河。乐乐将化身金牌小导游，在每个景点为全家朗诵课本诗词、讲述千古名人故事，并考考爸爸妈妈！
    </div>
  </div>
  <div id="poetry-cards-container"></div>
</div>

<script>
function renderPoetryCards() {
  const container = document.getElementById("poetry-cards-container");
  if (!container || !window.POETRY_GUIDE) return;
  let s = "";
  for (const k in window.POETRY_GUIDE) {
    const item = window.POETRY_GUIDE[k];
    s += '<div style="background:#fff;border-radius:16px;padding:18px;margin-bottom:16px;box-shadow:0 3px 12px rgba(0,0,0,0.06);border:1px solid #efe8d8;">';
    s += '  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">';
    s += '    <span style="font-weight:700;font-size:17px;color:#221500;">📍 ' + item.spot + ' <small style="color:#8f7b66;font-size:12px;">(' + item.city + ')</small></span>';
    s += '    <span style="background:#fef3db;color:#9b6510;font-size:11.5px;padding:3px 10px;border-radius:99px;border:1px solid #ebd29f;">' + item.grade + '</span>';
    s += '  </div>';
    s += '  <div style="background:#fbf8f1;border-left:4px solid #b5432a;padding:10px 14px;border-radius:0 10px 10px 0;margin-bottom:12px;">';
    s += '    <div style="font-weight:600;color:#9a341e;font-size:14px;margin-bottom:4px;">📖 ' + item.poem + '</div>';
    s += '    <div style="font-size:13.5px;color:#4a3f35;line-height:1.7;white-space:pre-line;font-family:serif;">' + item.verse + '</div>';
    s += '  </div>';
    s += '  <div style="font-size:13px;color:#615143;line-height:1.65;margin-bottom:10px;">';
    s += '    <b style="color:#221500;">👑 历史名人：</b>' + item.celebrity + '。<br>';
    s += '    <span style="color:#736557;">' + item.story + '</span>';
    s += '  </div>';
    s += '  <div style="background:#edf5ee;color:#1e5e2e;padding:10px 14px;border-radius:10px;font-size:13px;line-height:1.6;border:1px dashed #a3cca8;">';
    s += '    <b>💡 乐乐考考爸妈：</b>' + item.quiz;
    s += '  </div>';
    s += '</div>';
  }
  container.innerHTML = s;
}
document.addEventListener("DOMContentLoaded", renderPoetryCards);
setTimeout(renderPoetryCards, 300);
</script>
'''

if 'id="p-poetry"' not in html:
    html = html.replace('<div class="NavigationBar">', poetry_section + '\n<div class="NavigationBar">')
    # Also update showPage map
    html = html.replace('spots:"#p-spots"', 'poetry:"#p-poetry",spots:"#p-spots"')

with open('/vol1/1000/esp32_passport_workspace/family-trip/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('[+] Successfully injected Poetry Guide Tab & Cards into index.html!')
