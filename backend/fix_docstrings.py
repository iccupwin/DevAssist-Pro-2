import re

with open('app_fixed.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Заменяем все многострочные docstrings
# Паттерн: """   (начало docstring)
# Потом любые строки
# Потом """   (конец docstring)
pattern = r'^\s*"""\s*\n(.*?\n)^\s*"""\s*\n'
replacement = lambda m: '    # ' + m.group(1).strip().replace('\n    ', '\n    # ') + '\n'

content = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)

# Заменяем оставшиеся одиночные """
content = re.sub(r'^\s*""".*?"""\s*$', lambda m: '    # ' + m.group(0).strip().replace('"""', '').strip(), content, flags=re.MULTILINE)

with open('app_fixed.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed all docstring patterns")
