# Читаем и исправляем ВСЕ оставшиеся проблемы
with open('app.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Processing {len(lines)} lines...")

# Проходим по всем строкам и исправляем
for i, line in enumerate(lines):
    # Исправляем строки, которые выглядят как остатки многострочных комментариев
    stripped = line.strip()
    
    # Если строка содержит только текст без комментария в начале, добавляем #
    if stripped and not stripped.startswith('#') and not stripped.startswith('import') and not stripped.startswith('from') and not stripped.startswith('class') and not stripped.startswith('def') and not stripped.startswith('@') and not stripped.startswith('if') and not stripped.startswith('try') and not stripped.startswith('except') and not stripped.startswith('else') and not stripped.startswith('elif') and not stripped.startswith('for') and not stripped.startswith('while') and not stripped.startswith('with') and not stripped.startswith('return') and not stripped.startswith('yield') and not stripped.startswith('break') and not stripped.startswith('continue') and not stripped.startswith('pass') and not stripped.startswith('raise') and not stripped.startswith('assert') and not '=' in stripped and not stripped.startswith('(') and not stripped.startswith(')') and not stripped.startswith('{') and not stripped.startswith('}') and not stripped.startswith('[') and not stripped.startswith(']') and len(stripped) > 3:
        
        # Добавляем комментарий если это похоже на описание
        if any(word in stripped.lower() for word in ['extraction', 'support', 'chain', 'method', 'processing', 'analysis', 'manager', 'service', 'api', 'database', 'authentication']):
            indent = len(line) - len(line.lstrip())
            lines[i] = ' ' * indent + '# ' + stripped + '\n'
            print(f"Fixed line {i+1}: {stripped}")

# Записываем исправленный файл
with open('app.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Final fix completed\!")
