import os

# 1. Fix app/legal/[id].tsx
legal_path = "app/legal/[id].tsx"
if os.path.exists(legal_path):
    with open(legal_path, "r") as f:
        content = f.read()
    
    # Replace > with &gt; in text contexts (specifically the line causing error)
    new_content = content.replace("Settings > Danger Zone > Disconnect", "Settings &gt; Danger Zone &gt; Disconnect")
    
    if content != new_content:
        with open(legal_path, "w") as f:
            f.write(new_content)
        print("✅ Fixed JSX arrows in app/legal/[id].tsx")
    else:
        print("ℹ️ No changes needed in app/legal/[id].tsx")

# 2. Fix app/(tabs)/orb.tsx
orb_path = "app/(tabs)/orb.tsx"
if os.path.exists(orb_path):
    with open(orb_path, "r") as f:
        lines = f.readlines()
    
    # Remove the specific duplicate line we injected
    new_lines = []
    for line in lines:
        if "import { TouchableOpacity, Text, View } from 'react-native';" in line:
            continue # Skip this line
        new_lines.append(line)
            
    with open(orb_path, "w") as f:
        f.writelines(new_lines)
    print("✅ Fixed duplicate imports in app/(tabs)/orb.tsx")
