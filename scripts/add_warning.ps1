$dirs = Get-ChildItem 'D:\ClaudeCode\MIMO\MIMO_GAME' -Directory | Where-Object { $_.Name -notin @('.claude','articles','scripts') }
foreach ($d in $dirs) {
    $index = Join-Path $d.FullName 'index.html'
    if (Test-Path $index) {
        $content = Get-Content $index -Raw -Encoding UTF8
        if ($content -notmatch 'file.*protocol.*serverWarning') {
            $warning = '<script>' + "`r`n" + 'if(location.protocol==="file:"){document.body.innerHTML="<div style=\"position:fixed;inset:0;background:#0a0a0a;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px;font-family:sans-serif;color:#fff;z-index:9999\"><div style=\"font-size:48px;margin-bottom:20px\">⚠️</div><h2 style=\"color:#ff6b4a;font-size:20px;margin-bottom:12px\">需要启动HTTP服务器</h2><p style=\"color:#888;font-size:13px;line-height:1.8;max-width:400px\">此游戏使用ES Modules，无法通过file://打开。<br>请在游戏目录运行:</p><div style=\"background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:12px 20px;margin:16px;font-family:monospace;color:#4aeaff;font-size:13px\">python -m http.server 8000</div><p style=\"color:#666;font-size:12px\">然后访问 http://localhost:8000</p><a href=\"../index.html\" style=\"margin-top:16px;color:#ff6b4a;font-size:13px;text-decoration:none\">← 返回游戏合集</a></div>"}' + "`r`n" + '</script>'
            $content = $content -replace '(</body>)', "$warning`r`n`$1"
            Set-Content $index -Value $content -Encoding UTF8 -NoNewline
            Write-Output ('Updated: ' + $d.Name)
        }
    }
}
