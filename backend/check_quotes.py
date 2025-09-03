#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('app.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    
    triple_quotes = []
    for i, line in enumerate(lines, 1):
        if '"""' in line:
            count = line.count('"""')
            triple_quotes.append((i, count, line.strip()[:80]))
    
    balance = 0
    problematic = []
    for num, count, content in triple_quotes:
        balance += count
        if balance % 2 != 0:
            problematic.append((num, content))
    
    if balance % 2 == 0:
        print(f'OK: All {len(triple_quotes)} lines with triple quotes are balanced')
    else:
        print(f'ERROR: Unbalanced triple quotes found!')
        print(f'Last problematic lines:')
        for num, content in problematic[-3:]:
            print(f'  Line {num}: {content}')

print(f"\nTotal lines in file: {len(lines)}")
print(f"Lines with triple quotes: {len(triple_quotes)}")