import os
import re

# Target file
target_path = "app/(tabs)/orb.tsx"

if not os.path.exists(target_path):
    print(f"❌ Target not found: {target_path}")
    print("Please run 'ls -R app' and tell me the correct filename for the Orb screen.")
    exit(1)

print(f"✅ Found {target_path}, applying patch...")

with open(target_path, "r") as f:
    content = f.read()

# 1. Add Imports
if "MasterDirectory" not in content:
    import_stmt = "import MasterDirectory from '../../components/MasterDirectory';\nimport { TouchableOpacity, Text, View } from 'react-native';\n"
    if "import { useState" not in content:
        import_stmt = "import { useState } from 'react';\n" + import_stmt
    else:
        # If useState is already imported, ensure it's captured (simplification: assume imports exist at top)
        pass 
    
    # Prepend imports to the file
    content = import_stmt + content
    print("   + Imports added")

# 2. Add State (inside the component)
# Look for the default function export
match = re.search(r'export default function.*?\{', content, re.DOTALL)
if match:
    insert_idx = match.end()
    state_hook = "\n  const [dirVisible, setDirVisible] = useState(false);\n"
    if "dirVisible" not in content:
        content = content[:insert_idx] + state_hook + content[insert_idx:]
        print("   + State hook added")
else:
    print("⚠️ Could not find component function entry.")

# 3. Add UI Trigger (Inside return)
# We will inject a fragment wrapper if needed, or just insert at the start of the return
# This is a 'floating' button strategy to be safe against layout complexity
trigger_ui = """
      {/* Master Directory Overlay */}
      <MasterDirectory isVisible={dirVisible} onClose={() => setDirVisible(false)} />
      
      {/* Temp Trigger Button */}
      <TouchableOpacity 
        onPress={() => setDirVisible(true)}
        style={{ position: 'absolute', top: 60, right: 20, zIndex: 9999, backgroundColor: '#222', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#444' }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>MENU</Text>
      </TouchableOpacity>
"""

# Try to insert after <ScreenWrapper> or <View> or just after return (
return_match = re.search(r'return\s*\(\s*', content)
if return_match:
    insert_ui_idx = return_match.end()
    # Check if we need a fragment? For MVP we assume ScreenWrapper or View is root. 
    # We will inject INSIDE the root element if possible, or just after return ( and wrap in <> if needed.
    # SAFEST: Insert it right after the opening tag of the root element.
    
    # Find the first tag after return (
    tag_match = re.search(r'<[A-Za-z]+.*?>', content[insert_ui_idx:])
    if tag_match:
        # Insert AFTER the first opening tag (e.g. <ScreenWrapper>)
        absolute_idx = insert_ui_idx + tag_match.end()
        content = content[:absolute_idx] + trigger_ui + content[absolute_idx:]
        print("   + Trigger UI injected")
    else:
        print("⚠️ Could not find root element to inject UI.")
else:
    print("⚠️ Could not find return statement.")

# Save
with open(target_path, "w") as f:
    f.write(content)

print("✅ Patch applied successfully.")
