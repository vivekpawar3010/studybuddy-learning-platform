# Week 7 Completion Report — Secure Online Testing Environment

**Date:** February 16, 2026  
**Status:** ✅ **COMPLETE**

---

## 📋 Deliverables Completed

### ✅ 1. Server-Synced Countdown Timer
- **Location:** `frontend/src/hooks/useTestTimer.ts`
- **Features:**
  - Wrote a highly robust timer. Since students can mess with their client clocks, the timer relies on the `started_at` timestamp in the database and ticks down based on absolute UTC differences.
  - Automatically submits the test payload via an effect when `timeRemaining <= 0`, preventing overtime manipulation.

### ✅ 2. Anti-Cheat & Secure Fullscreen Wrapper
- **Location:** `frontend/src/components/tests/SecureWrapper.tsx`
- **Features:**
  - Hooked into the browser's `Fullscreen API` forcing the environment to cover the whole screen during an exam.
  - Integrated `document.addEventListener('visibilitychange')`. If a student switches tabs or minimizes Chrome to look up answers, the app captures it.
  - Generates a harsh warning modal. After 3 tab-switch events, the system forcefully autosubmits the test and reports the anomaly.

### ✅ 3. Network Disconnect Persistence
- **Location:** `frontend/src/app/tests/take/[id]/page.tsx`
- **Features:**
  - Persisting answer arrays locally so if a router dies during a 2-hour exam, the student can refresh and resume exactly where they left off (provided time remains).

---

## 🔧 Additional Work Completed

### ✅ Right-Click & Copy Disabling
- **Status:** Prevented the Context Menu and text-highlight-copying inside the `SecureWrapper` to deter easy copy-pasting of questions to ChatGPT.

---

## 📁 File Structure

```
frontend/
├── src/
│   ├── app/tests/take/
│   │   └── [id]/page.tsx           # ✅ Active student exam view
│   ├── components/tests/
│   │   ├── SecureWrapper.tsx       # ✅ Anti-cheat boundaries
│   │   └── ExamTimer.tsx           # ✅ UI countdown ticker
│   └── hooks/
│       └── useTestTimer.ts         # ✅ UTC clock drift logic
```

---

## 🚀 How to Use

### Verify Features
```bash
# 1. As a student, launch a deployed exam.
# 2. Try hitting ALT-TAB to switch windows; observe the warning.
# 3. Do it three times to trigger the auto-submission sequence.
# 4. Turn off internet, select an answer, turn internet back on; view state sync.
```

---

## 🔒 Security Features
1. **Environment Isolation:** Disables context menu and prevents `copy`/`paste`/`cut` clipboard events inside testing boundaries.
2. **Server-Authored Timings:** Time limit enforcements are resolved in the backend on submission validation; a manipulated frontend timer cannot bypass the server cutoff.

---

## 📊 Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Web APIs | Page Visibility API | - |
| Web APIs | Fullscreen API | - |

---

## ✅ Testing Status

| Test | Status | Evidence |
|------|--------|----------|
| Clock Tampering | ✅ Ready | Modifying Windows OS clock locally does not stop test failure |
| Penalty System | ✅ Ready | Exactly 3 strikes accurately forces submission |

---

## 🐛 Known Limitations
1. Browser compatibility relies on modern spec. Deeply older browsers might ignore the fullscreen enforcement.
2. Cannot stop students from using a secondary separate physical device (like their phone).

---

## 📝 Next Steps (Week 8+)
1. Overhaul community Member Management.
2. Wire up global database search functions.
3. Establish admin kicking and editing controls.

---

## 📚 Documentation Files
1. **WEEK7_COMPLETE.md** - Complete week rundown.

---

## ✨ Summary
Week 7 was challenging because it involved wrestling with native browser APIs. Ensuring an exam is 'secure' in a web client is practically impossible, but we've raised the difficulty threshold significantly with visibility tracking and server-syncing.

**Status: READY FOR WEEK 8 DEVELOPMENT** ✅
