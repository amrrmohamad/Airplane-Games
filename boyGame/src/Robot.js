import { Container, Sprite, Texture } from 'pixi.js';

export class Robot {
  constructor() {
    this.state = {
      walk: false,
      run: false,
      hover: false,
      jump: false,
      shoot: false,
    };

    this.view = new Container();
    this.directionalView = new Container();
    this.view.addChild(this.directionalView);

    // Create the robot sprite
    this.sprite = Sprite.from('robot');
    this.sprite.anchor.set(0.5, 1); // Anchor at bottom center for easier scaling/squashing

    // Add sprite to directional view to handle left/right facing
    this.directionalView.addChild(this.sprite);

    // Animation variables
    this.time = 0;
    this.spawning = false;
    this.spawnTimer = 0;

    // Physics variables for jump
    this.vy = 0;
    this.isJumping = false;
    this.groundY = null;
    this.landingSquashTimer = 0;
    this.aimRotation = 0;
    this.aimingTimer = 0;

    // Blinking variables
    this.blinkTimer = 120 + Math.random() * 240; // time before next blink
    this.blinkDuration = 0; // remaining duration of active blink
  }

  spawn() {
    this.spawning = true;
    this.spawnTimer = 0;
    this.sprite.scale.set(0);
    this.sprite.alpha = 0;
    // Reset physics on spawn
    this.vy = 0;
    this.isJumping = false;
    
    // Reset texture to default and reset blinking variables
    this.sprite.texture = Texture.from('robot');
    this.blinkTimer = 120 + Math.random() * 240;
    this.blinkDuration = 0;
  }

  update() {
    this.time += 0.05; // Simple time accumulator for procedural animation

    if (this.spawning) {
      this.spawnTimer += 0.05;
      const progress = Math.min(1, this.spawnTimer);
      
      // Elastic pop-in effect
      const scale = progress < 0.5 
        ? 2 * progress * progress 
        : -1 + (4 - 2 * progress) * progress;
        
      this.sprite.scale.set(scale);
      this.sprite.alpha = progress;

      if (progress >= 1) {
        this.spawning = false;
        this.sprite.scale.set(1);
      }
      return;
    }

    // Blinking state update
    if (this.blinkDuration > 0) {
      this.blinkDuration--;
      if (this.blinkDuration <= 0) {
        this.sprite.texture = Texture.from('robot');
        this.blinkTimer = 120 + Math.random() * 240; // 2 to 6 seconds before next blink
      }
    } else {
      this.blinkTimer--;
      if (this.blinkTimer <= 0) {
        this.sprite.texture = Texture.from('robot2');
        this.blinkDuration = Math.floor(8 + Math.random() * 8); // blink lasts 8 to 16 frames (~0.15 - 0.25s)
      }
    }

    // Initialize ground level Y coordinate from first placement
    if (this.groundY === null) {
      this.groundY = this.view.y;
    }

    // Jump Physics Loop
    if (this.state.jump && !this.isJumping) {
      this.vy = -16; // Jump upward velocity impulse
      this.isJumping = true;
    }

    if (this.isJumping) {
      this.vy += 0.75; // Gravity acceleration
      this.view.y += this.vy;

      // Check landing collision with floor
      if (this.view.y >= this.groundY) {
        this.view.y = this.groundY;
        this.vy = 0;
        this.isJumping = false;
        this.landingSquashTimer = 1.0; // Trigger squash effect
      }
    }

    // Procedural Animation Logic
    let targetScaleX = 1;
    let targetScaleY = 1;
    let targetRotation = 0; // Default to upright
    let targetYOffset = 0;

    // Keep aiming for a short while after shooting
    if (this.state.shoot) {
      this.aimingTimer = 20; 
    }

    if (this.aimingTimer > 0) {
      targetRotation = this.aimRotation || 0;
      this.aimingTimer--;
    }

    if (this.isJumping) {
      // Stretch when going up, normalize when falling
      if (this.vy < 0) {
        targetScaleX = 0.85;
        targetScaleY = 1.15;
      } else {
        targetScaleX = 0.95;
        targetScaleY = 1.05;
      }
    } else if (this.landingSquashTimer > 0) {
      // Squash upon landing and decay over time
      this.landingSquashTimer -= 0.15;
      targetScaleX = 1.25;
      targetScaleY = 0.75;
    } else if (this.state.run || this.state.walk) {
      // Bobbing and tilting when moving
      const speed = this.state.run ? 2 : 1;
      targetYOffset = Math.abs(Math.sin(this.time * 3 * speed)) * -10;
      // Add slight walking tilt on top of aiming rotation
      targetRotation += Math.sin(this.time * 2 * speed) * 0.05;
    } else if (this.state.hover) {
      // Smooth hovering
      targetYOffset = Math.sin(this.time * 2) * -15 - 10;
    } else {
      // Idle breathing
      targetScaleX = 1 + Math.sin(this.time) * 0.02;
      targetScaleY = 1 - Math.sin(this.time) * 0.02;
    }

    if (this.state.shoot) {
      // Kickback effect
      targetRotation -= 0.1;
      targetScaleX = 1.1;
      targetScaleY = 0.9;
    }

    // Lerp towards target values for smoothness
    this.sprite.scale.x += (targetScaleX - Math.abs(this.sprite.scale.x)) * 0.25;
    this.sprite.scale.y += (targetScaleY - this.sprite.scale.y) * 0.25;
    this.sprite.rotation += (targetRotation - this.sprite.rotation) * 0.25;
    this.sprite.y += (targetYOffset - this.sprite.y) * 0.25;
  }

