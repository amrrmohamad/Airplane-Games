import React from 'react';

interface IllustrationProps {
  id: string;
  className?: string;
}

export const ItemIllustration: React.FC<IllustrationProps> = ({ id, className = "w-full h-full" }) => {
  switch (id) {
    case 'apple':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="appleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff4d6d" />
              <stop offset="60%" stopColor="#ff002b" />
              <stop offset="100%" stopColor="#b7094c" />
            </linearGradient>
            <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7ae582" />
              <stop offset="100%" stopColor="#25a244" />
            </linearGradient>
          </defs>
          {/* Stem */}
          <path d="M50 35 C48 20, 58 10, 56 8 C54 6, 44 18, 47 30" stroke="#704214" strokeWidth="4" strokeLinecap="round" fill="none" />
          {/* Leaf */}
          <path d="M52 22 C65 15, 75 25, 55 30 C53 25, 48 22, 52 22 Z" fill="url(#leafGrad)" />
          {/* Apple Body */}
          <path d="M50 38 
                   C42 35, 23 37, 20 55 
                   C17 72, 35 90, 50 88 
                   C65 90, 83 72, 80 55 
                   C77 37, 58 35, 50 38 Z" 
                fill="url(#appleGrad)" />
          {/* Highlight */}
          <ellipse cx="38" cy="50" rx="6" ry="10" fill="#ffffff" opacity="0.3" transform="rotate(-15 38 50)" />
        </svg>
      );

    case 'banana':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="bananaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff3b0" />
              <stop offset="30%" stopColor="#ffea00" />
              <stop offset="80%" stopColor="#ffc300" />
              <stop offset="100%" stopColor="#e29578" />
            </linearGradient>
          </defs>
          {/* Background shadow glow */}
          <path d="M22 25 C35 25, 75 42, 78 78 C70 78, 40 40, 22 25 Z" fill="#eae2b7" opacity="0.2" />
          {/* Banana body */}
          <path d="M22 20 
                   C32 20, 78 35, 80 75 
                   C80 80, 75 80, 70 78 
                   C68 62, 38 35, 20 32
                   C17 31, 18 20, 22 20 Z" 
                fill="url(#bananaGrad)" />
          {/* Top Tip */}
          <path d="M22 20 C20 20, 18 25, 20 32 C21 30, 24 23, 22 20 Z" fill="#606c38" />
          {/* Bottom Tip */}
          <path d="M78 75 C79 78, 77 81, 70 78 C73 77, 76 76, 78 75 Z" fill="#4f5d2f" />
          {/* Banana lines */}
          <path d="M25 28 C45 38, 68 52, 74 76" stroke="#d4a373" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
        </svg>
      );

    case 'cake':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="cakeIce" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffccd5" />
              <stop offset="100%" stopColor="#ffb3c1" />
            </linearGradient>
            <linearGradient id="cakeBase" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f5ebe0" />
              <stop offset="100%" stopColor="#e3d5ca" />
            </linearGradient>
            <linearGradient id="cherryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff0f7b" />
              <stop offset="100%" stopColor="#f857a6" />
            </linearGradient>
          </defs>
          {/* Cake Base Layers */}
          <path d="M15 70 L15 80 C15 85, 85 85, 85 80 L85 70 Z" fill="#d5bdaf" />
          <path d="M15 60 L15 70 C15 75, 85 75, 85 70 L85 60 Z" fill="#e3d5ca" />
          {/* Chocolate/Cream middle layer */}
          <path d="M15 68 C25 70, 75 70, 85 68" stroke="#8338ec" strokeWidth="4" strokeLinecap="round" fill="none" />
          
          {/* Cake Top Frosting */}
          <path d="M15 45 L15 60 C15 66, 85 66, 85 60 L85 45 C85 45, 75 52, 50 48 C25 44, 15 45, 15 45 Z" fill="url(#cakeIce)" />
          
          {/* Cake Top Ellipse */}
          <ellipse cx="50" cy="45" rx="35" ry="10" fill="#fff0f3" />
          
          {/* Cream dollops */}
          <circle cx="28" cy="44" r="4" fill="#ffffff" />
          <circle cx="50" cy="47" r="5" fill="#ffffff" />
          <circle cx="72" cy="44" r="4" fill="#ffffff" />
          
          {/* Cherry */}
          <circle cx="50" cy="33" r="8" fill="url(#cherryGrad)" />
          {/* Cherry stem */}
          <path d="M50 29 C52 18, 62 15, 60 10" stroke="#704214" strokeWidth="2" strokeLinecap="round" fill="none" />
          {/* Cherry highlight */}
          <circle cx="48" cy="31" r="2" fill="#ffffff" />
          
          {/* Sprinkles on Top */}
          <rect x="35" y="42" width="2" height="5" rx="1" fill="#ff70a6" transform="rotate(30 35 42)" />
          <rect x="42" y="44" width="2" height="5" rx="1" fill="#ff9770" transform="rotate(-40 42 44)" />
          <rect x="58" y="45" width="2" height="5" rx="1" fill="#ffd670" transform="rotate(15 58 45)" />
          <rect x="65" y="42" width="2" height="5" rx="1" fill="#e9ff70" transform="rotate(-60 65 42)" />
        </svg>
      );

    case 'car':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="carBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff5e62" />
              <stop offset="100%" stopColor="#ff9966" />
            </linearGradient>
            <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e0f7fa" />
              <stop offset="100%" stopColor="#80deea" />
            </linearGradient>
          </defs>
          {/* Wheels shadow */}
          <rect x="15" y="70" width="70" height="8" rx="4" fill="#cfd8dc" />
          
          {/* Car Body Upper Cabin */}
          <path d="M28 55 C30 35, 70 35, 72 55 Z" fill="url(#glassGrad)" stroke="#37474f" strokeWidth="3" />
          <line x1="50" y1="36" x2="50" y2="55" stroke="#37474f" strokeWidth="2.5" />
          
          {/* Main Car Body */}
          <path d="M12 52 C12 48, 18 48, 22 48 C28 48, 30 50, 70 50 C75 50, 80 48, 85 48 C89 48, 90 52, 88 64 C88 68, 80 68, 76 68 C70 68, 68 68, 32 68 C28 68, 20 68, 15 68 C12 64, 12 56, 12 52 Z" fill="url(#carBody)" stroke="#37474f" strokeWidth="3" />
          
          {/* Lights */}
          <circle cx="16" cy="56" r="4" fill="#ffee58" stroke="#37474f" strokeWidth="1.5" />
          <circle cx="84" cy="56" r="3" fill="#ff7043" stroke="#37474f" strokeWidth="1.5" />
          
          {/* Wheels */}
          <circle cx="28" cy="70" r="10" fill="#37474f" />
          <circle cx="28" cy="70" r="5" fill="#eceff1" />
          
          <circle cx="72" cy="70" r="10" fill="#37474f" />
          <circle cx="72" cy="70" r="5" fill="#eceff1" />
        </svg>
      );

    case 'airplane':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="planeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e9ecef" />
              <stop offset="50%" stopColor="#dee2e6" />
              <stop offset="100%" stopColor="#adb5bd" />
            </linearGradient>
            <linearGradient id="blueAccent" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00b4d8" />
              <stop offset="100%" stopColor="#0077b6" />
            </linearGradient>
          </defs>
          {/* Cloud behind */}
          <path d="M20 70 C20 65, 30 60, 40 65 C45 60, 60 60, 65 67 C75 67, 80 75, 70 80 C60 85, 30 85, 20 70 Z" fill="#e0f2fe" opacity="0.6" />
          
          {/* Tail Fin */}
          <path d="M22 45 L12 25 L24 25 L34 43 Z" fill="url(#blueAccent)" />
          
          {/* Fuselage Body */}
          <path d="M16 48 L80 43 C88 43, 92 48, 88 52 L16 52 Z" fill="url(#planeGrad)" stroke="#495057" strokeWidth="2.5" />
          
          {/* Cabin Windows */}
          <circle cx="48" cy="47" r="1.5" fill="#212529" />
          <circle cx="56" cy="47" r="1.5" fill="#212529" />
          <circle cx="64" cy="47" r="1.5" fill="#212529" />
          <circle cx="72" cy="47" r="1.5" fill="#212529" />
          
          {/* Wing Back */}
          <path d="M42 42 L25 22 L35 22 L55 42 Z" fill="#ced4da" />
          
          {/* Wing Front */}
          <path d="M48 50 L32 75 L45 75 L62 50 Z" fill="url(#blueAccent)" stroke="#03045e" strokeWidth="1.5" />
          
          {/* Cockpit Window */}
          <path d="M80 43 C82 43, 85 45, 84 48 L76 48 Z" fill="#00e5ff" />
        </svg>
      );

    case 'train':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="trainRed" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e63946" />
              <stop offset="100%" stopColor="#9b2226" />
            </linearGradient>
            <linearGradient id="trainBlue" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#457b9d" />
              <stop offset="100%" stopColor="#1d3557" />
            </linearGradient>
          </defs>
          {/* Steam Clouds */}
          <circle cx="35" cy="22" r="6" fill="#f1faee" />
          <circle cx="42" cy="18" r="8" fill="#f1faee" />
          <circle cx="52" cy="15" r="10" fill="#f1faee" />
          
          {/* Train track */}
          <rect x="10" y="80" width="80" height="4" fill="#4a4e69" />
          <line x1="20" y1="80" x2="20" y2="84" stroke="#22223b" strokeWidth="3" />
          <line x1="40" y1="80" x2="40" y2="84" stroke="#22223b" strokeWidth="3" />
          <line x1="60" y1="80" x2="60" y2="84" stroke="#22223b" strokeWidth="3" />
          <line x1="80" y1="80" x2="80" y2="84" stroke="#22223b" strokeWidth="3" />

          {/* Engine Cabin */}
          <rect x="58" y="38" width="24" height="32" rx="2" fill="url(#trainBlue)" stroke="#22223b" strokeWidth="2.5" />
          {/* Cabin Window */}
          <rect x="63" y="43" width="14" height="12" rx="1" fill="#a8dadc" stroke="#22223b" strokeWidth="1.5" />
          {/* Cabin Roof */}
          <path d="M55 38 L85 38 L80 34 L60 34 Z" fill="#1d3557" />

          {/* Boiler Body */}
          <rect x="25" y="48" width="34" height="22" rx="2" fill="url(#trainRed)" stroke="#22223b" strokeWidth="2.5" />
          {/* Front Grill */}
          <path d="M25 48 L18 60 L25 70 Z" fill="#e63946" stroke="#22223b" strokeWidth="2" />
          
          {/* Chimney/Smokestack */}
          <rect x="32" y="34" width="6" height="15" fill="#1d3557" stroke="#22223b" strokeWidth="2" />
          <ellipse cx="35" cy="34" rx="5" ry="2" fill="#e63946" />

          {/* Wheels */}
          <circle cx="35" cy="74" r="8" fill="#22223b" />
          <circle cx="35" cy="74" r="3" fill="#f1faee" />
          
          <circle cx="52" cy="74" r="8" fill="#22223b" />
          <circle cx="52" cy="74" r="3" fill="#f1faee" />
          
          <circle cx="70" cy="74" r="10" fill="#22223b" />
          <circle cx="70" cy="74" r="4" fill="#f1faee" />
          
          {/* Wheel rod */}
          <line x1="35" y1="74" x2="70" y2="74" stroke="#f1faee" strokeWidth="2" />
        </svg>
      );

    case 'cat':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="catOrange" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f7a072" />
              <stop offset="100%" stopColor="#ed5c2b" />
            </linearGradient>
            <linearGradient id="earPink" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffb5a7" />
              <stop offset="100%" stopColor="#fec5bb" />
            </linearGradient>
          </defs>
          {/* Ears */}
          <path d="M22 45 L12 18 L38 32 Z" fill="url(#catOrange)" stroke="#5e3023" strokeWidth="2" />
          <path d="M20 40 L16 22 L32 31 Z" fill="url(#earPink)" />
          
          <path d="M78 45 L88 18 L62 32 Z" fill="url(#catOrange)" stroke="#5e3023" strokeWidth="2" />
          <path d="M80 40 L84 22 L68 31 Z" fill="url(#earPink)" />

          {/* Head */}
          <ellipse cx="50" cy="55" rx="34" ry="26" fill="url(#catOrange)" stroke="#5e3023" strokeWidth="3" />
          
          {/* Snout white background */}
          <ellipse cx="44" cy="65" rx="8" ry="6" fill="#ffffff" />
          <ellipse cx="56" cy="65" rx="8" ry="6" fill="#ffffff" />

          {/* Eyes */}
          <ellipse cx="36" cy="52" rx="4" ry="6" fill="#222222" />
          <circle cx="35" cy="50" r="1.5" fill="#ffffff" />
          
          <ellipse cx="64" cy="52" rx="4" ry="6" fill="#222222" />
          <circle cx="63" cy="50" r="1.5" fill="#ffffff" />
          
          {/* Nose */}
          <polygon points="50,60 46,56 54,56" fill="#ff7096" />
          
          {/* Mouth */}
          <path d="M44 65 Q50 70 50 65 Q50 70 56 65" stroke="#5e3023" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          
          {/* Whiskers */}
          <line x1="18" y1="58" x2="6" y2="56" stroke="#5e3023" strokeWidth="2" strokeLinecap="round" />
          <line x1="18" y1="64" x2="4" y2="65" stroke="#5e3023" strokeWidth="2" strokeLinecap="round" />
          
          <line x1="82" y1="58" x2="94" y2="56" stroke="#5e3023" strokeWidth="2" strokeLinecap="round" />
          <line x1="82" y1="64" x2="96" y2="65" stroke="#5e3023" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'dog':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="dogBrown" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ddb892" />
              <stop offset="100%" stopColor="#b08968" />
            </linearGradient>
            <linearGradient id="dogDark" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7f5539" />
              <stop offset="100%" stopColor="#5c3f30" />
            </linearGradient>
          </defs>
          {/* Ears */}
          <path d="M16 38 C10 38, 12 65, 20 68 C24 64, 25 45, 25 38 Z" fill="url(#dogDark)" stroke="#432818" strokeWidth="2" />
          <path d="M84 38 C90 38, 88 65, 80 68 C76 64, 75 45, 75 38 Z" fill="url(#dogDark)" stroke="#432818" strokeWidth="2" />

          {/* Head */}
          <ellipse cx="50" cy="50" rx="30" ry="24" fill="url(#dogBrown)" stroke="#432818" strokeWidth="3" />

          {/* White Snout patch */}
          <ellipse cx="50" cy="58" rx="14" ry="10" fill="#f8f9fa" stroke="#432818" strokeWidth="1.5" />
          
          {/* Eyes */}
          <circle cx="38" cy="44" r="5" fill="#222222" />
          <circle cx="36" cy="42" r="1.5" fill="#ffffff" />
          
          <circle cx="62" cy="44" r="5" fill="#222222" />
          <circle cx="60" cy="42" r="1.5" fill="#ffffff" />
          
          {/* Nose */}
          <ellipse cx="50" cy="54" rx="6" ry="4" fill="#000000" />
          
          {/* Mouth */}
          <path d="M46 60 Q50 63 50 58 Q50 63 54 60" stroke="#432818" strokeWidth="2" strokeLinecap="round" fill="none" />
          
          {/* Cheeks blush */}
          <circle cx="28" cy="52" r="4" fill="#ff87ab" opacity="0.4" />
          <circle cx="72" cy="52" r="4" fill="#ff87ab" opacity="0.4" />
        </svg>
      );

    case 'rabbit':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="rabbitWhite" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e9ecef" />
            </linearGradient>
            <linearGradient id="innerPink" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffb3c1" />
              <stop offset="100%" stopColor="#ffccd5" />
            </linearGradient>
          </defs>
          {/* Ears */}
          <path d="M28 42 C20 20, 25 4, 34 5 C42 6, 38 25, 36 42 Z" fill="url(#rabbitWhite)" stroke="#6c757d" strokeWidth="2.5" />
          <path d="M30 38 C25 22, 28 10, 33 10 C37 10, 36 22, 34 38 Z" fill="url(#innerPink)" />
          
          <path d="M72 42 C80 20, 75 4, 66 5 C58 6, 62 25, 64 42 Z" fill="url(#rabbitWhite)" stroke="#6c757d" strokeWidth="2.5" />
          <path d="M70 38 C75 22, 72 10, 67 10 C63 10, 64 22, 66 38 Z" fill="url(#innerPink)" />

          {/* Head */}
          <ellipse cx="50" cy="56" rx="28" ry="24" fill="url(#rabbitWhite)" stroke="#6c757d" strokeWidth="3" />
          
          {/* Eyes */}
          <circle cx="38" cy="52" r="4" fill="#e63946" />
          <circle cx="37" cy="50" r="1.2" fill="#ffffff" />
          
          <circle cx="62" cy="52" r="4" fill="#e63946" />
          <circle cx="61" cy="50" r="1.2" fill="#ffffff" />
          
          {/* Nose */}
          <polygon points="50,60 47,57 53,57" fill="#ff70a6" />
          
          {/* Mouth */}
          <path d="M47 64 Q50 67 50 61 Q50 67 53 64" stroke="#6c757d" strokeWidth="2" strokeLinecap="round" fill="none" />
          
          {/* Teeth */}
          <rect x="48.5" y="65" width="3" height="4" fill="#ffffff" stroke="#6c757d" strokeWidth="1" />
          
          {/* Cheeks blush */}
          <circle cx="28" cy="58" r="4" fill="#ffb3c1" opacity="0.6" />
          <circle cx="72" cy="58" r="4" fill="#ffb3c1" opacity="0.6" />
        </svg>
      );

    case 'book':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="bookCover" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4361ee" />
              <stop offset="100%" stopColor="#3a0ca3" />
            </linearGradient>
            <linearGradient id="pageGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f8f9fa" />
              <stop offset="50%" stopColor="#e9ecef" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>
          {/* Book Cover */}
          <path d="M12 28 C12 28, 25 32, 50 28 C75 32, 88 28, 88 28 L88 78 C88 78, 75 82, 50 78 C25 82, 12 78, 12 78 Z" fill="url(#bookCover)" stroke="#2b2d42" strokeWidth="3" />
          
          {/* Pages block thickness */}
          <path d="M14 30 C14 30, 26 34, 50 30 C74 34, 86 30, 86 30 L86 76 C86 76, 74 80, 50 76 C26 80, 14 76, 14 76 Z" fill="#dee2e6" />
          
          {/* Top Pages */}
          <path d="M15 26 C15 26, 26 30, 50 26 C74 30, 85 26, 85 26 L85 72 C85 72, 74 76, 50 72 C26 76, 15 72, 15 72 Z" fill="url(#pageGrad)" stroke="#2b2d42" strokeWidth="1.5" />
          
          {/* Book center spine line */}
          <line x1="50" y1="26" x2="50" y2="72" stroke="#495057" strokeWidth="2" />
          
          {/* Dummy text lines left page */}
          <line x1="22" y1="38" x2="42" y2="38" stroke="#6c757d" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="22" y1="46" x2="38" y2="46" stroke="#6c757d" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="22" y1="54" x2="42" y2="54" stroke="#6c757d" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="22" y1="62" x2="34" y2="62" stroke="#6c757d" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Dummy text lines right page */}
          <line x1="58" y1="38" x2="78" y2="38" stroke="#6c757d" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="58" y1="46" x2="74" y2="46" stroke="#6c757d" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="58" y1="54" x2="78" y2="54" stroke="#6c757d" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="58" y1="62" x2="70" y2="62" stroke="#6c757d" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Ribbon marker */}
          <path d="M50 26 C50 35, 52 75, 54 82 L50 78 L46 82 C48 75, 50 35, 50 26 Z" fill="#e63946" />
        </svg>
      );

    case 'pencil':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="pencilGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffb703" />
              <stop offset="50%" stopColor="#fb8500" />
              <stop offset="100%" stopColor="#ffb703" />
            </linearGradient>
            <linearGradient id="eraserGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff85a1" />
              <stop offset="100%" stopColor="#ffccd5" />
            </linearGradient>
          </defs>
          {/* Shadow */}
          <ellipse cx="50" cy="85" rx="25" ry="4" fill="#ced4da" />
          
          {/* Main Pencil Body (Rotated for a cool look) */}
          <g transform="rotate(45 50 50)">
            {/* Eraser */}
            <rect x="42" y="15" width="16" height="12" rx="2" fill="url(#eraserGrad)" stroke="#495057" strokeWidth="2" />
            {/* Metal Band */}
            <rect x="42" y="27" width="16" height="6" fill="#adb5bd" stroke="#495057" strokeWidth="2" />
            {/* Wood Shaft */}
            <rect x="42" y="33" width="16" height="35" fill="url(#pencilGrad)" stroke="#495057" strokeWidth="2" />
            {/* Pencil tip (sharpened wood) */}
            <polygon points="42,68 58,68 50,82" fill="#e9c46a" stroke="#495057" strokeWidth="2" />
            {/* Lead point */}
            <polygon points="47,77 53,77 50,82" fill="#212529" />
          </g>
        </svg>
      );

    case 'clock':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="clockBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2ec4b6" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          {/* Bells (Left and Right Alarm Bells) */}
          <path d="M22 28 C22 28, 15 15, 28 15 C34 20, 30 28, 30 28 Z" fill="#e63946" stroke="#22223b" strokeWidth="2" />
          <path d="M78 28 C78 28, 85 15, 72 15 C66 20, 70 28, 70 28 Z" fill="#e63946" stroke="#22223b" strokeWidth="2" />
          {/* Bell legs */}
          <line x1="30" y1="74" x2="22" y2="84" stroke="#22223b" strokeWidth="4" strokeLinecap="round" />
          <line x1="70" y1="74" x2="78" y2="84" stroke="#22223b" strokeWidth="4" strokeLinecap="round" />
          <circle cx="22" cy="84" r="3" fill="#22223b" />
          <circle cx="78" cy="84" r="3" fill="#22223b" />

          {/* Alarm hammer */}
          <path d="M50 20 L50 14" stroke="#22223b" strokeWidth="3" />
          <circle cx="50" cy="12" r="3.5" fill="#22223b" />

          {/* Main outer ring */}
          <circle cx="50" cy="52" r="28" fill="url(#clockBody)" stroke="#22223b" strokeWidth="3.5" />
          
          {/* Dial Face */}
          <circle cx="50" cy="52" r="22" fill="#ffffff" stroke="#22223b" strokeWidth="1.5" />
          
          {/* Hour markers */}
          <circle cx="50" cy="34" r="1.5" fill="#22223b" />
          <circle cx="50" cy="70" r="1.5" fill="#22223b" />
          <circle cx="32" cy="52" r="1.5" fill="#22223b" />
          <circle cx="68" cy="52" r="1.5" fill="#22223b" />
          
          {/* Hands */}
          {/* Hour hand */}
          <line x1="50" y1="52" x2="50" y2="42" stroke="#22223b" strokeWidth="3" strokeLinecap="round" />
          {/* Minute hand */}
          <line x1="50" y1="52" x2="62" y2="52" stroke="#e63946" strokeWidth="2" strokeLinecap="round" />
          {/* Center cap */}
          <circle cx="50" cy="52" r="3" fill="#22223b" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="40" fill="#ccc" />
          <text x="50" y="55" fontSize="20" textAnchor="middle" fill="#fff">?</text>
        </svg>
      );
  }
};
