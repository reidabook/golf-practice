# Golf Practice App - PRD

**Created:** January 13, 2026
**Author:** Reid Francis
**Template:** Reid PRD Template

---

# PRD Purpose & Audience

**Primary Goal:** Provide engineering teams with sufficient context to produce a high-level design document for a golf practice training app.

**Audience:** iOS developers (implementation planning), mobile architects (system design), stakeholders (strategic context).

**Principle:** Be concise. Include only what engineering needs to design the solution and what stakeholders need to understand the value proposition.

---

# Problem Alignment

## Problem & Opportunity

Golfers struggle to practice effectively and track improvement because existing practice sessions lack structure, quantifiable metrics, and progress tracking, leading to wasted time and slow skill development.

* Golf practice is often unstructured and inefficient, with players unsure what to practice or how to measure progress
* Current solutions require manual setup, pen-and-paper tracking, or switching between multiple apps for timers, drills, and stats
* Players lack insight into slope and elevation when practicing on greens, making it difficult to create realistic practice conditions and accurate performance data
* This matters to recreational golfers who want to improve faster and make the most of limited practice time
* Evidence: Personal experience with golf practice inefficiencies and lack of integrated practice management tools
* Why now: iOS sensor capabilities (accelerometer, barometer, GPS) make elevation and slope detection feasible; growing market for golf training apps
* Why important: Structured practice with measurable progress is the key differentiator between improving golfers and those who plateau

## High Level Approach

Build an iOS-native golf practice app that guides users through structured practice plans, automates setup using step-counting and device sensors, enables voice-based stat recording, and tracks progress over time with analytics.

Core capabilities:
* Practice plan library with built-in drills (putting, chipping, full swing)
* Guided practice sessions with timers, setup assistance via step-counting, and voice-based stat entry
* Elevation and slope detection using iPhone sensors (barometer for elevation, accelerometer/gyroscope for slope)
* Progress tracking with historical data visualization and improvement trends

What alternatives did we consider?
* Web-based solution: Rejected due to limited sensor access and need for offline functionality during practice
* Wearable-first (Apple Watch): Rejected as primary platform due to screen size constraints for setup guidance; may add as companion app in future
* Manual entry only: Rejected because voice input is critical for hands-free operation during practice

Why this approach?
* iOS-native provides best sensor access, offline capability, and seamless user experience
* Voice input reduces friction during practice when hands are busy
* Device sensors (barometer, accelerometer) enable realistic elevation/slope detection without external hardware

### Narrative

**Scenario 1: Structured Putting Practice**

Sarah arrives at the practice green with 30 minutes to spare. She opens the app and selects "Distance Control Drill." The app instructs her to place tees at 10, 20, and 30 feet from a hole. Using step-counting, the app guides her: "Walk 10 paces forward... stop here, place a tee." Once setup is complete, the app starts a timer and tracks her putts. Sarah says "Made it" or "Missed left" after each putt, and the app records the results hands-free. After 30 minutes, she reviews her stats: 70% make rate at 10 feet, 45% at 20 feet, 20% at 30 feet.

**Scenario 2: Custom Practice Green with Slope Detection**

Mike is at a practice green with multiple flags. He wants to putt to different targets and track his performance on varying slopes. The app helps him "build a course" by selecting Flag 1 (15 paces away), Flag 2 (25 paces away), and Flag 3 (20 paces away uphill). As he walks to each target, the app uses the barometer to detect elevation changes and the accelerometer to measure slope. The app shows "Flag 3: +2 feet elevation, 3° upslope" so Mike can create more accurate stats for uphill putts. After practicing, he can filter his stats by slope and elevation to identify weaknesses.

**Scenario 3: Practice Round with Variety**

Alex wants to mix up her practice instead of repeating the same drill. She creates a "Practice Round" with built-in games: 9 holes of putting to different targets, alternating between distance control, breaking putts, and pressure putts (must make 3 in a row to advance). The app guides her through each "hole," tracks stats for each game type, and provides a summary at the end showing where she excelled and where she needs work.

## Goals

