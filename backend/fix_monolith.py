import re

# Читаем файл
with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()

print("Original file length:", len(content.split('\n')), "lines")

# Исправляем все проблемные docstrings построчно
lines = content.split('\n')
fixed_count = 0

for i, line in enumerate(lines):
    original_line = line
    
    # Исправляем одиночные docstrings в функциях
    if '"""' in line and line.count('"""') == 2:
        # Извлекаем содержимое между """
        start_idx = line.find('"""') + 3
        end_idx = line.rfind('"""')
        if start_idx < end_idx:
            content_part = line[start_idx:end_idx].strip()
            indent = len(line) - len(line.lstrip())
            lines[i] = ' ' * indent + '# ' + content_part
            fixed_count += 1
            
    # Исправляем одиночные """ в начале строки
    elif line.strip() == '"""':
        indent = len(line) - len(line.lstrip())
        lines[i] = ' ' * indent + '# '
        fixed_count += 1
        
    # Исправляем строки типа """Some text"""
    elif line.strip().startswith('"""') and line.strip().endswith('"""') and len(line.strip()) > 6:
        content_part = line.strip()[3:-3].strip()
        indent = len(line) - len(line.lstrip())
        lines[i] = ' ' * indent + '# ' + content_part
        fixed_count += 1

content = '\n'.join(lines)

# Сохраняем исправленный файл
with open('app.py', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Fixed {fixed_count} problematic lines")
print("Fixed file length:", len(content.split('\n')), "lines")
print("Monolith syntax should be fixed now\!")
