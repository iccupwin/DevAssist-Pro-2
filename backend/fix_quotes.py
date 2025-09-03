#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Найти и исправить проблему с тройными кавычками
with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Подсчитать общее количество тройных кавычек
total_quotes = content.count('"""')
print(f"Total triple quotes found: {total_quotes}")

if total_quotes % 2 != 0:
    print("Odd number of triple quotes - adding one at the end of file")
    # Добавим закрывающую тройную кавычку в конец файла
    content += '\n# Added closing triple quote to fix syntax\n"""\n'
    
    # Сохраним исправленный файл
    with open('app_fixed.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Fixed file saved as app_fixed.py")
else:
    print("Even number of triple quotes - should be balanced")
    print("Problem might be elsewhere")