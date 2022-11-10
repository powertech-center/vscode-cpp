import datetime
import json
import os

# date time version
version = datetime.datetime.utcnow().strftime('%y.%m.%d')
print("Publishing " + version + "...", flush=True)

# modify package.json version
with open('package.json', 'r+') as f:
    data = json.load(f)
    data["version"] = version
    f.seek(0)      
    json.dump(data, f, indent=2)
    f.truncate()    

# token
token = os.environ.get("VSCE_TOKEN", "")

# publishing
if (token == ""):
    print("Environment variable VSCE_TOKEN not set", flush=True)
    os.system("vsce publish")
else:
    print("Environment variable VSCE_TOKEN not empty", flush=True)
    os.system("vsce publish -p " + token)