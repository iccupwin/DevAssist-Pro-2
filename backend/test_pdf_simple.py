#!/usr/bin/env python3
"""
Simple test for enhanced PDF extractor without unicode issues
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent))

async def test_simple():
    """Simple test"""
    print("Testing PDF extractor...")
    
    try:
        from services.documents.core.enhanced_pdf_extractor import EnhancedPDFExtractor
        
        extractor = EnhancedPDFExtractor()
        print("Enhanced PDF extractor created successfully")
        
        # Test number parsing
        test_numbers = ["1 000 000,50", "1,000,000.50", "2 500 000 rubles"]
        
        print("\nTesting number parsing:")
        for num_str in test_numbers:
            parsed = extractor._parse_number(num_str)
            if parsed:
                print(f"  '{num_str}' -> {parsed:,.2f}")
            else:
                print(f"  '{num_str}' -> FAILED")
        
        # Test currency extraction
        test_text = """
        Project cost: 25 000 000 rubles
        Alternative: $350,000
        In euros: 320,000 EUR
        Payment in tenge: 185 000 000 KZT
        """
        
        print("\nTesting currency extraction:")
        currencies = extractor._extract_currencies(test_text)
        print(f"Found {len(currencies)} currencies:")
        for curr in currencies:
            print(f"  {curr['formatted']} at position {curr['position']}")
        
        print("\nSUCCESS: Enhanced PDF extractor is working!")
        return True
        
    except Exception as e:
        print(f"ERROR: {e}")
        return False

async def main():
    success = await test_simple()
    return 0 if success else 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)