1. **User Engagement:** 80% of users complete at least 3 practice sessions in their first 2 weeks (measure via app analytics)
2. **Practice Efficiency:** Reduce average practice session setup time to <2 minutes (measure via session start timestamps)
3. **Data Accuracy:** Achieve 90%+ accuracy in elevation detection (within ±1 foot) and slope detection (within ±1°) compared to professional-grade tools (measure via validation testing)
4. **Hands-Free Usability:** 70% of users use voice input for stat recording in at least 50% of their sessions (measure via feature usage analytics)
5. **Progress Visibility:** Users can view improvement trends within 5 taps from home screen (measure via UX testing)

Guardrail Metrics:
* App crash rate <0.5% (measure via Crashlytics)
* Voice recognition accuracy >85% in outdoor environments (measure via speech-to-text API performance)
* Battery consumption <10% per 30-minute practice session (measure via iOS battery profiling)

## Out-of-Scope

1. **No integration with external launch monitors or swing analyzers** (e.g., TrackMan, Foresight GC3) - Deferred to v2 pending market validation; v1 focuses on manual practice only
2. **No social features or leaderboards** - Deferred to v2; v1 is single-player focused to reduce complexity and privacy concerns
3. **No integration with golf course GPS or scorekeeping** - Out of scope; app is practice-focused, not on-course play
4. **No Apple Watch standalone mode** - v1 requires iPhone; companion Watch app may be considered for v2
5. **No custom drill creation in v1** - Users can select from built-in drill library only; custom drills deferred to v2
6. **No video recording or swing analysis** - Out of scope; focus is on statistical tracking, not video coaching
7. **No Android version in v1** - iOS-only initially; Android version depends on v1 success
8. **No outdoor/range practice tracking** - v1 focuses on putting and short game on practice greens; full-swing tracking deferred to v2

---

# Solution Alignment

## Key Features

**Plan of record** (in priority order):

1. **Practice Plan Library** - Pre-built putting and short game drills with instructions, setup guidance, and default stat tracking. Must include at least 10 drills at launch (distance control, gate drill, ladder drill, around-the-world, etc.)

2. **Guided Practice Sessions** - Step-by-step session flow: select drill → guided setup with step-counting → timed practice → stat recording → session summary. Must support countdown timers and interval timers.

3. **Step-Counting Setup Assistance** - Use iPhone step-counting (CoreMotion) to guide users in placing tees/markers at specific distances. App provides real-time feedback: "Walk 15 paces forward... 5 more paces... stop here."

4. **Voice-Based Stat Recording** - Hands-free stat entry via voice commands (e.g., "Made it," "Missed left," "Short right"). Must work in outdoor environments with background noise. Uses iOS Speech Recognition framework.

5. **Elevation and Slope Detection** - Use iPhone barometer (altitude changes) and accelerometer/gyroscope (slope angle) to measure green contours. Display elevation differential and slope angle for each practice target.

6. **Custom Practice Green Builder** - Allow users to define a virtual practice course by marking multiple targets (flags/tees) at different distances and elevations. App guides placement and records position data for each target.

7. **Progress Tracking Dashboard** - Historical stats with trends over time (make percentage, distance accuracy, slope performance). Must support filtering by drill type, date range, and green conditions (flat vs. sloped).

8. **Practice Round Games** - Pre-built game formats that add variety to practice (e.g., "Make 3 in a row," "Beat your best score," "Mixed distance challenge"). Tracks stats separately for each game type.

**Future considerations:**

1. **Custom Drill Builder** - Allow users to create and save their own drills. Impacts current architecture: data model must support flexible drill definitions (not hardcoded).

2. **Apple Watch Companion App** - Voice input and basic stat tracking from Watch. Impacts current architecture: API must support Watch requests; design for low-bandwidth sync.

3. **Social Features and Leaderboards** - Compare stats with friends or global leaderboards. Impacts current architecture: data model must include user identity and permissions; backend needed for data sharing.

### Key Flows

**Flow 1: Start a Practice Session (Guided Drill)**

