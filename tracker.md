TrackAsap - 75 Day Goal Tracking Application
A full-stack personal analytics dashboard to track your 75-day journey for competitive programming, internship preparation, and fitness goals.

Tech Stack Tailwind Node.js MongoDB

🎯 Features
Core Tracking
Daily Tracker - Log daily progress with checkboxes for each goal
LeetCode - Contest participation & problems solved
CodeChef - Daily problems & contest tracking
Codeforces - Problems solved & rating updates
Gym - Workout completion & type tracking
Diet - Clean diet compliance & macro tracking
Internship Prep - Study hours logging
📝 Problem Tracking (NEW!)
Save Solutions - Store problem title, link, code, and notes
Monaco Code Editor - View saved code with syntax highlighting
Copy Code - One-click copy functionality
Multi-platform - Track LeetCode, CodeChef, Codeforces, GFG, HackerRank
Tags & Difficulty - Organize problems by tags and difficulty
Time Tracking - Log time spent on each problem
📋 Custom Sheets & Roadmaps (NEW!)
Pre-built Templates - DSA, CP, OS, CN, OOPS, Development
Topic-based Progress - Track progress by topics
Custom Sheets - Create your own learning roadmap
Visual Progress - See completion percentage per topic
Link Problems to Sheets - Organize problems by sheet/topic
🔥 Streak Animation (NEW!)
Confetti Celebration - Animated celebration on completing daily goals
Streak Counter - Visual streak display with fire animation
Progress Ring - See your 75-day progress
Motivational Messages - Dynamic messages based on streak length
Analytics & Visualization
Dashboard - Overview with key stats & progress
Problems Trend - Line chart showing cumulative problems
Platform Distribution - Bar chart comparing platforms
Difficulty Breakdown - Pie chart for problem difficulty
Consistency Heatmap - GitHub-style activity visualization
Codeforces Rating - Rating progression graph
Weight Progress - Weight trend with target line
Physique Tracker
Weekly weight logging
Body fat percentage tracking
Progress visualization
Weekly average calculations
Goal progress percentage
Authentication
JWT-based authentication
Protected routes
Persistent login state
Profile management with logout
UI Design
🌙 Dark theme
✨ Glassmorphism cards
💚 Neon green accents
🎬 Smooth Framer Motion animations
📱 Fully responsive layout
📁 Folder Structure
TrackAsap/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── auth.controller.js    # Auth logic
│   │   │   ├── dailyLog.controller.js # Daily logs CRUD
│   │   │   ├── physique.controller.js # Weight tracking
│   │   │   ├── analytics.controller.js # Dashboard data
│   │   │   ├── problem.controller.js  # Problem tracking (NEW)
│   │   │   └── sheet.controller.js    # Sheets/Roadmaps (NEW)
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js    # JWT verification
│   │   │   ├── error.middleware.js   # Error handling
│   │   │   └── validate.middleware.js # Input validation
│   │   ├── models/
│   │   │   ├── User.model.js         # User schema
│   │   │   ├── DailyLog.model.js     # Daily log schema
│   │   │   ├── PhysiqueLog.model.js  # Weight log schema
│   │   │   ├── Problem.model.js      # Problem schema (NEW)
│   │   │   └── Sheet.model.js        # Sheet/Roadmap schema (NEW)
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── dailyLog.routes.js
│   │   │   ├── physique.routes.js
│   │   │   ├── analytics.routes.js
│   │   │   ├── problem.routes.js     # (NEW)
│   │   │   └── sheet.routes.js       # (NEW)
│   │   └── server.js                 # Express app entry
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Layout.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── Header.jsx
│   │   │   ├── ui/
│   │   │   │   ├── GlassCard.jsx
│   │   │   │   ├── StatCard.jsx
│   │   │   │   ├── ProgressRing.jsx
│   │   │   │   ├── Checkbox.jsx
│   │   │   │   ├── NumberInput.jsx
│   │   │   │   ├── Select.jsx
│   │   │   │   └── LoadingSpinner.jsx
│   │   │   ├── ProblemModal.jsx      # Problem input form (NEW)
│   │   │   ├── CodeViewer.jsx        # Monaco editor view (NEW)
│   │   │   └── StreakAnimation.jsx   # Streak celebration (NEW)
│   │   ├── lib/
│   │   │   └── api.js                # Axios instance
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DailyTracker.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── PhysiqueTracker.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Sheets.jsx            # Sheets/Roadmaps page (NEW)
│   │   │   └── Problems.jsx          # Problems list page (NEW)
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── dailyLogService.js
│   │   │   ├── physiqueService.js
│   │   │   ├── analyticsService.js
│   │   │   ├── problemService.js     # (NEW)
│   │   │   └── sheetService.js       # (NEW)
│   │   ├── store/
│   │   │   ├── authStore.js          # Zustand auth state
│   │   │   ├── dailyLogStore.js      # Daily logs state
│   │   │   ├── analyticsStore.js     # Analytics data
│   │   │   ├── physiqueStore.js      # Weight tracking
│   │   │   ├── problemStore.js       # Problems state (NEW)
│   │   │   └── sheetStore.js         # Sheets state (NEW)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css                 # Tailwind + custom styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
🚀 Quick Start
Prerequisites
Node.js 18+
MongoDB (local or Atlas)
npm or yarn
Backend Setup
cd backend
npm install