  aimAt(targetX, targetY) {
    if (this.isSpawning()) return;

    const globalScale = Math.abs(this.view.scale.x);
    const dx = targetX - this.view.x;
    
    // Estimate pivot/shoulder height (around 50% of robot height)
    const pivotY = this.view.y - this.sprite.texture.height * 0.5 * globalScale;
    const dy = targetY - pivotY;

    let localAngle;
    if (this.direction === 1) {
      localAngle = Math.atan2(dy, dx);
    } else {
      localAngle = Math.atan2(dy, -dx);
    }

    // The default gun angle in the image is pointing up-right at about -36 degrees (-0.63 radians)
    const defaultGunAngle = -0.63;
    
    // Calculate required rotation to point the gun at localAngle
    let targetRot = localAngle - defaultGunAngle;

    // Limit rotation to reasonable angles so the robot doesn't turn upside down!
    // Expanded limits to allow tracking targets slightly above or below
    targetRot = Math.max(-1.0, Math.min(1.0, targetRot));

    this.aimRotation = targetRot;
  }

  getMuzzlePosition() {
    const globalScale = this.view.scale.x; 
    
    const w = this.sprite.texture.width;
    const h = this.sprite.texture.height;

    // Gun muzzle location in local image coordinates (w=477, h=523, anchor 0.5, 1)
    // Gun muzzle is roughly at x=425 (offset from center is 186.5px) and y=125 (offset from bottom is -398px)
    const xOffset = w ? w * 0.39 : 186.5; 
    const yOffset = h ? -h * 0.76 : -398;

    // Rotate this point around the origin (0, 0) by the sprite's current rotation
    const angle = this.sprite.rotation;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const rotX = xOffset * cos - yOffset * sin;
    const rotY = xOffset * sin + yOffset * cos;

    return {
      x: this.view.x + (rotX * this.direction) * globalScale,
      y: this.view.y + rotY * Math.abs(globalScale)
    };
  }

  isSpawning() {
    return this.spawning;
  }

  get direction() {
    return this.directionalView.scale.x > 0 ? 1 : -1;
  }

  set direction(value) {
    this.directionalView.scale.x = value;
  }
}