1. User opens app → taps "Start Practice"
2. App displays Practice Plan Library (list of drills with thumbnails and descriptions)
3. User selects a drill (e.g., "Distance Control - 3 Distances")
4. App shows drill details: instructions, required equipment (tees), estimated time
5. User taps "Begin Setup"
6. App enters setup mode: "Walk 10 paces from the hole... 8... 6... 4... 2... Stop. Place a tee here."
7. User places tee, taps "Next Target"
8. Repeat step 6 for each target (20 paces, 30 paces)
9. User taps "Start Practice"
10. App starts timer, displays current target and stat tracker
11. User hits putts and records results via voice: "Made it" → app logs success
12. After timer expires, app shows session summary: total putts, make %, breakdown by distance
13. User taps "Save Session" → data saved to history

**Flow 2: Build Custom Practice Green**

1. User taps "Custom Green" → "New Practice Green"
2. App prompts: "Stand at your starting point and tap 'Set Start'"
3. User taps "Set Start" → app records GPS coordinates and barometer reading (baseline elevation)
4. App prompts: "Walk to your first target and tap 'Add Target'"
5. User walks to flag, taps "Add Target"
6. App calculates: distance via step-counting, elevation via barometer differential, slope via accelerometer (angle from horizontal)
7. App displays: "Target 1: 15 paces, +1.5 feet elevation, 2° upslope"
8. User taps "Add Another Target" or "Done"
9. Repeat steps 5-8 for additional targets
10. User taps "Save Practice Green"
11. App stores green layout with all target metadata (distance, elevation, slope)
12. User can now start a practice session using this custom green

**Flow 3: Voice-Based Stat Recording During Practice**

1. User is mid-practice session, timer running
2. User hits putt to Target 1 (10 feet)
3. User speaks: "Made it" (or "Miss left," "Short," "Long right," etc.)
4. App uses Speech Recognition to parse command
5. App logs result: Target 1, attempt 1, outcome = "Make"
6. App provides audio feedback: gentle chime for make, subtle tone for miss
7. App updates real-time stats display: "3/5 makes at 10 feet"
8. User continues practice, repeating steps 2-7

**Flow 4: Review Progress Over Time**

1. User taps "Progress" tab
2. App displays dashboard: overall make %, trend chart (last 30 days), breakdown by distance
3. User taps "Filter by Drill" → selects "Distance Control"
4. Chart updates to show only Distance Control sessions
5. User taps "View Sessions" → sees list of individual practice sessions with date, duration, and key stats
6. User taps a session → sees detailed breakdown: putts by distance, make %, slope conditions
7. User taps "Compare to Best" → app highlights improvements or declines vs. personal best

### Key Logic

**Business Rules:**

* **Session Validity:** A practice session must have at least 5 recorded attempts to be saved (prevent accidental/incomplete sessions from polluting data)
* **Voice Command Parsing:** App recognizes a core set of commands: "Made it," "Miss left," "Miss right," "Short," "Long," "Miss" (generic). Custom commands deferred to v2.
* **Elevation Accuracy:** Barometer readings must be calibrated at session start (set baseline elevation). Accuracy depends on weather stability (pressure changes affect readings).
* **Slope Calculation:** Slope is calculated as angle from horizontal using device accelerometer. Requires device to be placed flat on green surface for 2-3 seconds to get accurate reading.
* **Step Counting:** Assumes average stride length of 2.5 feet (configurable in settings). Users can calibrate stride length for improved accuracy.

**Edge Cases & Error Handling:**

* **Voice Recognition Failure:** If speech-to-text confidence <70%, app prompts for manual confirmation ("Did you say 'Made it'? Tap Yes or No")
* **Barometer Unavailable:** If device lacks barometer (older iPhones), elevation detection is disabled; app shows warning at session start
* **GPS Inaccuracy:** If GPS signal is weak (indoors, urban canyon), distance calculation falls back to step-counting only
* **Session Interruption:** If app is backgrounded mid-session, timer pauses automatically; user can resume or end session upon return
* **No Internet:** All core features work offline; data syncs to iCloud when connection is restored

**Non-Functional Requirements:**

* **Performance:** App must launch in <2 seconds; session start in <1 second; voice command processing in <1 second
* **Battery:** Practice session must consume <10% battery per 30 minutes on iPhone 12 or newer
* **Storage:** Each session record <50 KB; app must support 500+ sessions before requiring cleanup
* **Accuracy:** Step-counting distance ±5% error; elevation ±1 foot; slope ±1°; voice recognition >85% accuracy