# Create .env file
cp .env.example .env

# Edit .env with your values:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/trackasap
# JWT_SECRET=your_super_secret_key
# JWT_EXPIRE=30d

# Start development server
npm run dev
Frontend Setup
cd frontend
npm install

# Create .env file (optional for custom API URL)
cp .env.example .env

# Start development server
npm run dev
Visit http://localhost:3000 to use the application.

📊 Database Schema
User Model
{
  name: String,
  email: String (unique),
  password: String (hashed),
  startDate: Date,           // 75-day challenge start
  targetWeight: Number,
  codeforcesHandle: String,
  codechefHandle: String,
  leetcodeHandle: String,
  timestamps: true
}
DailyLog Model
{
  user: ObjectId,
  date: Date,
  dayNumber: Number (1-75),
  leetcode: {
    contestParticipated: Boolean,
    problemsSolved: Number,
    problemDifficulty: enum ['easy', 'medium', 'hard', 'none']
  },
  codechef: {
    dailyProblem: Boolean,
    contestParticipated: Boolean,
    problemsSolved: Number
  },
  codeforces: {
    problemsSolved: Number,
    contestParticipated: Boolean,
    rating: Number
  },
  gym: {
    completed: Boolean,
    workoutType: enum ['push', 'pull', 'legs', 'cardio', 'rest', 'other', 'none'],
    duration: Number
  },
  diet: {
    cleanDiet: Boolean,
    calories: Number,
    protein: Number,
    notes: String
  },
  internshipPrep: {
    completed: Boolean,
    hoursSpent: Number,
    topics: [String]
  },
  notes: String,
  timestamps: true
}
PhysiqueLog Model
{
  user: ObjectId,
  date: Date,
  weight: Number,
  bodyFat: Number,
  weekNumber: Number (1-11),
  measurements: {
    chest: Number,
    waist: Number,
    hips: Number,
    arms: Number,
    thighs: Number
  },
  notes: String,
  timestamps: true
}
🔌 API Endpoints
Authentication
Method	Endpoint	Description
POST	/api/auth/register	Register user
POST	/api/auth/login	Login user
GET	/api/auth/me	Get current user
PUT	/api/auth/profile	Update profile
Daily Logs
Method	Endpoint	Description
GET	/api/daily-logs	Get all logs
POST	/api/daily-logs	Create/Update log
GET	/api/daily-logs/:date	Get log by date
DELETE	/api/daily-logs/:date	Delete log
GET	/api/daily-logs/streak	Get streak info
GET	/api/daily-logs/weekly-summary	Get weekly stats
Physique
Method	Endpoint	Description
GET	/api/physique	Get all weight logs
POST	/api/physique	Add weight log
GET	/api/physique/progress	Get progress summary
DELETE	/api/physique/:id	Delete weight log
Analytics
Method	Endpoint	Description
GET	/api/analytics/dashboard	Dashboard overview
GET	/api/analytics/problems-trend	Problems over time
GET	/api/analytics/platform-distribution	Platform breakdown
GET	/api/analytics/difficulty-breakdown	Difficulty stats
GET	/api/analytics/heatmap	Activity heatmap
GET	/api/analytics/codeforces-rating	CF rating history
GET	/api/analytics/weight-progress	Weight chart data
Problems (NEW!)
Method	Endpoint	Description
GET	/api/problems	Get all problems
POST	/api/problems	Create problem
GET	/api/problems/:id	Get problem details
PUT	/api/problems/:id	Update problem
DELETE	/api/problems/:id	Delete problem
GET	/api/problems/by-date/:date	Get problems by date
GET	/api/problems/stats	Get problem statistics
Sheets/Roadmaps (NEW!)
Method	Endpoint	Description
GET	/api/sheets	Get all sheets
POST	/api/sheets	Create sheet
GET	/api/sheets/templates	Get available templates
GET	/api/sheets/:id	Get sheet with problems
PUT	/api/sheets/:id	Update sheet
DELETE	/api/sheets/:id	Delete sheet
POST	/api/sheets/:id/topics	Add topic to sheet
PUT	/api/sheets/:id/topics/:topicName	Update topic progress
🔥 Streak Calculation Logic
// Streak is calculated based on completion score >= 60%
// A day is "active" if user completes at least 3/5 of:
// 1. LeetCode (solved problems or participated)
// 2. CodeChef (daily problem or contest)
// 3. Codeforces (solved problems or contest)
// 4. Gym (workout completed)
// 5. Diet (clean diet maintained)

