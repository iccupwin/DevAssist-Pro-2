#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('app.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Найти все строки с тройными кавычками
triple_quote_lines = []
for i, line in enumerate(lines, 1):
    if '"""' in line:
        count = line.count('"""')
        triple_quote_lines.append((i, count, line.strip()))

print(f"Found {len(triple_quote_lines)} lines with triple quotes")

# Проверить баланс
balance = 0
problem_line = None

for i, (line_num, count, content) in enumerate(triple_quote_lines):
    old_balance = balance
    balance += count
    print(f"Line {line_num}: balance {old_balance} -> {balance} | {content[:50]}")
    
    if balance % 2 != 0 and i == len(triple_quote_lines) - 1:
        problem_line = line_num
    elif balance % 2 != 0 and i < len(triple_quote_lines) - 1:
        next_line_num, next_count, next_content = triple_quote_lines[i + 1]
        if next_line_num - line_num > 50:  # Далеко следующая кавычка
            print(f"  POTENTIAL PROBLEM: Next quote is at line {next_line_num} (gap of {next_line_num - line_num} lines)")

if balance % 2 != 0:
    print(f"\nUNBALANCED: Total balance = {balance}")
    print(f"Problem around line: {problem_line}")
else:
    print(f"\nBALANCED: Total balance = {balance}")