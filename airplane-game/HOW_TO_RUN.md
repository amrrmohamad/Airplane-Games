# How to Run Airplane Game

## API Endpoint for Questions

**Get Questions:**
```
GET https://learning-platform-1euu.onrender.com/api/v1/student-games/8/questions
Authorization: Bearer <child_token>
```

**Example using curl:**
```bash
# 1. Login as child
curl -X POST https://learning-platform-1euu.onrender.com/api/v1/auth/child-login \
  -H "Content-Type: application/json" \
  -d '{"username":"eee","password":"Aa1234567890#"}'

# 2. Get questions (use token from step 1)
curl -X GET https://learning-platform-1euu.onrender.com/api/v1/student-games/8/questions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Run the Game Locally

```bash
cd "Plan code Games/airplane-game"

# Install dependencies (if needed)
npm install

# Start development server
npm run dev
```

The game will open at: **http://localhost:5173** (or similar)

## How to Play

1. Open the game in browser
2. You'll see a welcome screen
3. Click "ابدأ المغامرة الآن!" (Start Adventure)
4. The game will:
   - Fetch questions from backend API automatically
   - Show questions for child's current lesson
   - Track session and submit answers to backend
   - Calculate rewards (stars, coins, experience)

## Test Credentials

**Child Username:** eee  
**Password:** Aa1234567890#

## Game Info

**Game ID:** 8  
**Game Type:** AIRPLANE_GAME  
**Questions:** 10 questions for Lesson 1  

## API Flow

1. **Login** → Get authentication token
2. **Get Questions** → `GET /student-games/8/questions`
3. **Start Session** → `POST /student-games/8/sessions`
4. **Submit Answers** → `POST /student-games/sessions/:sessionId/submit-answers`
5. **Complete Session** → `POST /student-games/sessions/:sessionId/complete`

The game handles all of this automatically when you play!
