import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class Balloon {
  constructor(x, y, type = 'normal', letter = 'A') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.letter = letter;
    this.active = true;

    // Different balloon types config
    const types = {
      small: { radius: 15, speed: 3.5, points: 25, color: 0xff4081, scoreColor: '#ff4081' }, // Fast and hot pink
      normal: { radius: 24, speed: 2.0, points: 10, color: 0x00e5ff, scoreColor: '#00e5ff' }, // Standard and cyan
      large: { radius: 34, speed: 1.2, points: 5, color: 0xffeb3b, scoreColor: '#ffeb3b' },  // Slow and yellow
      special: { radius: 19, speed: 4.2, points: 50, color: 0xb388ff, scoreColor: '#b388ff' } // Very fast and neon purple
    };

    const config = types[type] || types.normal;
    this.radius = config.radius;
    this.speed = config.speed;
    this.points = config.points;
    this.color = config.color;
    this.scoreColor = config.scoreColor;

    // Horizontal sway config (sine wave simulation)
    this.swaySpeed = 0.02 + Math.random() * 0.02;
    this.swayAmount = 10 + Math.random() * 10;
    this.swayOffset = Math.random() * Math.PI * 2;
    this.time = 0;

    // Create the container and graphics
    this.view = new Container();
    this.view.x = x;
    this.view.y = y;

    this.graphics = new Graphics();
    this.drawBalloon();
    this.view.addChild(this.graphics);

    // Draw the letter on the balloon center
    const textStyle = new TextStyle({
      fontFamily: 'Cairo',
      fontSize: Math.round(this.radius * 0.95),
      fontWeight: '800',
      fill: '#ffffff',
      stroke: { color: 0x121621, width: 3.5 },
      align: 'center'
    });
    this.letterText = new Text({ text: this.letter, style: textStyle });
    this.letterText.anchor.set(0.5);
    this.letterText.x = 0;
    this.letterText.y = -this.radius * 0.08; // position slightly above origin for oval center alignment
    this.view.addChild(this.letterText);
  }

  drawBalloon() {
    const r = this.radius;
    const g = this.graphics;
    g.clear();

    // 1. Draw string first (rendered behind the body)
    g.moveTo(0, r * 1.1);
    g.bezierCurveTo(-4, r + 12, 4, r + 24, 0, r + 36);
    g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.4 });

    // 2. Draw balloon body (slight vertical oval stretch)
    g.ellipse(0, 0, r, r * 1.15);
    g.fill({ color: this.color });
    g.stroke({ width: 2, color: 0xffffff, alpha: 0.25 });

    // 3. Draw bottom knot (triangle shape)
    g.moveTo(-3, r * 1.12);
    g.lineTo(3, r * 1.12);
    g.lineTo(0, r * 1.12 + 5);
    g.lineTo(-3, r * 1.12);
    g.fill({ color: this.color });

    // 4. Draw glossy 3D highlight (top-left glare)
    g.ellipse(-r * 0.35, -r * 0.45, r * 0.28, r * 0.16);
    g.fill({ color: 0xffffff, alpha: 0.55 });
  }

  update(ticker, scrollX) {
    this.time += ticker.deltaTime;
    
    // Float upwards
    this.y -= this.speed * ticker.deltaTime;

    // Horizontal sway (sine wave)
    const sway = Math.sin(this.time * this.swaySpeed + this.swayOffset) * this.swayAmount * 0.05;
    this.view.x += sway;

    // Apply scene scrolling speed (if any)
    this.view.x -= scrollX;
    
    // Update internal positions
    this.x = this.view.x;
    this.view.y = this.y;

    // Deactivate if balloon floats out of top screen boundary
    if (this.y < -this.radius * 2) {
      this.active = false;
    }
  }

  destroy() {
    this.view.destroy({ children: true });
  }
}
