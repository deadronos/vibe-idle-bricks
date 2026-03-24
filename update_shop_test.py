import sys
import os

path = 'tests/components/Shop.test.tsx'
with open(path, 'r') as f:
    content = f.read()

search_text = """      const speedButton = within(screen.getByRole('heading', { name: /upgrades/i }).parentElement!).getByRole('button', { name: /speed boost/i })
      expect(speedButton).toBeDisabled()"""

replace_text = """      const speedButton = within(screen.getByRole('heading', { name: /upgrades/i }).parentElement!).getAllByRole('button', { name: /buy/i })[0]
      expect(speedButton).toBeDisabled()"""

if search_text in content:
    content = content.replace(search_text, replace_text)

search_text = """      const speedButton = within(screen.getByRole('heading', { name: /upgrades/i }).parentElement!).getByRole('button', { name: /speed boost/i })
      expect(speedButton).not.toBeDisabled()"""

replace_text = """      const speedButton = within(screen.getByRole('heading', { name: /upgrades/i }).parentElement!).getAllByRole('button', { name: /buy/i })[0]
      expect(speedButton).not.toBeDisabled()"""

if search_text in content:
    content = content.replace(search_text, replace_text)

search_text = """      const speedButton = within(screen.getByRole('heading', { name: /upgrades/i }).parentElement!).getByRole('button', { name: /speed boost/i })
      await user.click(speedButton)"""

replace_text = """      const speedButton = within(screen.getByRole('heading', { name: /upgrades/i }).parentElement!).getAllByRole('button', { name: /buy/i })[0]
      await user.click(speedButton)"""

if search_text in content:
    content = content.replace(search_text, replace_text)

with open(path, 'w') as f:
    f.write(content)
print('Successfully updated ' + path)