**Data Models:**

* **Drill:** ID, name, description, instructions, default targets (distance array), estimated duration, drill type (putting, chipping, etc.)
* **Practice Session:** ID, drill ID, start time, end time, duration, user notes, targets array (each with distance, elevation, slope)
* **Attempt:** Session ID, target ID, timestamp, outcome (make/miss), miss direction (if applicable), distance from hole
* **Practice Green:** ID, name, creation date, baseline coordinates, targets array (each with distance, elevation, slope, label)
* **User Profile:** ID, name, stride length (calibration), preferred units (feet/meters), voice command preferences

---

## Technical Considerations

**Performance Requirements:**

* App launch time: <2 seconds cold start
* Session start time: <1 second from drill selection to practice mode
* Voice command latency: <1 second from speech end to stat recorded
* Sensor data refresh rate: Barometer at 1Hz, accelerometer at 10Hz (for slope detection)

**Privacy & Data Handling:**

* All practice data stored locally on device via Core Data
* Optional iCloud sync for backup and multi-device access (user must enable)
* No third-party analytics tracking user practice data
* Location data (GPS) used only for practice green creation; not stored beyond session metadata

**Integration Points:**

* **iOS Speech Recognition Framework:** For voice-based stat recording
* **CoreMotion:** For step-counting, accelerometer (slope), and barometer (elevation)
* **Core Location:** For GPS coordinates (practice green builder only)
* **Core Data:** For local data persistence
* **CloudKit:** For optional iCloud sync
* **AVFoundation:** For audio feedback (chimes, tones)

**Dependencies:**

* Requires iOS 16+ (for latest CoreMotion and Speech Recognition APIs)
* Requires iPhone with barometer (iPhone 6 or newer) for elevation features
* Requires microphone permission for voice input
* Requires motion & fitness permission for step-counting

**Risks & Mitigations:**

* **Risk:** Barometer accuracy affected by weather changes (pressure fluctuations)
  * **Mitigation:** Calibrate at session start; show confidence indicator; allow manual override
* **Risk:** Voice recognition poor in windy/noisy outdoor environments
  * **Mitigation:** Use noise cancellation; allow manual tap-based entry as fallback; test threshold for confidence scoring
* **Risk:** Step-counting inaccurate for users with non-standard stride
  * **Mitigation:** Provide stride calibration wizard; allow manual distance override
* **Risk:** Battery drain from continuous sensor polling
  * **Mitigation:** Use adaptive sampling (only poll sensors when needed); optimize CoreMotion API usage
* **Risk:** Users may find setup guidance too slow or cumbersome
  * **Mitigation:** Provide "Quick Start" mode that skips guided setup; allow users to manually place markers

---

## Appendix

**References:**

* iOS CoreMotion documentation: https://developer.apple.com/documentation/coremotion
* iOS Speech Recognition: https://developer.apple.com/documentation/speech
* Barometer altitude accuracy study: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6163638/
* Competitor analysis: Golf practice apps (Golfshot, SwingU, The Grint) - none offer guided setup or slope detection

**FAQ:**

**Q: Can the app work indoors on a putting mat?**
A: Yes, but elevation/slope detection may be limited or unavailable. Voice input and step-counting will work normally.

**Q: How accurate is the barometer for elevation?**
A: ±1 foot in stable weather conditions. Accuracy degrades during pressure changes (storms, rapid temperature shifts).

**Q: What happens if I don't grant microphone permission?**
A: Voice input will be disabled; users can tap buttons to record stats manually.

**Q: Can I edit a session after saving it?**
A: v1 does not support editing. Users can delete and re-record if needed. Edit functionality deferred to v2.

**Q: Will this work on iPad?**
A: iPad support is not prioritized for v1. iPhone-only initially; iPad may be added in v2 if demand exists.

**Q: How does the app handle different putting stroke styles?**
A: The app is stroke-agnostic and tracks only outcomes (make/miss), not technique or swing mechanics.
