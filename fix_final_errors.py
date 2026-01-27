import os

# 1. Fix app/perk/[id].tsx - Cast perk to any to handle 'terms' vs 'termsShort' ambiguity safely
path_perk = "app/perk/[id].tsx"
if os.path.exists(path_perk):
    with open(path_perk, 'r') as f:
        content = f.read()
    
    # Replace the problematic line with a safe cast
    # Previous patch made it: {perk.termsShort || 'No terms available'}
    # We change it to: {(perk as any).terms || (perk as any).termsShort || 'No terms available'}
    new_content = content.replace(
        "{perk.termsShort || 'No terms available'}", 
        "{(perk as any).terms || (perk as any).termsShort || 'No terms available'}"
    )
    
    if content != new_content:
        with open(path_perk, 'w') as f:
            f.write(new_content)
        print("✅ Fixed app/perk/[id].tsx type error")
    else:
        print("ℹ️  No changes needed for app/perk/[id].tsx (pattern not found)")

# 2. Fix components/VerifiedBadge.tsx - Deduplicate imports
path_badge = "components/VerifiedBadge.tsx"
if os.path.exists(path_badge):
    with open(path_badge, 'r') as f:
        lines = f.readlines()
    
    new_lines = []
    seen_ionic = False
    for line in lines:
        if "import { Ionicons } from '@expo/vector-icons';" in line:
            if seen_ionic:
                continue # Skip duplicate
            seen_ionic = True
        new_lines.append(line)
    
    with open(path_badge, 'w') as f:
        f.writelines(new_lines)
    print("✅ Fixed duplicate imports in components/VerifiedBadge.tsx")

