#!/usr/bin/env python3
"""构建本地版：将ES Module游戏内联为单个HTML文件，支持file://直接打开"""

import os
import re
import glob

def resolve_imports(js_dir, entry_file, visited=None):
    """递归解析ES Module依赖，拼接所有JS文件"""
    if visited is None:
        visited = set()

    filepath = os.path.join(js_dir, entry_file)
    if not os.path.exists(filepath) or filepath in visited:
        return ''
    visited.add(filepath)

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    result = ''
    # 找到所有import语句（支持多行import），递归处理依赖
    for match in re.finditer(r"import\s+[\s\S]*?from\s+['\"]([^'\"]+)['\"];?", content):
        dep_file = match.group(1)
        result += resolve_imports(js_dir, dep_file, visited)

    # 移除import语句（支持多行）
    cleaned = re.sub(r"import\s+[\s\S]*?from\s+['\"]([^'\"]+)['\"];?\n?", '', content)
    cleaned = re.sub(r"export\s+(function|class|const|let|var)\s", r'\1 ', cleaned)
    cleaned = re.sub(r"export\s+\{[^}]*\};?\n?", '', cleaned)
    cleaned = re.sub(r"export\s+default\s", '', cleaned)

    result += f'// === {entry_file} ===\n' + cleaned + '\n'
    return result


def build_game(game_name, base_dir='.'):
    """构建单个游戏的本地版"""
    html_path = os.path.join(base_dir, game_name, 'index.html')
    js_dir = os.path.join(base_dir, game_name, 'js')

    if not os.path.exists(html_path):
        return None, 'index.html not found'

    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()

    # 情况1: <script type="module" src="js/main.js">  外部文件
    match = re.search(r'<script\s+type="module"\s+src="([^"]+)"', html)
    if match:
        entry_file = match.group(1)
        if entry_file.startswith('./js/'):
            entry_file = entry_file[5:]
        elif entry_file.startswith('js/'):
            entry_file = entry_file[3:]

        if not os.path.exists(os.path.join(js_dir, entry_file)):
            return None, f'entry {entry_file} not found'

        all_js = resolve_imports(js_dir, entry_file)

        if not all_js.strip():
            return None, 'no JS content'

        def replace_script(m):
            return f'<script>\n{all_js}\n</script>'

        new_html = re.sub(
            r'<script\s+type="module"\s+src="[^"]*"[^>]*></script>',
            replace_script,
            html
        )

    # 情况2: <script type="module">  内联模块JS（含import语句）
    elif re.search(r'<script\s+type="module">[\s\n]', html):
        # 提取内联JS
        m = re.search(r'<script\s+type="module">[\s\n](.*?)</script>', html, re.DOTALL)
        if not m:
            return None, 'inline module script not parseable'

        inline_js = m.group(1)

        # 解析inline JS中的import依赖（支持多行 from 语法）
        resolved = ''
        for imp in re.finditer(r"import\s+[\s\S]*?from\s+['\"]([^'\"]+)['\"];?", inline_js):
            dep_file = imp.group(1)
            if dep_file.startswith('./js/'):
                dep_file = dep_file[5:]
            elif dep_file.startswith('js/'):
                dep_file = dep_file[3:]
            elif dep_file.startswith('./'):
                dep_file = dep_file[2:]
            resolved += resolve_imports(js_dir, dep_file)

        # 解析裸import语句（import './js/main.js'; 没有from关键字）
        for imp in re.finditer(r"import\s+['\"]([^'\"]+)['\"];?", inline_js):
            dep_file = imp.group(1)
            if dep_file.startswith('./js/'):
                dep_file = dep_file[5:]
            elif dep_file.startswith('js/'):
                dep_file = dep_file[3:]
            elif dep_file.startswith('./'):
                dep_file = dep_file[2:]
            resolved += resolve_imports(js_dir, dep_file)

        # 移除所有import语句
        cleaned = re.sub(r"import\s+[\s\S]*?from\s+['\"]([^'\"]+)['\"];?\n?", '', inline_js)
        cleaned = re.sub(r"import\s+['\"][^'\"]+['\"];?\n?", '', cleaned)
        all_js = resolved + cleaned

        def replace_inline(m):
            return f'<script>\n{all_js}\n</script>'

        new_html = re.sub(
            r'<script\s+type="module">\s*\n.*?</script>',
            replace_inline,
            html,
            flags=re.DOTALL
        )

    # 情况3: 没有module script（普通script），直接可用
    else:
        new_html = html

    # 修复DOMContentLoaded：内联脚本在DOM已加载后才执行，需要立即调用
    def fix_dom_ready(m):
        func_name = m.group(1)
        return (
            f'if(document.readyState==="loading"){{'
            f'document.addEventListener("DOMContentLoaded",{func_name})'
            f'}}else{{'
            f'{func_name}()'
            f'}}'
        )

    new_html = re.sub(
        r'document\.addEventListener\(\s*["\']DOMContentLoaded["\']\s*,\s*(\w+)\s*\)',
        fix_dom_ready,
        new_html
    )

    # 移除file://阻断脚本
    new_html = re.sub(
        r'<script>\s*if\(location\.protocol==="file:"\)\{.*?\}\s*</script>',
        '',
        new_html,
        flags=re.DOTALL
    )

    # 移除已有的内联file://脚本（另一种格式）
    def remove_file_check(m):
        return ''

    new_html = re.sub(
        r"<script>\s*if\s*\(location\.protocol\s*===\s*'file:'\)\s*\{[^}]*\}\s*</script>",
        remove_file_check,
        new_html,
        flags=re.DOTALL
    )

    # 写入local/目录
    local_dir = os.path.join('local', game_name)
    os.makedirs(local_dir, exist_ok=True)
    output_path = os.path.join(local_dir, 'index.html')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(new_html)

    return output_path, None


