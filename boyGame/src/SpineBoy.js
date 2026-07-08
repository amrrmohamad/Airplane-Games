import { Container } from 'pixi.js';
import { Spine } from '@esotericsoftware/spine-pixi-v8';

// Define the Spine animation map for the character.
// name: animation track key.
// loop: do the animation once or infinitely.
const animationMap = {
  idle: {
    name: 'idle',
    loop: true,
  },
  walk: {
    name: 'walk',
    loop: true,
  },
  run: {
    name: 'run',
    loop: true,
  },
  jump: {
    name: 'jump',
    timeScale: 1.5,
  },
  hover: {
    name: 'hoverboard',
    loop: true,
  },
  spawn: {
    name: 'portal',
  },
  shoot: {
    name: 'shoot',
  },
  aim: {
    name: 'aim',
    loop: true,
  },
};

// Class for handling the character Spine and its animations.
export class SpineBoy {
  constructor() {
    // The character's state.
    this.state = {
      walk: false,
      run: false,
      hover: false,
      jump: false,
      shoot: false,
    };

    // Create the main view and a nested view for directional scaling.
    this.view = new Container();
    this.directionalView = new Container();

    // Create the Spine instance using the preloaded Spine asset aliases.
    this.spine = Spine.from({
      skeleton: 'spineSkeleton',
      atlas: 'spineAtlas',
    });

    // Add the Spine instance to the directional view.
    this.directionalView.addChild(this.spine);

    // Add the directional view to the main view.
    this.view.addChild(this.directionalView);

    // Set the default mix duration for all animations.
    // This is the duration to blend from the previous animation to the next.
    this.spine.state.data.defaultMix = 0.2;
  }

  // Play the portal-in spawn animation.
  spawn() {
    this.spine.state.setAnimation(0, animationMap.spawn.name);
  }

  // Play the spine animation.
  playAnimation({ name, loop = false, timeScale = 1 }, trackIndex = 0) {
    // Skip if the animation is already playing.
    const currentAnim = this.spine.state.getTrack(trackIndex)?.animation.name;
    if (currentAnim === name) return;

    // Play the animation on main track instantly.
    const trackEntry = this.spine.state.setAnimation(trackIndex, name, loop);

    // Apply the animation's time scale (speed).
    trackEntry.timeScale = timeScale;
  }

  update() {
    // Play the jump animation if not already playing.
    if (this.state.jump) this.playAnimation(animationMap.jump);

    // Skip the rest of the animation updates during the jump animation.
    if (this.isAnimationPlaying(animationMap.jump)) return;

    // Handle the character animation based on the latest state and in the priority order.
    if (this.state.hover) this.playAnimation(animationMap.hover);
    else if (this.state.run) this.playAnimation(animationMap.run);
    else if (this.state.walk) this.playAnimation(animationMap.walk);
    else this.playAnimation(animationMap.idle);

    if (this.state.shoot) {
      this.playAnimation(animationMap.shoot, 1);
    } else {
      const track1 = this.spine.state.getTrack(1);
      if (track1 && track1.animation.name === animationMap.shoot.name && track1.isComplete()) {
        this.spine.state.setEmptyAnimation(1, 0.2);
      }
    }

    // Blend aim animation on Track 2 so that the character aims gun / tracks target
    if (!this.isSpawning()) {
      this.playAnimation(animationMap.aim, 2);
    }
  }

  aimAt(targetX, targetY) {
    if (this.isSpawning()) return;

    const crosshairBone = this.spine.skeleton.findBone('crosshair');
    if (crosshairBone) {
      // Convert screen coordinates to spine container local coordinate system
      const localPoint = this.spine.toLocal({ x: targetX, y: targetY });

      // In Spine skeleton space, Y goes up. In Spine 4.2+, programmatic modifications 
      // of local bone transforms are written to the 'pose' object.
      crosshairBone.pose.x = localPoint.x;
      crosshairBone.pose.y = -localPoint.y;

      // Force the skeleton to update its world transform constraints immediately
      this.spine.skeleton.updateWorldTransform();
    }
  }

  getMuzzlePosition() {
    const muzzle = this.spine.skeleton.findBone('muzzle');
    if (muzzle) {
      // In Spine 4.2+, computed world positions of bones are stored inside 'appliedPose.worldX'/'worldY'.
      // The world transform inside Spine-Pixi already incorporates the Y-down mapping.
      const localMuzzle = { x: muzzle.appliedPose.worldX, y: muzzle.appliedPose.worldY };
      // Convert local coordinates to global screen coordinates
      return this.spine.toGlobal(localMuzzle);
    }
    // Fallback if bone not found or loaded yet
    const spineScale = this.spine.scale.x;
    return {
      x: this.view.x + 45 * (spineScale / 0.25) * this.direction,
      y: this.view.y - 90 * (spineScale / 0.25)
    };
  }

  isSpawning() {
    return this.isAnimationPlaying(animationMap.spawn);
  }

  isAnimationPlaying({ name }, trackIndex = 0) {
    // Check if the current animation on main track equals to the queried.
    // Also check if the animation is still ongoing.
    const track = this.spine.state.getTrack(trackIndex);
    return track?.animation.name === name && !track.isComplete();
  }

  // Return the name of the current animation on main track.
  get currentAnimationName() {
    return this.spine.state.getTrack(0)?.animation.name;
  }

  // Return character's facing direction.
  get direction() {
    return this.directionalView.scale.x > 0 ? 1 : -1;
  }

  // Set character's facing direction.
  set direction(value) {
    this.directionalView.scale.x = value;
  }
}
