# Golf Practice App - PRD

**Created:** January 13, 2026
**Author:** Reid Francis
**Template:** PRD Prompt Template

---

## Executive Summary

This PRD defines requirements for an iOS golf practice app that helps golfers run structured practice sessions with guided setup, hands-free stat tracking via voice input, and progress analytics. The app leverages iPhone sensors (barometer, accelerometer, GPS) to measure elevation and slope on practice greens, enabling realistic practice conditions and accurate performance data. Primary business goals are to capture the underserved golf practice training market, differentiate through sensor-based elevation/slope detection, and achieve 10,000+ downloads in year one with 20%+ monthly active user retention.

Strategic alignment: Targets recreational golfers (5-25 handicap) who practice regularly but lack structured training tools, representing a $50M+ addressable market based on golf app category revenue and 25M golfers in the US.

---

## Problem Statement

**Current State:**
Golfers practicing on putting greens or short game areas face three core challenges:
1. **Lack of structure:** No clear plan for what to practice, how long to practice, or how to set up drills, leading to inefficient sessions and slow improvement
2. **Manual tracking burden:** Recording stats requires stopping to write notes or type into phone, disrupting practice flow and reducing data quality
3. **No slope/elevation awareness:** Players cannot accurately measure green contours on practice greens, making it impossible to track performance across different slope conditions or create realistic practice scenarios

**Desired State:**
Golfers have a mobile app that:
* Provides pre-built practice plans with step-by-step setup guidance (using phone sensors to pace out distances)
* Enables hands-free stat recording via voice commands during practice
* Automatically measures elevation and slope at each practice target using iPhone sensors
* Tracks progress over time with analytics filtered by distance, slope, and drill type

**Impact of Not Implementing:**
* Golfers continue to waste practice time on unstructured sessions, slowing skill development
* Competitive apps without sensor-based features gain market share
* Missed opportunity to establish early leadership in sensor-augmented golf training category

**Quantifiable Problem Evidence:**
* Personal experience: Practice sessions often feel directionless; manual stat tracking on paper is tedious and incomplete
* Market gap: Existing golf apps (Golfshot, SwingU, The Grint) focus on on-course scoring, not structured practice
* User interviews (informal): 8/10 golfers surveyed want better practice tools but find current solutions too complex or limited

---

## Success Metrics

**Primary Metrics:**

1. **User Acquisition:** 10,000+ total downloads in first 12 months
   * **Measurement:** App Store Connect analytics
   * **Timeline:** 1,000 downloads in Month 1-3, 3,000 by Month 6, 10,000 by Month 12

2. **User Engagement:** 20% monthly active user (MAU) retention rate
   * **Measurement:** Users who complete at least 1 practice session per month / total users
   * **Timeline:** Achieve 20% by Month 6 (initial cohort retention stabilizes after 6 months)

3. **Session Completion Rate:** 70% of started sessions are completed and saved
   * **Measurement:** (Sessions saved with ≥5 attempts) / (Total sessions started)
   * **Timeline:** Baseline after Month 1, target 70% by Month 3

**Secondary Metrics:**

4. **Voice Input Adoption:** 60% of users use voice commands in at least 30% of their sessions
   * **Measurement:** (Users with ≥30% voice-recorded attempts) / (Total active users)
   * **Timeline:** Achieve 60% by Month 4

5. **Sensor Feature Usage:** 40% of users create at least one custom practice green (uses elevation/slope detection)
   * **Measurement:** (Users with ≥1 custom green) / (Total active users)
   * **Timeline:** Achieve 40% by Month 6

6. **Practice Frequency:** Active users complete an average of 3+ sessions per month
   * **Measurement:** Total sessions completed / Monthly active users
   * **Timeline:** Baseline in Month 1, target 3+ sessions/user by Month 4

**Guardrail Metrics:**

* App crash rate <0.5% (Crashlytics)
* Voice recognition accuracy >85% (Speech API confidence scores)
* App Store rating ≥4.0 stars (user feedback)
* Battery consumption <10% per 30-minute session (iOS battery profiling)

---

## User Personas & Use Cases