def build_root_index():
    """构建本地版首页"""
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 替换静态href链接
    def fix_link(m):
        path = m.group(1)
        if path.startswith('games/'):
            path = path[6:]
        return f'href="local/{path}/index.html"'

    new_html = re.sub(
        r'href="([^"]+)/index\.html"',
        fix_link,
        html
    )

    # 替换JS动态链接: 'games/' + g.folder + '/index.html' → g.folder + '/index.html'
    new_html = new_html.replace("'games/' + g.folder + '/index.html'", "g.folder + '/index.html'")
    # 也处理双引号版本
    new_html = new_html.replace('"games/" + g.folder + "/index.html"', 'g.folder + "/index.html"')

    # 移除file://阻断脚本
    def remove_check(m):
        return ''

    new_html = re.sub(
        r"<script>\s*if\s*\(location\.protocol\s*===\s*'file:'\)\s*\{[^}]*\}\s*</script>",
        remove_check,
        new_html,
        flags=re.DOTALL
    )

    with open(os.path.join('local', 'index.html'), 'w', encoding='utf-8') as f:
        f.write(new_html)

    print('OK: local/index.html (root launcher)')


def main():
    # 清理旧的构建
    if os.path.exists('local'):
        import shutil
        shutil.rmtree('local')

    os.makedirs('local', exist_ok=True)

    # 复制必要的静态资源（图片等）
    import shutil
    games_dir = 'games'
    for game_dir in sorted(glob.glob(os.path.join(games_dir, '*/'))):
        game_name = os.path.basename(game_dir.rstrip('/\\'))
        # 复制游戏目录中的非HTML/JS文件（如图片）
        for root, dirs, files in os.walk(game_dir):
            for f in files:
                if f.endswith('.html') or f.endswith('.js'):
                    continue
                src = os.path.join(root, f)
                rel = os.path.relpath(src, game_dir)
                dst = os.path.join('local', game_name, rel)
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.copy2(src, dst)

    # 构建所有游戏
    ok_count = 0
    fail_list = []

    for game_dir in sorted(glob.glob(os.path.join(games_dir, '*/'))):
        game_name = os.path.basename(game_dir.rstrip('/\\'))

        output, err = build_game(game_name, base_dir=games_dir)
        if output:
            ok_count += 1
            print(f'OK: {game_name}')
        else:
            fail_list.append(f'{game_name}: {err}')

    # 构建首页
    build_root_index()

    print(f'\n========== 构建完成 ==========')
    print(f'成功: {ok_count}')
    if fail_list:
        print(f'失败: {len(fail_list)}')
        for f in fail_list:
            print(f'  - {f}')
    print(f'\n本地版目录: local/')
    print(f'双击 local/index.html 即可打开游戏合集')


if __name__ == '__main__':
    main()