const calculateCompletionScore = (log) => {
  let score = 0;
  const totalChecks = 5;

  if (log.leetcode.problemsSolved > 0 || log.leetcode.contestParticipated) score++;
  if (log.codechef.dailyProblem || log.codechef.contestParticipated) score++;
  if (log.codeforces.problemsSolved > 0 || log.codeforces.contestParticipated) score++;
  if (log.gym.completed) score++;
  if (log.diet.cleanDiet) score++;

  return Math.round((score / totalChecks) * 100);
};

// Current streak: Count consecutive days from today backwards
// where each day has completionScore >= 60%

// Longest streak: Maximum consecutive active days in all logs
🎨 State Management (Zustand)
// Auth Store
const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: async (credentials) => { ... },
  logout: () => { ... },
  updateUser: async (data) => { ... },
}));

// Daily Log Store
const useDailyLogStore = create((set, get) => ({
  currentLog: null,
  selectedDate: today,
  streak: { currentStreak: 0, longestStreak: 0 },
  fetchLogByDate: async (date) => { ... },
  saveLog: async (data) => { ... },
  updateCurrentLog: (field, value) => { ... },
  fetchStreak: async () => { ... },
}));

// Analytics Store
const useAnalyticsStore = create((set) => ({
  dashboard: null,
  problemsTrend: [],
  platformDistribution: [],
  fetchAll: async () => { ... },
}));
🌐 Deployment
Backend (Render/Railway/Vercel)
Set environment variables
Build command: npm install
Start command: npm start
Frontend (Vercel/Netlify)
Build command: npm run build
Output directory: dist
Set VITE_API_URL environment variable
Environment Variables
Backend:

PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_production_secret
JWT_EXPIRE=30d
NODE_ENV=production
Frontend:

VITE_API_URL=https://your-api-url.com/api
📝 License
MIT License - feel free to use this for your own 75-day challenge!

Built with 💚 for the grind. Stay consistent, track everything, achieve your goals!




also i want that you make a complete new section for  traking all my progress of dsa and all
[tracker.md](file;file:///c%3A/Users/Kunal/Desktop/Projects/HireCompass/tracker.md) 
here i have given context of the features i want in that perticular section 