# UI/UX Design Document
## AI-Powered Adaptive Learning Tutor

**Companion docs:** [PRD.md](PRD.md), [TRD.md](TRD.md), [Backend-Schema.md](Backend-Schema.md)

---

## 1. Design Principles

The application must **never overwhelm the student**. Every screen favors:

- **Simple** — one clear primary action per screen.
- **Fast** — short AI responses, small content chunks, quick load states.
- **Visual** — diagrams, cards, icons over walls of text.
- **Interactive** — voice, buttons, quizzes instead of passive reading.
- **Short** — the AI never dumps large blocks of text; content is chunked into small sections, cards, diagrams, and examples.

Visual language: clean cards, rounded corners (`rounded-xl`/`rounded-2xl`), subtle shadows (`shadow-sm`/`shadow-md`), generous whitespace, clear typographic hierarchy, accessible buttons (min 44px touch target, visible focus states), a responsive sidebar on desktop that collapses to a bottom/hamburger nav on mobile.

Feel: a modern educational SaaS product (think Duolingo's warmth + Notion's cleanliness + Linear's polish) — not a bare admin panel, not a flashy game.

---

## 2. Design Tokens (suggested Tailwind theme)

| Token | Value | Usage |
|---|---|---|
| Primary | Indigo/Violet `#6366F1` | Primary buttons, active nav, links |
| Secondary | Teal `#14B8A6` | Success states, mastery indicators |
| Accent | Amber `#F59E0B` | Streaks, highlights, recommended badge |
| Danger | Rose `#F43F5E` | Weak topics, incorrect answers |
| Background | `#F8FAFC` (light) | App background |
| Surface | `#FFFFFF` | Cards |
| Text primary | `#0F172A` | Headings, body |
| Text muted | `#64748B` | Secondary text |
| Radius | `12px`–`16px` | Cards, buttons, inputs |
| Shadow | `0 1px 3px rgba(0,0,0,0.08)` | Card elevation |
| Font | Inter / system-ui | All text |

Dark mode is optional/nice-to-have, not MVP-required, but tokens should be structured so it could be added later (CSS variables or Tailwind `dark:` variants).

---

## 3. Responsive Breakpoints

| Breakpoint | Width | Layout behavior |
|---|---|---|
| Mobile | < 640px | Single column, bottom nav or hamburger, stacked Tutor page sections |
| Tablet | 640–1024px | Two-column where useful, collapsible sidebar |
| Desktop/Laptop | > 1024px | Full sidebar, multi-column dashboard/tutor layouts |

All pages must be usable (no horizontal scroll, no clipped controls) at all three sizes.

---

## 4. Pages & Layout

### 4.1 Landing Page (public)

Vertical scroll, sections in order:

1. **Hero** — Headline *"Learn Smarter with Your Personal AI Tutor"*, subtitle *"Understand concepts, visualize ideas, practice with quizzes, and improve with a tutor that adapts to your learning level."*, two buttons: **Start Learning** (primary → signup), **Try AI Tutor** (secondary → demo/login). Illustration of the avatar + chat bubble beside the text on desktop, stacked below on mobile.
2. **How AI Tutor Works** — 4-step horizontal flow (Learn → Notes → Test → Improve) as icon cards.
3. **AI Teacher** — Avatar preview with idle/speaking states shown as a small animation or illustration set.
4. **Visual Learning** — Sample Mermaid-style diagram card.
5. **Smart Notes** — Sample note card preview (definition/key concepts/example).
6. **Adaptive Quiz** — Sample MCQ card with difficulty badge.
7. **Performance Tracking** — Sample mini chart (mastery bar).
8. **AI Chatbot** — Sample short chat exchange bubble.
9. **Call to Action** — Repeat of Start Learning button, centered, full-width band.
10. **Footer** — Logo, short tagline, links (About, Contact placeholder), copyright.

### 4.2 Login / Signup

Centered single card (max-width ~420px) on a soft background.

- **Login:** Email, Password, primary "Log In" button, link to Signup.
- **Signup:** Name, Email, Password, Education level (dropdown: School / Diploma / Undergraduate / Graduate / Other), primary "Create Account" button, link to Login.
- Inline validation errors under each field; single error toast for server errors (e.g. "Email already registered").

### 4.3 Student Dashboard

Layout: sidebar (Dashboard, AI Tutor, Notes, Quiz History, Progress, Chat, Logout) + main content.

Main content, top to bottom:

1. Welcome banner — *"Good Morning, {name}!"* + "Continue Learning" button linking to last topic.
2. Stat cards row (4 cards): Topics Completed, Quiz Accuracy, Learning Time, Current Streak — each with an icon and big number (e.g. "12", "82%", "8h", "5 days").
3. "Recommended for you" card — highlighted (accent border), e.g. *"Revise Backpropagation"* with a "Start" button.
4. Two-column section (stacks on mobile): **Recently Studied Topics** (list of topic cards with mini progress bar) and **Weak Topics** (list with danger-colored badges).
5. Recent performance mini-list (last 3 quiz results with score + date).

### 4.4 AI Tutor Page (core screen)

Desktop layout — 3 columns + bottom bar:

```
┌─────────────┬───────────────────────────────┬───────────────┐
│  AI Teacher  │   Explanation / Visual Board   │ Topic Progress │
│   (avatar)   │   (text + Mermaid diagram)     │  Key Points     │
├─────────────┴───────────────────────────────┴───────────────┤
│  🎙 Voice Controls   |  [ Type your question... ]  [ Send ]   │
└─────────────────────────────────────────────────────────────┘
```

- **Left panel:** Avatar illustration with state indicator (idle/speaking/thinking/listening), topic name, difficulty badge (Beginner/Intermediate/Advanced pill).
- **Center panel:** Chunked explanation in small paragraphs/cards (not one big block), inline Mermaid diagram rendered below the relevant paragraph, worked example in a distinct callout card.
- **Right panel:** Checklist of key points covered so far (checkmarks fill in as sections load), small topic-mastery ring/progress bar.
- **Bottom bar:** Action buttons — Play, Pause, Explain Again, Explain Simply, Give Example, Show Diagram, Slower, Ask Question — shown as an icon+label row on desktop, condensed into a "More" overflow menu on mobile. Mic button + text input always visible.

Mobile layout: stacks vertically — avatar (small, top), explanation/diagram (scrollable center), key points (collapsible accordion), controls pinned to bottom as a compact bar.

### 4.5 Notes Page

- Search bar at top.
- Grid/list of note cards (topic title, updated date, snippet).
- Click → detail/edit view: rendered markdown-style note (Definition, Key Concepts, Diagram, Example, Important Points, Quick Revision) with Edit / Save / Delete / Download buttons.

### 4.6 Quiz Page

- "Topic Complete!" celebratory header → "Test your understanding" subtext → Start Quiz button.
- One question per screen (or short vertical list), 4 options as selectable cards, progress indicator ("Question 3 of 10"), Next/Submit button.
- On submit: transition to Performance/Results view (see 4.7).

### 4.7 Performance / Results View

- Score headline: "8/10" large, Accuracy "80%" as a ring chart.
- Two badge lists: **Strong Areas** (teal chips) / **Weak Areas** (rose chips).
- AI feedback paragraph (short, 2–4 sentences) in a highlighted card.
- Recommendations list with action buttons (e.g. "Revise Stride →", "Practice 5 Questions →").

### 4.8 Progress Page

- Chart.js visualizations: horizontal bar chart of per-topic mastery (e.g. CNN 90%, RNN 75%, Transformers 55%), line chart of quiz accuracy over time, streak calendar/strip, weak vs strong topic chip lists.

### 4.9 Chat Page

- Simple chat UI: message list (student right-aligned, AI left-aligned with avatar thumbnail), input box + mic button at bottom.
- AI bubbles are intentionally short (2–5 sentences) — bubble width capped so long responses still feel scannable, with a small "Explain deeply" quick-reply chip the student can tap instead of retyping.

---

## 5. Components Inventory

| Component | Used on |
|---|---|
| `Navbar` / `Sidebar` | All authenticated pages |
| `StatCard` | Dashboard |
| `TopicCard` | Dashboard, Tutor topic picker |
| `AvatarPanel` (idle/speaking/thinking/listening) | Tutor page, Chat page |
| `DiagramView` (Mermaid renderer) | Tutor page, Notes |
| `VoiceControls` (mic + play/pause/stop) | Tutor page, Chat page |
| `DifficultyBadge` | Tutor page, Quiz |
| `NoteCard` / `NoteEditor` | Notes page |
| `QuizQuestion` | Quiz page |
| `ResultBadgeList` (strong/weak chips) | Performance view |
| `ProgressChart` (wraps react-chartjs-2) | Progress page |
| `ChatBubble` | Chat page |
| `Toast` / inline error banner | Global (API failure messaging) |

---

## 6. Interaction & Feedback States

- **Loading:** skeleton cards/shimmer for explanations, notes, quiz generation — never a blank white screen for AI calls that take a few seconds.
- **Empty states:** friendly illustration + short copy (e.g. "No notes yet — start a lesson to generate your first one.").
- **Error states:** inline banner with retry button, e.g. "The AI tutor is having trouble responding. Retry?" — never a raw error dump.
- **Success/micro-interactions:** subtle scale/fade transitions on card entry, checkmark animation on quiz-correct, confetti-lite (optional, simple CSS) on quiz completion — kept subtle, not distracting.

---

## 7. Accessibility

- All interactive elements keyboard-navigable with visible focus rings.
- Sufficient color contrast (WCAG AA) for text on colored badges.
- Mic/voice controls have text labels + `aria-label`, not icon-only with no accessible name.
- Diagrams include a text alternative (the explanation text already covers the content, so the diagram is supplementary, not the sole source of information).
