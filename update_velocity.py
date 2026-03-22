import sys
import os

path = 'src/game/GameScene.ts'
with open(path, 'r') as f:
    content = f.read()

search_text = """    ball.x = x;
    ball.y = y;
    ball.dx = dx;
    ball.dy = dy;

    const bounceResult = this.checkBrickCollisions(ball, damageMult, coinMult, config);
    if (bounceResult) {
      ball.dx = bounceResult.dx;
      ball.dy = bounceResult.dy;
    }"""

replace_text = """    ball.x = x;
    ball.y = y;
    ball.dx = dx;
    ball.dy = dy;

    const bounceResult = this.checkBrickCollisions(ball, damageMult, coinMult, config);
    if (bounceResult) {
      ball.dx = bounceResult.dx;
      ball.dy = bounceResult.dy;
    }

    // Ensure velocity magnitude is maintained
    const nextSpeedSq = ball.dx * ball.dx + ball.dy * ball.dy;
    if (nextSpeedSq > 0) {
      const nextSpeed = Math.sqrt(nextSpeedSq);
      ball.dx = (ball.dx / nextSpeed) * actualSpeed;
      ball.dy = (ball.dy / nextSpeed) * actualSpeed;
    }"""

if search_text in content:
    new_content = content.replace(search_text, replace_text)
    with open(path, 'w') as f:
        f.write(new_content)
    print('Successfully updated ' + path)
else:
    print('Search text not found in ' + path)
