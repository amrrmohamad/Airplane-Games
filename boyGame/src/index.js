import { Application, Assets, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Controller } from './Controller';
import { Scene } from './Scene';
import { Robot } from './Robot';
import { Balloon } from './Balloon';
import robotImage from './robot.png';
import robot2Image from './robot2.png';
import cityBgImage from './city_bg.png';
import { Bullet } from './Bullet';
import { playShootSound, playPopSound, playVictorySound, playErrorSound } from './SoundEffects';
import { GameAPI, BOY_GAME_ID, wordToLetters } from './gameApi';

// Asynchronous IIFE
(async () => {
  // Create a PixiJS application.
  const app = new Application();

  // Initialize the application.
  await app.init({ background: '#1099bb', resizeTo: window });

  // Then adding the application's canvas to the DOM body.
  document.body.appendChild(app.canvas);

  // API Setup - Read URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const urlGameId = urlParams.get('gameId') ? parseInt(urlParams.get('gameId')) : null;
  const urlLessonId = urlParams.get('lessonId') ? parseInt(urlParams.get('lessonId')) : null;
  const tokenParam = urlParams.get('token');
  
  let token = tokenParam || localStorage.getItem('childToken') || sessionStorage.getItem('childToken');
  if (tokenParam) {
    localStorage.setItem('childToken', tokenParam);
  }
  
  let gameAPI = null;
  let sessionId = null;
  let backendWords = [];
  
  if (token) {
    gameAPI = new GameAPI(token);
    try {
      const gameIdToUse = urlGameId || BOY_GAME_ID;
      const data = await gameAPI.getQuestions(gameIdToUse, urlLessonId);
      
      // Transform backend questions to word list format
      backendWords = data.questions.map(q => {
        // Extract letters from options (which may be objects or strings)
        const letters = q.options.map(opt => 
          typeof opt === 'string' ? opt : opt.text
        );
        
        return {
          word: q.question,
          letters: letters,
          id: q.id
        };
      });
      
      console.log('✅ Loaded', backendWords.length, 'words from backend');
    } catch (err) {
      console.error('❌ Failed to load words from backend:', err);
    }
  }

  // Load the assets.
  await Assets.load([
    {
      alias: 'robot',
      src: robotImage,
    },
    {
      alias: 'robot2',
      src: robot2Image,
    },
    {
      alias: 'cityBg',
      src: cityBgImage,
    },
    {
      alias: 'platform',
      src: 'https://pixijs.com/assets/tutorials/spineboy-adventure/platform.png',
    },
  ]);

  // Create a controller that handles keyboard inputs.
  const controller = new Controller();

  // Create a scene that holds the environment.
  const scene = new Scene(app.screen.width, app.screen.height);

  // Create our   
  const player = new Robot();

  // Adjust views' transformation.
  scene.view.y = app.screen.height;
  player.view.x = app.screen.width / 2;
  player.view.y = app.screen.height - scene.floorHeight;
  player.view.scale.set(scene.scale * 0.5);

  // Containers for balloons, bullets, and floating effects
  const balloonContainer = new Container();
  const bulletContainer = new Container();
  const effectContainer = new Container();

  // Add elements in drawing depth order (Scene -> Balloons -> Bullets -> Particles -> Character)
  app.stage.addChild(scene.view);
  app.stage.addChild(balloonContainer);
  app.stage.addChild(bulletContainer);
  app.stage.addChild(effectContainer);
  app.stage.addChild(player.view);

  // Trigger character's spawn animation.
  player.spawn();

  // Game States
  let score = 0;
  let combo = 0;
  let comboTimer = 0;
  const COMBO_WINDOW = 3.5; // Seconds before combo multiplier resets
  let highscore = parseInt(localStorage.getItem('spineboy_highscore') || '0', 10);

  const balloons = [];
  const bullets = [];
  const particles = [];
  const floatingTexts = [];

  let balloonSpawnTimer = 0;
  let shootCooldown = 0;
  const SHOOT_COOLDOWN_MAX = 10;
  let gameStarted = false;
  let gameWon = false;

  // Word Spelling Challenge States (Arabic Words with their individual letters)
  const fallbackWords = [
    { word: "قَلَم", letters: ['ق', 'ل', 'م'] },
    { word: "كِتَاب", letters: ['ك', 'ت', 'ا', 'ب'] },
    { word: "وَلَد", letters: ['و', 'ل', 'د'] },
    { word: "تُفَّاحَة", letters: ['ت', 'ف', 'ا', 'ح', 'ة'] },
    { word: "مَدْرَسَة", letters: ['م', 'د', 'ر', 'س', 'ة'] }
  ];
  
  // Use backend words if available, otherwise fallback
  const wordsList = backendWords.length > 0 ? backendWords : fallbackWords;
  
  let targetWord = '';
  let targetLetters = [];
  let collectedLetters = [];

  // HUD elements references
  const scoreValEl = document.getElementById('score-val');
  const comboValEl = document.getElementById('combo-val');
  const comboPanelEl = document.getElementById('combo-panel');
  const highscoreValEl = document.getElementById('highscore-val');
  const tutorialOverlayEl = document.getElementById('tutorial-overlay');
  const winOverlayEl = document.getElementById('win-overlay');
  const completedWordEl = document.getElementById('completed-word');
  const finalScoreValEl = document.getElementById('final-score-val');

  // Initialize word target
  const initWordTarget = () => {
    const wordObj = wordsList[Math.floor(Math.random() * wordsList.length)];
    targetWord = wordObj.word;
    targetLetters = wordObj.letters;
    collectedLetters = new Array(targetLetters.length).fill(false);

    const slotsContainer = document.getElementById('word-slots');
    if (slotsContainer) {
      slotsContainer.innerHTML = '';
      for (let i = 0; i < targetLetters.length; i++) {
        const slot = document.createElement('div');
        slot.className = 'letter-slot';
        slot.id = `slot-${i}`;
        slot.textContent = targetLetters[i];
        slotsContainer.appendChild(slot);
      }
    }
  };

  const updateHUD = () => {
    if (scoreValEl) scoreValEl.textContent = String(score).padStart(4, '0');
    if (highscoreValEl) highscoreValEl.textContent = String(highscore).padStart(4, '0');
    if (comboValEl) comboValEl.textContent = `x${combo}`;
    if (comboPanelEl) {
      if (combo > 1) {
        comboPanelEl.style.opacity = '1';
        comboPanelEl.style.transform = 'scale(1.05)';
      } else {
        comboPanelEl.style.opacity = '0';
        comboPanelEl.style.transform = 'scale(0.8)';
      }
    }

    // Update letter slot classes
    for (let i = 0; i < targetLetters.length; i++) {
      const slot = document.getElementById(`slot-${i}`);
      if (slot) {
        if (collectedLetters[i]) {
          slot.classList.add('collected');
        } else {
          slot.classList.remove('collected');
        }
      }
    }
  };

  const resetGame = () => {
    score = 0;
    combo = 0;
    comboTimer = 0;
    gameWon = false;
    gameStarted = false;

    // Destroy existing Pixi components
    balloons.forEach(b => b.destroy());
    bullets.forEach(b => b.destroy());
    particles.forEach(p => p.destroy());
    floatingTexts.forEach(t => t.destroy());

    balloons.length = 0;
    bullets.length = 0;
    particles.length = 0;
    floatingTexts.length = 0;

    balloonSpawnTimer = 0;
    shootCooldown = 0;

    // Reset states
    initWordTarget();
    updateHUD();

    // Reset HTML layouts
    if (winOverlayEl) winOverlayEl.classList.add('hidden');
    if (tutorialOverlayEl) tutorialOverlayEl.classList.remove('hidden');

    // Trigger character spawn
    player.spawn();
  };

  const spawnExplosion = (x, y, color) => {
    const count = 10 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const p = new Graphics();
      const radius = 2.5 + Math.random() * 4;
      p.circle(0, 0, radius);
      p.fill({ color });
      p.x = x;
      p.y = y;

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 1.5; // upwards bias
      p.alpha = 1;

      effectContainer.addChild(p);
      particles.push(p);
    }
  };

  // Initializedisplays
  initWordTarget();
  updateHUD();

  // Animate the scene and the character based on the controller's input.
  app.ticker.add(() => {
    // If the game is completed, freeze loop and check for restart prompts
    if (gameWon) {
      if (controller.keys.shoot.pressed || controller.keys.up.pressed) {
        resetGame();
      }
      return;
    }

    // Ignore the update loops while the character is doing the spawn animation.
    if (player.isSpawning()) {
      player.update();
      return;
    }

    // Start game upon any player interaction
    if (!gameStarted && (
      controller.keys.left.pressed ||
      controller.keys.right.pressed ||
      controller.keys.up.pressed ||
      controller.keys.shoot.pressed
    )) {
      gameStarted = true;
      
      // Start backend session
      if (gameAPI && !sessionId) {
        const gameIdToUse = urlGameId || BOY_GAME_ID;
        gameAPI.startSession(gameIdToUse, urlLessonId).then(session => {
          sessionId = session.id;
          console.log('✅ Game session started:', sessionId);
        }).catch(err => {
          console.error('❌ Failed to start session:', err);
        });
      }
      
      if (tutorialOverlayEl) {
        tutorialOverlayEl.classList.add('hidden');
      }
    }

    // Update character's state based on the controller's input.
    player.state.walk = controller.keys.left.pressed || controller.keys.right.pressed;
    if (player.state.run && player.state.walk) player.state.run = true;
    else player.state.run = controller.keys.left.doubleTap || controller.keys.right.doubleTap;
    player.state.hover = controller.keys.down.pressed;
    if (controller.keys.left.pressed) player.direction = -1;
    else if (controller.keys.right.pressed) player.direction = 1;
    player.state.jump = controller.keys.up.pressed;
    player.state.shoot = controller.keys.shoot.pressed;

    // Update character's animation based on the latest state.
    player.update();

    // Dynamically update aiming targets (either tracking the pointer or aiming straight ahead)
    if (controller.lastShootType === 'pointer') {
      player.aimAt(controller.pointer.x, controller.pointer.y);
    } else {
      const targetX = player.view.x + 300 * player.direction;
      const targetY = player.view.y - 90 * (scene.scale * 0.32 / 0.25);
      player.aimAt(targetX, targetY);
    }

    // Determine the scene's horizontal scrolling speed based on the character's state.
    let speed = 1.25;
    if (player.state.hover) speed = 7.5;
    else if (player.state.run) speed = 3.75;

    // Shift the scene's position based on the character's facing direction, if in a movement state.
    let scrollX = 0;
    if (player.state.walk) {
      scrollX = speed * scene.scale * player.direction;
      scene.positionX -= scrollX;
    }

    // Handle shooting and rate-of-fire cooldowns
    if (player.state.shoot) {
      if (shootCooldown <= 0) {
        playShootSound();

        // Instantly face the target coordinates when shooting via mouse click
        if (controller.lastShootType === 'pointer') {
          if (controller.pointer.x < player.view.x) {
            player.direction = -1;
          } else {
            player.direction = 1;
          }
          // Update aiming immediately for correct initial bullet spawn orientation
          player.aimAt(controller.pointer.x, controller.pointer.y);
          player.update();
        }

        // Get accurate muzzle coordinates dynamically from the skeleton's muzzle bone
        const muzzlePos = player.getMuzzlePosition();
        const gunX = muzzlePos.x;
        const gunY = muzzlePos.y;

        // Spawn muzzle flash sparks!
        const sparkCount = 8;
        for (let j = 0; j < sparkCount; j++) {
          const p = new Graphics();
          const radius = 1 + Math.random() * 2;
          p.circle(0, 0, radius);
          // Spark color: 80% cyan, 20% white
          const color = Math.random() < 0.8 ? 0x00ffff : 0xffffff;
          p.fill({ color });
          p.x = gunX;
          p.y = gunY;

          // Project sparks outwards in the direction of fire
          let baseAngle = player.direction === 1 ? 0 : Math.PI;
          if (controller.lastShootType === 'pointer') {
            const dx = controller.pointer.x - gunX;
            const dy = controller.pointer.y - gunY;
            baseAngle = Math.atan2(dy, dx);
          }
          const sparkAngle = baseAngle + (Math.random() - 0.5) * 0.8;
          const speed = 2 + Math.random() * 5;
          p.vx = Math.cos(sparkAngle) * speed;
          p.vy = Math.sin(sparkAngle) * speed - 1.0;
          p.alpha = 1.0;

          effectContainer.addChild(p);
          particles.push(p);
        }

        let angle = 0;
        if (controller.lastShootType === 'pointer') {
          const dx = controller.pointer.x - gunX;
          const dy = controller.pointer.y - gunY;
          angle = Math.atan2(dy, dx);
        } else {
          // Shoot horizontally in front of the character when keyboard triggers
          angle = player.direction === 1 ? 0 : Math.PI;
        }

        const bullet = new Bullet(gunX, gunY, angle);
        bulletContainer.addChild(bullet.view);
        bullets.push(bullet);

        shootCooldown = SHOOT_COOLDOWN_MAX;
      }
    }

    if (shootCooldown > 0) {
      shootCooldown -= app.ticker.deltaTime;
    }

    // Balloon Spawning
    balloonSpawnTimer -= app.ticker.deltaTime;
    if (balloonSpawnTimer <= 0) {
      const rand = Math.random();
      let type = 'normal';
      if (rand < 0.25) type = 'small';
      else if (rand < 0.45) type = 'large';
      else if (rand < 0.50) type = 'special';

      // Decide which letter to spawn inside the balloon
      let letterToSpawn = 'أ';
      const nextNeededIndex = collectedLetters.findIndex(c => !c);

      // 60% chance to spawn the next needed letter, 40% chance for a random Arabic letter
      if (nextNeededIndex !== -1 && Math.random() < 0.6) {
        letterToSpawn = targetLetters[nextNeededIndex];
      } else {
        const alphabet = 'أبتثجحخدذرزسشصضطظعغفقكلمنهوي';
        letterToSpawn = alphabet[Math.floor(Math.random() * alphabet.length)];
      }

      const x = 50 + Math.random() * (app.screen.width - 100);
      const y = app.screen.height + 60;
      const balloon = new Balloon(x, y, type, letterToSpawn);
      balloonContainer.addChild(balloon.view);
      balloons.push(balloon);

      // Randomize spawn intervals
      balloonSpawnTimer = 35 + Math.random() * 45;
    }

    // Update Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      bullet.update(app.ticker, scrollX);
      if (!bullet.active) {
        bullet.destroy();
        bullets.splice(i, 1);
      }
    }

    // Update Balloons
    for (let i = balloons.length - 1; i >= 0; i--) {
      const balloon = balloons[i];
      balloon.update(app.ticker, scrollX);
      if (!balloon.active) {
        // Reset combo if player lets a balloon float off-screen
        if (balloon.y < 0) {
          combo = 0;
          updateHUD();
        }
        balloon.destroy();
        balloons.splice(i, 1);
      }
    }

    // Update Explosion Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * app.ticker.deltaTime;
      p.y += p.vy * app.ticker.deltaTime;
      p.vy += 0.12 * app.ticker.deltaTime; // gravity force
      p.alpha -= 0.025 * app.ticker.deltaTime; // fade rate
      p.x -= scrollX;
      if (p.alpha <= 0) {
        p.destroy();
        particles.splice(i, 1);
      }
    }

    // Update Score Floating Texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const t = floatingTexts[i];
      t.y -= 1.2 * app.ticker.deltaTime; // rise up speed
      t.alpha -= 0.02 * app.ticker.deltaTime;
      t.x -= scrollX;
      if (t.alpha <= 0) {
        t.destroy();
        floatingTexts.splice(i, 1);
      }
    }

    // Update Combo Decay Timer
    if (combo > 0) {
      comboTimer -= (app.ticker.deltaTime / 60);
      if (comboTimer <= 0) {
        combo = 0;
        updateHUD();
      }
    }

    // Collision Detection: Laser Bullets vs Floating Balloons
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      if (!bullet.active) continue;

      for (let j = balloons.length - 1; j >= 0; j--) {
        const balloon = balloons[j];
        if (!balloon.active) continue;

        // Circle-to-Circle Collision Check
        const distSq = (bullet.x - balloon.x) ** 2 + (bullet.y - balloon.y) ** 2;
        const minDist = bullet.radius + balloon.radius;
        if (distSq < minDist ** 2) {
          // Deactivate entities
          bullet.active = false;
          balloon.active = false;

          // Process letter collection (must be in sequential order)
          let letterCollected = false;
          const nextNeededIndex = collectedLetters.findIndex(c => !c);
          if (nextNeededIndex !== -1 && targetLetters[nextNeededIndex] === balloon.letter) {
            collectedLetters[nextNeededIndex] = true;
            letterCollected = true;
          }

          let scoreTextText = "";
          let scoreTextColor = "";

          if (letterCollected) {
            // Sound pop
            playPopSound();

            // Increment combo score
            combo++;
            comboTimer = COMBO_WINDOW;
            const earned = balloon.points * combo;
            score += earned;
            
            scoreTextText = `+${earned} (${balloon.letter})`;
            scoreTextColor = balloon.scoreColor;
          } else {
            // Mistake penalty!
            playErrorSound();

            // Reset combo
            combo = 0;
            
            // Deduct 1 point (never below 0)
            score = Math.max(0, score - 1);
            
            scoreTextText = `-1 (${balloon.letter})`;
            scoreTextColor = "#ff3333"; // Red indicator
          }

          if (score > highscore) {
            highscore = score;
            localStorage.setItem('spineboy_highscore', highscore);
          }

          updateHUD();

          // Spawn particle explosion
          spawnExplosion(balloon.x, balloon.y, balloon.color);

          // Spawn floating score/error display text
          const scoreStyle = new TextStyle({
            fontFamily: 'Cairo',
            fontSize: 20,
            fontWeight: 'bold',
            fill: scoreTextColor,
            stroke: { color: 0x121621, width: 4 }
          });
          const ft = new Text({ text: scoreTextText, style: scoreStyle });
          ft.x = balloon.x;
          ft.y = balloon.y - balloon.radius;
          ft.anchor.set(0.5);
          effectContainer.addChild(ft);
          floatingTexts.push(ft);

          // Check if game won (all target word letters collected)
          const allCollected = collectedLetters.every(c => c);
          if (allCollected) {
            gameWon = true;
            playVictorySound();
            
            // Complete backend session
            if (gameAPI && sessionId) {
              gameAPI.completeSession(sessionId).then(result => {
                console.log('✅ Session completed:', result);
              }).catch(err => {
                console.error('❌ Failed to complete session:', err);
              });
            }

            if (winOverlayEl) {
              winOverlayEl.classList.remove('hidden');
            }
            if (completedWordEl) {
              completedWordEl.textContent = targetWord;
            }
            if (finalScoreValEl) {
              finalScoreValEl.textContent = String(score).padStart(4, '0');
            }
          }

          // Clean up models immediately
          bullet.destroy();
          bullets.splice(i, 1);
          balloon.destroy();
          balloons.splice(j, 1);

          break; // break loop for this bullet since it exploded
        }
      }
    }
  });
})();
