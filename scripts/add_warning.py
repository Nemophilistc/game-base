import os

BASE = r'D:\ClaudeCode\MIMO\MIMO_GAME'
SKIP = {'.claude', 'articles', 'scripts'}

WARNING = '''<script>
if(location.protocol==="file:"){document.body.innerHTML='<div style="position:fixed;inset:0;background:#0a0a0a;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px;font-family:sans-serif;color:#fff;z-index:9999"><div style="font-size:48px;margin-bottom:20px">⚠️</div><h2 style="color:#ff6b4a;font-size:20px;margin-bottom:12px">需要启动HTTP服务器</h2><p style="color:#888;font-size:13px;line-height:1.8;max-width:400px">此游戏使用ES Modules，无法通过file://打开。<br>请在游戏目录运行:</p><div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:12px 20px;margin:16px;font-family:monospace;color:#4aeaff;font-size:13px">python -m http.server 8000</div><p style="color:#666;font-size:12px">然后访问 http://localhost:8000</p><a href="../index.html" style="margin-top:16px;color:#ff6b4a;font-size:13px;text-decoration:none">← 返回游戏合集</a></div>'}
</script>'''

count = 0
for d in sorted(os.listdir(BASE)):
    full = os.path.join(BASE, d)
    if not os.path.isdir(full) or d in SKIP:
        continue
    index = os.path.join(full, 'index.html')
    if not os.path.exists(index):
        continue
    with open(index, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'location.protocol==="file:"' in content:
        print(f'Skipped: {d}')
        continue
    if '</body>' in content:
        content = content.replace('</body>', WARNING + '\n</body>')
        with open(index, 'w', encoding='utf-8') as f:
            f.write(content)
        count += 1
        print(f'Updated: {d}')

print(f'\nDone: {count} files updated')
