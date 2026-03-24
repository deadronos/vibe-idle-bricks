import sys
import os

path = 'src/game/GameScene.ts'
with open(path, 'r') as f:
    content = f.read()

search_text = """        const steerStrength = 0.03;
        return [
          dx + (deltaX / dist) * steerStrength,
          dy + (deltaY / dist) * steerStrength,
        ];"""

replace_text = """        const steerStrength = 0.06;
        return [
          dx + (deltaX / dist) * steerStrength,
          dy + (deltaY / dist) * steerStrength,
        ];"""

if search_text in content:
    content = content.replace(search_text, replace_text)
    with open(path, 'w') as f:
        f.write(content)
    print('Successfully updated ' + path)
else:
    print('Search text not found in ' + path)
