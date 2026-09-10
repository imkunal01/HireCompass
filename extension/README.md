# HireCompass — 1-Click Job Search Copilot (Chrome & Edge Extension)

The official browser extension for **HireCompass**, designed to turn your browser into an automated job search powerhouse.

---

## Features

1. **⚡ 1-Click Job Import**:
   * Scrapes job title, company, location, salary, remote/hybrid status, and full description from **LinkedIn, Indeed, Greenhouse, Lever, Wellfound, Glassdoor, Workday**, or any career site (via Schema.org JSON-LD).
   * Automatically checks for duplicate applications to prevent accidental re-applications.
   * Saves directly to your HireCompass pipeline in MongoDB.

2. **🎯 Instant Resume Match & Skill Gap Analysis**:
   * Analyzes the active job posting against your HireCompass skills and projects.
   * Displays a live Fit Score (0-100%), matched skills, missing keywords, and strategic application advice.

3. **✉️ LinkedIn Recruiter Outreach & InMail AI**:
   * Detects recruiters and hiring managers on LinkedIn.
   * Generates a personalized 300-character LinkedIn connection request, a high-converting cold InMail, and a follow-up check-in note with 1-click copy.

4. **📋 FormKit Application Auto-Fill & Snippet Drawer**:
   * In-page quick copy palette for full name, email, phone, LinkedIn, GitHub, and portfolio links.
   * Instant search and 1-click copy for your project descriptions, elevator pitches, and custom answers.

5. **⏱️ Day Planner Mini-Widget**:
   * Displays your active focus task from the HireCompass Day Planner.
   * Integrated countdown timer with Play/Pause and task completion without leaving your tab.

6. **🔔 Pipeline Alerts & Radar**:
   * Tracks upcoming interview dates, application deadlines, and overdue follow-up reminders.
   * Icon badge shows pending action count.

---

## 30-Second Installation Guide

1. Open your Chromium browser (**Google Chrome**, **Microsoft Edge**, **Brave**, or **Opera**).
2. In the URL bar, go to:
   * Chrome: `chrome://extensions`
   * Edge: `edge://extensions`
   * Brave: `brave://extensions`
3. Toggle on **"Developer mode"** in the top-right corner.
4. Click the **"Load unpacked"** button in the top-left.
5. In the file picker, select the `extension` folder inside this repository:
   ```
   c:\Users\Kunal\Desktop\Projects\HireCompass\extension
   ```
6. The **HireCompass Copilot** icon will appear in your browser toolbar! Pin it for quick access.

---

## Authentication

* **Automatic Session Sync**: As long as you are logged into HireCompass at `http://localhost:3000` (or your production domain), the extension will automatically detect your login session cookie and connect seamlessly.
* **Manual Token (Optional)**: If you prefer token auth, open HireCompass → **Settings** → **Browser Extension** and copy your Personal Access Token, then paste it in the extension settings gear.

---

## Keyboard Shortcuts

* **`Alt + Shift + H`**: Instantly extract and import the job on the active tab in one keystroke!
