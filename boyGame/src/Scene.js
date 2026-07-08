import { Container, Texture, TilingSprite } from 'pixi.js';
import cityBgImage from './city_bg.png';

// Helper function to programmatically blend the left and right edges of an HTMLImageElement
function makeSeamless(img, overlapPercent = 0.15) {
  const canvas = document.createElement('canvas');
  const w = img.width;
  const h = img.height;
  const overlap = Math.floor(w * overlapPercent);
  const newW = w - overlap;

  canvas.width = newW;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Draw the main image shifted (cropped on the right)
  ctx.drawImage(img, 0, 0, newW, h, 0, 0, newW, h);

  // Create temporary canvas to hold the blended left-edge overlap
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = overlap;
  tempCanvas.height = h;
  const tempCtx = tempCanvas.getContext('2d');

  // 1. Draw leftmost overlap of the original image
  tempCtx.drawImage(img, 0, 0, overlap, h, 0, 0, overlap, h);
  // Apply gradient to fade out from left to right
  tempCtx.globalCompositeOperation = 'destination-out';
  const gradOut = tempCtx.createLinearGradient(0, 0, overlap, 0);
  gradOut.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradOut.addColorStop(1, 'rgba(0, 0, 0, 1)');
  tempCtx.fillStyle = gradOut;
  tempCtx.fillRect(0, 0, overlap, h);

  // Draw this onto the right edge of our main canvas
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(tempCanvas, newW - overlap, 0);

  // 2. Draw rightmost overlap of the original image (which was cropped out)
  tempCtx.globalCompositeOperation = 'source-over';
  tempCtx.clearRect(0, 0, overlap, h);
  tempCtx.drawImage(img, w - overlap, 0, overlap, h, 0, 0, overlap, h);
  // Apply gradient to fade out from right to left (fade in from left to right)
  tempCtx.globalCompositeOperation = 'destination-out';
  const gradIn = tempCtx.createLinearGradient(0, 0, overlap, 0);
  gradIn.addColorStop(0, 'rgba(0, 0, 0, 1)');
  gradIn.addColorStop(1, 'rgba(0, 0, 0, 0)');
  tempCtx.fillStyle = gradIn;
  tempCtx.fillRect(0, 0, overlap, h);

  // Draw this onto the left edge of our main canvas
  ctx.drawImage(tempCanvas, 0, 0);

  return Texture.from(canvas);
}

// Class for handling the environment.
export class Scene {
  constructor(width, height) {
    // Create a main view that holds all layers.
    this.view = new Container();

    const platformTexture = Texture.from('platform');

    // Calculate the ideal platform height depending on the passed-in screen height.
    const maxPlatformHeight = platformTexture.height;
    const platformHeight = Math.min(maxPlatformHeight, height * 0.4);

    // Calculate the scale to be apply to all tiling textures for consistency.
    const scale = (this.scale = platformHeight / maxPlatformHeight);

    // Create the background tiling sprite with a temporary empty texture
    this.background = new TilingSprite({
      texture: Texture.EMPTY,
      width,
      height,
      anchor: { x: 0, y: 1 },
      applyAnchorToTexture: true,
    });

    // Create the platform tiling sprite
    this.platform = new TilingSprite({
      texture: platformTexture,
      width,
      height: platformHeight,
      tileScale: { x: scale, y: scale },
      anchor: { x: 0, y: 1 },
      applyAnchorToTexture: true,
    });

    // Calculate the floor height for external referencing.
    this.floorHeight = platformHeight * 0.43;

    // Position the backdrop layers.
    this.background.y = 0; // Entire screen height since it fills it completely

    // Add all layers to the main view.
    this.view.addChild(this.background, this.platform);

    // Load the background image asynchronously using native HTMLImageElement
    const img = new Image();
    img.src = cityBgImage;
    img.onload = () => {
      const seamlessTexture = makeSeamless(img);
      const bgScale = height / seamlessTexture.height;
      this.background.texture = seamlessTexture;
      this.background.tileScale.set(bgScale, bgScale);
    };
  }

  // Use the platform's horizontal position as the key position for the scene.
  get positionX() {
    return this.platform.tilePosition.x;
  }

  // Set the horizontal position of the platform layer while applying parallax scrolling to the backdrop layers.
  set positionX(value) {
    this.background.tilePosition.x = value * 0.15; // Slow parallax scroll for the city skyline
    this.platform.tilePosition.x = value;
  }
}
