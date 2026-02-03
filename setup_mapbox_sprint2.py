import json
import os

# --- PART A: Inject Mapbox Plugin into app.json ---
app_json_path = 'app.json'
if os.path.exists(app_json_path):
    with open(app_json_path, 'r') as f:
        data = json.load(f)
    
    # Ensure "expo" key exists
    if 'expo' not in data:
        data['expo'] = {}
    
    # Ensure "plugins" list exists
    if 'plugins' not in data['expo']:
        data['expo']['plugins'] = []
    
    # Check if mapbox is already there
    plugins = data['expo']['plugins']
    mapbox_found = False
    for p in plugins:
        if isinstance(p, list) and p[0] == '@rnmapbox/maps':
            mapbox_found = True
            break
    
    if not mapbox_found:
        print("🔧 Injecting Mapbox plugin to app.json...")
        plugins.append([
            "@rnmapbox/maps",
            {
                "RNMapboxMapsImpl": "mapbox",
                "RNMapboxDownloadToken": "sk.eyJ1IjoiYW1vdXN0YWZhIiwiYSI6ImNta3ZoeGx3aDA2Z3ozZ3B1ZTd0YmE0a2oifQ.B7l4TwOCsjHFF8125-s2Ug"
            }
        ])
        # Also ensure permissions are in ios infoPlist/android
        if 'ios' not in data['expo']: data['expo']['ios'] = {}
        if 'infoPlist' not in data['expo']['ios']: data['expo']['ios']['infoPlist'] = {}
        data['expo']['ios']['infoPlist']['NSLocationWhenInUseUsageDescription'] = "OrbTap needs your location to find nearby drops."
        
        with open(app_json_path, 'w') as f:
            json.dump(data, f, indent=2)
        print("✅ app.json updated.")
    else:
        print("ℹ️ Mapbox plugin already present.")
else:
    print("⚠️ app.json not found! You must configure the plugin manually.")

# --- PART B: Clean up duplicate map components ---
for f in ['components/NativeMap.tsx', 'components/OrbMap.tsx', 'components/TacticalMap.tsx']:
    if os.path.exists(f):
        os.remove(f)
        print(f"🗑️ Deleted unused file: {f}")

# --- PART C: Fix MasterDirectory Routes ---
md_path = "components/MasterDirectory.tsx"
if os.path.exists(md_path):
    with open(md_path, 'r') as f:
        content = f.read()
    
    # Replace the DIRECTORY_ITEMS array with one that matches actual files
    # We look for the array start and end. This is a rough replacement for MVP speed.
    if 'const DIRECTORY_ITEMS' in content:
        print("🔧 Updating MasterDirectory routes...")
        new_items = """const DIRECTORY_ITEMS: DirectoryItem[] = [
  { id: 'orb', label: 'The Orb', icon: 'planet', route: '/(tabs)/orb', description: 'Return to the core tapping experience.', color: '#60A5FA' },
  { id: 'map', label: 'Tactical Map', icon: 'map', route: '/(tabs)/map', description: 'Find nearby drops and allies.', color: '#34D399' },
  { id: 'wallet', label: 'Wallet', icon: 'wallet', route: '/(tabs)/wallet', description: 'Manage your assets and points.', color: '#FBBF24' },
  { id: 'leaderboard', label: 'Leaderboard', icon: 'trophy', route: '/leaderboard', description: 'Global rankings.', color: '#A78BFA' },
  { id: 'orbsignal', label: 'Orb Signal', icon: 'radio', route: '/orbsignal', description: 'Broadcast status to the network.', color: '#EF4444' },
  { id: 'settings', label: 'System', icon: 'settings-sharp', route: '/settings', description: 'App preferences.', color: '#9CA3AF' }
];"""
        # Regex to replace the variable block
        import re
        content = re.sub(r'const DIRECTORY_ITEMS: DirectoryItem\[\] = \[.*?\];', new_items, content, flags=re.DOTALL)
        
        with open(md_path, 'w') as f:
            f.write(content)
        print("✅ MasterDirectory routes fixed.")