### Persona 1: "Serious Recreational Golfer Sarah"

**Demographics:**
* Age: 35-55
* Handicap: 10-18
* Practice frequency: 2-3 times per week, 30-60 minutes per session
* Tech comfort: High (uses golf GPS apps, fitness trackers)
* Goals: Lower handicap to single digits, improve short game consistency

**Behavioral Patterns:**
* Practices at local course practice green during lunch breaks or after work
* Previously used pen-and-paper to track stats, but found it tedious and inconsistent
* Wants structure and measurable progress, not just "hit balls"
* Willing to invest time in setup if it leads to better data

**Needs:**
* Pre-built drills so she doesn't have to research or plan practice
* Quick session setup (<2 minutes) to maximize limited practice time
* Hands-free stat tracking so she can focus on putting, not typing
* Progress tracking to see if she's actually improving

**Pain Points:**
* Unsure what to practice or for how long
* Forgets to write down stats or gives up mid-session because it's cumbersome
* Can't tell if she's improving on uphill vs. downhill putts because she doesn't track slope

### Persona 2: "Data-Driven Mike"

**Demographics:**
* Age: 25-40
* Handicap: 5-12
* Practice frequency: 3-5 times per week, 45-90 minutes per session
* Tech comfort: Very high (early adopter, uses launch monitors, training aids)
* Goals: Compete in amateur tournaments, optimize practice efficiency

**Behavioral Patterns:**
* Practices at multiple greens (home course, practice facility, different slopes)
* Tracks everything: make percentages, distance accuracy, performance under pressure
* Wants to identify weaknesses (e.g., "I miss 20% more putts on 3° slopes")
* Willing to spend time on setup if it yields actionable insights

**Needs:**
* Custom practice greens with accurate elevation and slope data
* Granular filtering of stats (by distance, slope, green conditions, time of day)
* Confidence that sensor data is accurate (within ±1 foot elevation, ±1° slope)
* Export or share data (deferred to v2, but keep in mind for data model design)

**Pain Points:**
* Existing apps don't track slope or elevation, so he can't isolate performance variables
* Manual setup is error-prone (pacing distances by eye leads to inconsistent data)
* No way to compare performance across different practice greens

### Persona 3: "Casual Improver Alex"

**Demographics:**
* Age: 30-50
* Handicap: 18-25
* Practice frequency: 1-2 times per week, 20-40 minutes per session
* Tech comfort: Medium (uses iPhone for basics, not heavily into golf tech)
* Goals: Get better without overthinking it, enjoy the game more

**Behavioral Patterns:**
* Practices sporadically, often without a plan
* Gets bored with repetitive drills
* Wants practice to feel like a game, not a grind
* Less interested in detailed analytics, more interested in "am I getting better?"

