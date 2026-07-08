import { Container, Graphics } from 'pixi.js';

export class Bullet {
  constructor(x, y, angle, speed = 16) {
    this.x = x;
    this.y = y;
    // Calculate velocities based on direction angle
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.active = true;
    this.radius = 6; // Collision bounding radius

    this.view = new Container();
    this.view.x = x;
    this.view.y = y;

    this.graphics = new Graphics();
    this.drawBullet();
    this.view.addChild(this.graphics);

    // Rotate the bullet graphics towards the moving angle
    this.graphics.rotation = angle;
  }

  drawBullet() {
    const g = this.graphics;
    
    // Draw neon glowing blaster shot
    // Cyan outer glow glow
    g.rect(-12, -4, 24, 8);
    g.fill({ color: 0x00e5ff, alpha: 0.35 });

    // Inner hot white core
    g.rect(-10, -2, 20, 4);
    g.fill({ color: 0xffffff, alpha: 0.95 });
  }

  update(ticker, scrollX) {
    // Standard projectile movement
    this.x += this.vx * ticker.deltaTime;
    this.y += this.vy * ticker.deltaTime;

    // Shift projectile if screen is scrolling
    this.x -= scrollX;

    // Apply internal coords to view container
    this.view.x = this.x;
    this.view.y = this.y;

    // Check if laser goes too far off-screen
    const buffer = 150;
    if (
      this.y < -buffer ||
      this.y > window.innerHeight + buffer ||
      this.x < -buffer ||
      this.x > window.innerWidth + buffer
    ) {
      this.active = false;
    }
  }

  destroy() {
    this.view.destroy({ children: true });
  }
}