**Needs:**
* Fun, game-like practice formats (e.g., "Make 3 in a row to advance")
* Simple progress indicators (e.g., "You're 10% better this month!")
* Minimal setup complexity (doesn't want to learn complicated features)
* Variety to keep practice engaging

**Pain Points:**
* Finds traditional drills boring and quits early
* Doesn't know if practice is actually helping (no feedback loop)
* Overwhelmed by apps with too many features or settings

---

### Conversation Scenarios (Use Cases)

**Scenario 1: Distance Control Drill (Sarah)**

1. Sarah arrives at practice green with 30 minutes
2. Opens app, taps "Start Practice," selects "Distance Control - 3 Distances"
3. App shows instructions: "Place tees at 10, 20, and 30 feet from hole"
4. App guides setup: "Walk 10 paces from hole... 8... 6... stop. Place tee here."
5. Sarah places tee, taps "Next Target," repeats for 20 and 30 feet
6. Taps "Start Practice," timer begins (30 minutes)
7. Sarah putts to 10-foot target, says "Made it" → app logs make
8. Next putt: "Miss left" → app logs miss + direction
9. After 10 putts at each distance, timer ends
10. App shows summary: 70% at 10 feet, 50% at 20 feet, 30% at 30 feet
11. Sarah taps "Save Session," reviews trend chart showing improvement over last 4 weeks

**Scenario 2: Custom Green with Slope (Mike)**

1. Mike is at a new practice facility with sloped greens
2. Taps "Custom Green," then "Build New Green"
3. Stands at starting point, taps "Set Start" (app records GPS + barometer baseline)
4. Walks to first flag (uphill), taps "Add Target"
5. App calculates: 22 paces, +2.1 feet elevation, 3.2° upslope
6. Mike labels it "Flag 1 - Uphill," adds two more targets (one downhill, one flat)
7. Taps "Save Green," names it "Facility Green - North"
8. Starts practice session using this custom green
9. After session, filters stats by slope: "3° upslope: 55% make rate" vs. "flat: 72%"
10. Identifies weakness on uphill putts, plans to focus on them next session

**Scenario 3: Practice Round Game (Alex)**

1. Alex opens app, taps "Practice Games," selects "Pressure Putting Challenge"
2. Game rules: Must make 3 putts in a row at each distance (10, 15, 20 feet) to advance
3. App guides setup for 3 targets, starts game timer
4. Alex putts to 10-foot target, says "Made it," "Made it," "Miss" → resets counter
5. Eventually makes 3 in a row, advances to 15 feet
6. After 20 minutes, completes game or time expires
7. App shows score: "Completed 2 of 3 levels - Best yet! Last week: 1 level"
8. Alex sees simple progress bar: "You're improving! Keep it up."

**Edge Cases:**

* **Voice misrecognition:** Sarah says "Made it," app hears "Faded." App shows confirmation prompt: "Did you say 'Made it'?" with Yes/No buttons.
* **No barometer available:** Mike's friend has an iPhone SE (1st gen, no barometer). App disables elevation detection, shows warning: "Elevation features unavailable on this device."
* **Session interrupted:** Alex's phone rings mid-session. App auto-pauses timer. When she returns, app prompts: "Resume session or end now?"
* **Extreme slope:** Mike practices on a 10° slope. App shows warning: "Slope measurement at device limit. Results may be less accurate."
* **Windy conditions:** Voice recognition confidence drops to 60% due to wind noise. App automatically suggests: "Tap mode available - would you like to switch?"

**Failure Modes:**

* **GPS unavailable indoors:** Custom green builder falls back to step-counting only (no absolute coordinates).
* **Battery dies mid-session:** Session data is auto-saved every 30 seconds to prevent loss.
* **Accidental voice triggers:** User says "miss" in conversation (not recording a putt). App uses context (time since last putt) to filter false triggers.

---

## Core Requirements

### Must-Have (v1.0)

#### Functional Requirements

**F1: Practice Plan Library**
* **Requirement:** Provide at least 10 pre-built putting drills with clear instructions, setup guidance, and default targets
* **Acceptance Criteria:**
  * Each drill includes: name, description, difficulty level, estimated duration, required equipment, and target setup (distances)
  * Drills cover common practice categories: distance control, gate drills, breaking putts, lag putting, pressure drills
  * Users can view drill details before starting a session
* **Priority:** Must-have
* **Dependency:** None

**F2: Guided Practice Sessions**
* **Requirement:** Lead users through structured practice sessions with timer, guided setup, and stat tracking
* **Acceptance Criteria:**
  * User selects a drill → app shows setup instructions → user confirms setup complete → timer starts
  * Timer supports countdown mode (e.g., 30 minutes) and interval mode (e.g., 10 putts per target)
  * App displays current target, attempts made, and real-time make percentage
  * Session ends when timer expires or user manually ends
  * Session summary shows: total attempts, make %, breakdown by target/distance
* **Priority:** Must-have
* **Dependency:** F1 (drills), F4 (stat recording)

**F3: Step-Counting Setup Assistance**
* **Requirement:** Use iPhone step-counting to guide users in placing markers/tees at specified distances
* **Acceptance Criteria:**
  * App counts user's steps in real-time using CoreMotion pedometer
  * Provides audio/visual cues: "Walk 15 paces... 10 more... 5... stop here"
  * User can calibrate stride length in settings (default: 2.5 feet/step)
  * Accuracy: ±5% distance error vs. measured tape
* **Priority:** Must-have
* **Dependency:** iOS CoreMotion framework, motion & fitness permissions

**F4: Voice-Based Stat Recording**
* **Requirement:** Allow users to record putt outcomes hands-free via voice commands
* **Acceptance Criteria:**
  * Recognizes core commands: "Made it," "Miss," "Miss left," "Miss right," "Short," "Long"
  * Voice recognition active during practice session only (not in menus)
  * Provides audio feedback for each recorded stat (chime for make, tone for miss)
  * If confidence <70%, prompts user for manual confirmation
  * Fallback: Manual tap buttons available at all times
* **Priority:** Must-have
* **Dependency:** iOS Speech Recognition framework, microphone permission

**F5: Elevation Detection (Barometer)**
* **Requirement:** Measure elevation changes between practice targets using iPhone barometer
* **Acceptance Criteria:**
  * Calibrates baseline elevation at session start
  * Displays elevation differential for each target (e.g., "+2.1 feet")
  * Accuracy: ±1 foot in stable weather conditions
  * Shows confidence indicator (weather stability affects accuracy)
  * Gracefully disables if barometer unavailable (older iPhones)
* **Priority:** Must-have (core differentiator)
* **Dependency:** iPhone 6+ (barometer required), CoreMotion framework

**F6: Slope Detection (Accelerometer)**
* **Requirement:** Measure slope angle at practice targets using iPhone accelerometer/gyroscope
* **Acceptance Criteria:**
  * User places phone flat on green for 2-3 seconds → app calculates slope angle from horizontal
  * Displays slope in degrees (e.g., "3.2° upslope")
  * Accuracy: ±1° vs. professional inclinometer
  * Works in any orientation (app auto-detects device orientation)
* **Priority:** Must-have (core differentiator)
* **Dependency:** CoreMotion framework, accelerometer/gyroscope sensors

**F7: Custom Practice Green Builder**
* **Requirement:** Allow users to create virtual practice greens by marking multiple targets with distance, elevation, and slope data
* **Acceptance Criteria:**
  * User sets starting point → walks to each target → app records distance (steps), elevation (barometer), slope (accelerometer)
  * User can label each target (e.g., "Flag 1 - Uphill," "Tee 2 - Flat")
  * Saved greens appear in a library for reuse
  * Users can edit or delete saved greens
  * Each green stores: name, creation date, baseline GPS coordinates, target array (label, distance, elevation, slope)
* **Priority:** Must-have
* **Dependency:** F3 (step-counting), F5 (elevation), F6 (slope), Core Location (GPS)

**F8: Progress Tracking Dashboard**
* **Requirement:** Display historical practice data with trends, filtering, and drill-specific analytics
* **Acceptance Criteria:**
  * Home dashboard shows: total sessions, overall make %, trend chart (last 30 days)
  * User can filter by: drill type, date range, distance, slope category (flat, upslope, downslope)
  * Drill-specific views show: best session, average performance, improvement trend
  * Session history list shows: date, duration, drill name, key stats
  * Tapping a session opens detailed view with attempt-by-attempt data
* **Priority:** Must-have
* **Dependency:** F2 (sessions), Core Data (persistence)

**F9: Practice Round Games**
* **Requirement:** Provide game-based practice formats with built-in rules and scoring
* **Acceptance Criteria:**
  * At least 3 pre-built games at launch (e.g., "Pressure Putting," "Beat Your Best," "Distance Ladder")
  * Each game includes: rules, setup, win conditions, scoring logic
  * Game stats tracked separately from standard drills
  * Session summary shows game progress (e.g., "Completed 2 of 3 levels")
* **Priority:** Nice-to-have (addresses Persona 3 engagement, but not critical for v1)
* **Dependency:** F2 (sessions), F4 (stat recording)

#### Non-Functional Requirements

**NF1: Performance**
* App launch time: <2 seconds cold start
* Session start time: <1 second from drill selection to practice mode
* Voice command latency: <1 second from speech end to stat recorded
* Sensor data processing: <500ms for elevation/slope calculation
* **Acceptance Criteria:** 95th percentile latency meets targets (measured via iOS Instruments profiling)

**NF2: Battery Efficiency**
* Practice session consumes <10% battery per 30 minutes on iPhone 12 or newer
* **Acceptance Criteria:** Battery drain measured via iOS battery profiling in realistic usage scenarios

**NF3: Storage**
* Each session record <50 KB
* App must support 500+ sessions without requiring cleanup
* **Acceptance Criteria:** Core Data storage profiling shows <25 MB for 500 sessions

**NF4: Offline Functionality**
* All core features work without internet connection
* Data syncs to iCloud when connection restored (if iCloud enabled)
* **Acceptance Criteria:** App functions fully in airplane mode; sync verified post-reconnect

**NF5: Accessibility**
* Supports VoiceOver for vision-impaired users (critical for voice-first app)
* Dynamic type support (text scales with iOS system settings)
* High contrast mode support
* **Acceptance Criteria:** Passes iOS accessibility audit; VoiceOver navigation verified manually

**NF6: Sensor Accuracy**
* Step-counting distance: ±5% error vs. tape measure
* Elevation detection: ±1 foot in stable weather
* Slope detection: ±1° vs. professional inclinometer
* Voice recognition: >85% accuracy in outdoor environments
* **Acceptance Criteria:** Validated via side-by-side testing with professional tools

### Nice-to-Have (Deferred to v2)

**F10: Custom Drill Builder**
* Users can create and save their own drills with custom targets, timers, and rules
* **Why deferred:** Adds significant complexity to data model and UI; v1 validates demand for built-in drills first

**F11: Apple Watch Companion App**
* View session stats and record via voice on Apple Watch
* **Why deferred:** Increases development scope; v1 focuses on iPhone experience to prove core value proposition

**F12: Session Editing**
* Edit saved sessions (add/remove attempts, change outcomes)
* **Why deferred:** Low priority for v1; users can delete and re-record if needed

**F13: Social Features**
* Share sessions with friends, compare stats, leaderboards
* **Why deferred:** Requires backend infrastructure and privacy considerations; v1 is single-player focused

**F14: Video Recording**
* Record video of putting stroke during practice
* **Why deferred:** Significant storage and performance overhead; conflicts with hands-free focus

---

## Out of Scope

**Explicitly Excluded from v1:**

1. **Integration with external devices** (launch monitors, swing analyzers, smart putting mats) - Requires hardware partnerships; deferred pending v1 traction
2. **Android version** - iOS-only for v1 to focus resources; Android depends on iOS success
3. **iPad optimization** - iPhone-only; iPad support if user demand exists post-launch
4. **On-course play features** (GPS, scorekeeping, course maps) - Out of scope; app is practice-focused
5. **Full swing or driving range tracking** - v1 focuses on putting and short game only; full swing deferred to v2
6. **Subscription or monetization** - v1 is free (ad-free); monetization strategy determined post-launch based on usage
7. **Integration with golf associations or handicap systems** - No GHIN or USGA integration; out of scope for practice app

---

## Questions for Technical Implementation

**Critical Questions:**

1. **Barometer Accuracy:** How do we mitigate barometer drift due to weather changes during a 30-60 minute session? Should we re-calibrate periodically or warn users when pressure changes exceed a threshold?
   * **PM Guidance:** Show real-time confidence indicator; allow manual re-calibration mid-session if user notices drift. Investigate if CoreMotion provides weather stability API.

2. **Voice Recognition in Noisy Environments:** What is the minimum acceptable confidence score for voice commands, and how do we balance accuracy vs. user friction from confirmation prompts?
   * **PM Guidance:** Target >85% accuracy. If confidence <70%, prompt for confirmation. Allow users to set threshold in settings (advanced users may tolerate more prompts for higher accuracy).

3. **Step-Counting Calibration:** How do we guide users through stride calibration without making onboarding overly complex?
   * **PM Guidance:** Use a simple wizard: "Walk 30 feet (measured distance) → tap done → app calculates stride length." Skip for users who don't need precision.

4. **Battery Optimization:** Which sensor polling strategies minimize battery drain while maintaining accuracy?
   * **PM Guidance:** Only poll barometer/accelerometer during setup and target marking (not continuously during practice). Investigate CoreMotion batch APIs for efficiency.

5. **Core Data Schema:** How should we model sessions, drills, and attempts to support future features (custom drills, sharing, filtering) without over-engineering v1?
   * **PM Guidance:** Design for extensibility: Drill schema supports custom fields (JSON blob for future attributes); Session schema includes optional `sharedWith` and `customGreenID` fields (unused in v1 but ready for v2).

**Data Requirements:**

6. **Pre-Built Drill Data:** Who creates the initial 10 drills? Do we need golf instructor input, or can we source from public domain?
   * **PM Guidance:** Source from common golf instruction resources (e.g., Golf Digest, PGA.com); validate with 2-3 golfers for usability. No instructor partnership required for v1.

7. **Test Data for Voice Recognition:** What outdoor noise profiles should we test against (wind, traffic, other golfers)?
   * **PM Guidance:** Collect test recordings in 3 environments: quiet practice green, windy conditions (15+ mph), and busy facility (background conversations). Aim for >85% accuracy in quiet, >70% in noisy.

**Integration Challenges:**

8. **iCloud Sync Conflicts:** How do we handle sync conflicts if a user practices offline on multiple devices?
   * **PM Guidance:** Last-write-wins for v1 (simple, acceptable for single-user app). Flag as future enhancement if users report issues.

9. **GPS Accuracy Indoors:** If a user tries to build a custom green indoors (e.g., on a mat at home), GPS will be unavailable. Should we disable custom greens indoors or fall back to step-counting only?
   * **PM Guidance:** Allow custom greens without GPS (step-counting only). Warn user: "GPS unavailable - green will use relative distances only."

**Performance Optimization:**

10. **Voice Recognition Latency:** Can we achieve <1 second latency with on-device Speech Recognition, or do we need server-based recognition?
    * **PM Guidance:** Use on-device recognition (iOS 15+ supports offline speech recognition for English). Test latency on iPhone 11 and newer; if latency >1s, consider pre-loading speech recognition engine at session start.

11. **Sensor Sampling Rate:** What is the optimal barometer/accelerometer sampling rate to balance accuracy and battery life?
    * **PM Guidance:** Barometer: 1Hz (sufficient for elevation changes). Accelerometer: 10Hz during slope measurement (2-3 seconds), then idle. No continuous polling during practice.

---

## Gap Analysis & Recommendations

**Recommendations for Strengthening This PRD:**

1. **Add user research validation:** Conduct 10-15 user interviews with target personas to validate pain points and feature priorities. Current PRD is based on personal experience and informal feedback.

2. **Define monetization strategy:** Even if v1 is free, outline potential monetization paths (freemium, one-time purchase, subscription) to inform feature scope (e.g., which features are "premium").

3. **Competitive analysis:** Formalize competitive research on existing golf practice apps to identify gaps and differentiation opportunities. Current references are anecdotal.

4. **Privacy policy and data handling:** Specify data retention, user consent for sensor data collection, and GDPR/CCPA compliance (if applicable).

5. **Localization requirements:** Clarify if v1 supports multiple languages or units (feet vs. meters). Currently assumes English and feet.

6. **Error logging and analytics:** Define what user behavior should be tracked (anonymized) to improve the product post-launch (e.g., session abandonment rate, feature usage, crash reports).

7. **Marketing and launch plan:** Outline go-to-market strategy (App Store optimization, beta testing, influencer outreach) to hit 10,000 download target.

**Best Practice Improvements:**

* **Add "Jobs to Be Done" framework:** Reframe personas around specific jobs (e.g., "When I'm practicing putting, I want to know if I'm improving on uphill putts so I can build confidence before tournament rounds").
* **Include A/B testing plan:** Identify key hypotheses to test post-launch (e.g., Does guided setup increase session completion? Does voice input improve engagement?).
* **Define MVP vs. MMP:** Clarify minimum viable product (shipped features) vs. minimum marketable product (features needed for App Store success). Current PRD combines both.
