# Decision Agent - Design Document

## Design Philosophy

The Decision Agent follows a **minimalist, focused** design approach:
- Single purpose: help with binary decisions
- Clear visual hierarchy
- No distractions or unnecessary features
- Streamlined interaction flow

## User Experience Flow

```
┌─────────────────────────────────────────────────────────┐
│  1. INPUT PHASE                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Which one should I [buy    ]?                  │   │
│  │                                                 │   │
│  │  [MacBook Pro        ]  [Dell XPS 15      ]     │   │
│  │  ─────────────────────VS─────────────────────   │   │
│  │                                                 │   │
│  │          [ Help Me Decide ]                     │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  2. CONVERSATION PHASE                                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  MacBook Pro                Dell XPS 15         │   │
│  │       VS                                          │   │
│  ├─────────────────────────────────────────────────┤   │
│  │  🤔 Comparing specs...                          │   │
│  │  🔍 Searching: MacBook vs Dell performance      │   │
│  │  📄 Search Results: ...                         │   │
│  │  ❓ What's your budget?                         │   │
│  │     [ <$1500 ] [ $1500-2500 ] [ >$2500 ]        │   │
│  │     [ Custom... ]                               │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  3. RESULT PHASE                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ✅                                              │   │
│  │  Decision: MacBook Pro                          │   │
│  │  Better performance for your development needs  │   │
│  │                                                 │   │
│  │  [ Start New Decision ]                         │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Visual Design

### Color Palette

| Usage | Light Mode | Dark Mode |
|-------|-----------|-----------|
| Background | `bg-gradient-to-b from-gray-50 to-white` | `dark:from-gray-900 dark:to-gray-800` |
| Card Background | `bg-white` | `dark:bg-gray-800` |
| Primary Action | `bg-indigo-600` | Same |
| Primary Hover | `bg-indigo-700` | Same |
| Success | `bg-emerald-50`, `border-emerald-200` | `dark:bg-emerald-900/20`, `dark:border-emerald-800` |
| Search Info | `bg-blue-50`, `border-blue-100` | `dark:bg-blue-900/20`, `dark:border-blue-800` |
| Question | `bg-purple-50`, `border-purple-200` | `dark:bg-purple-900/20`, `dark:border-purple-800` |
| Text Primary | `text-gray-900` | `dark:text-white` |
| Text Secondary | `text-gray-600` | `dark:text-gray-400` |
| Muted | `text-gray-500` | `dark:text-gray-400` |

### Typography

- **Font Family**: System default (Geist for headings via Next.js)
- **Hierarchy**:
  - H1: `text-3xl md:text-4xl font-bold`
  - Card Labels: `text-sm font-medium`
  - Body: `text-sm` or default
  - Muted: `text-xs text-gray-500`

### Spacing

- Container: `max-w-2xl mx-auto px-4 py-8 md:py-12`
- Card Padding: `p-6` or `p-6 md:p-8`
- Element Spacing: `space-y-4` or `space-y-6`
- Section Gap: `mt-12` (footer)

### Border Radius

- Cards: `rounded-2xl` (16px)
- Buttons: `rounded-lg` (8px)
- Pills/Tags: `rounded-full`
- Messages: `rounded-lg` or `rounded-xl`

## Component Design

### InputForm

**Layout Changes (Evolution):**

Original:
```
Option A
---
VS
---
Option B
---
Context (full sentence)
```

Current:
```
Which one should I [_______]?

Option A        Option B
[________]  VS  [________]
```

**Rationale:**
- Verb-first approach is more natural
- Options side-by-side emphasizes comparison
- Reduced cognitive load

### ChatThread Header

```
┌─────────────────────────────────────┐
│  Option A        VS       Option B  │
│  [Value]                  [Value]   │
└─────────────────────────────────────┘
```

- Always visible during conversation
- Reminds user what they're comparing
- Clean, minimal design

### Message Types

| Type | Icon | Style | Purpose |
|------|------|-------|---------|
| thought | 👁️ | Italic, muted | Show AI reasoning |
| search | 🔄 (spinner) | Gray background | Indicate active search |
| search_result | 🔍 | Blue border | Display results |
| question | ❓ | Purple border | Q&A history |
| answer | (user) | Indigo bubble, right | User response |
| final | ✅ | Emerald border, centered | Decision |
| error | ⚠️ | Red border | Error state |

### QuestionCard

**Active Question Display:**
```
┌─────────────────────────────────────┐
│  What is your budget?               │
│                                     │
│  ○ Under $1000                      │
│  ○ $1000-2000                       │
│  ○ Over $2000                       │
│  ○ Other: [________]                │
│                                     │
│  [ Continue ]                       │
└─────────────────────────────────────┘
```

- Radio buttons for options
- Custom input for "Other"
- Submit button disabled until selection

## Interaction Design

### Loading States

1. **Form Submission**
   - Button shows spinner + "Starting..."
   - Disabled state

2. **Streaming**
   - Search shows animated spinner
   - Thinking shows static icon

3. **Question Waiting**
   - No loading indicator
   - Form is interactive

### Animations

- **Spinner**: `animate-spin` on search
- **Transitions**: `transition-all` on interactive elements
- **Hover**: Color changes on buttons and links

### Responsive Design

- Mobile-first approach
- Breakpoint: `md:` (768px)
- Input form: Stack vertically on mobile
- Cards: Full width on mobile, max-w-2xl on desktop

## Accessibility

- Semantic HTML (label, button, input)
- ARIA labels on interactive elements
- Focus states: `focus:ring-2 focus:ring-indigo-500`
- Color contrast: WCAG AA compliant

## Design Decisions Log

### Decision: Remove Round Counter

**Date:** 2024-03-28
**Context:** Round counter was not updating correctly and added visual noise
**Decision:** Removed from UI
**Rationale:**
- Users don't need to know round count during conversation
- Simpler is better
- Still enforced in backend

### Decision: Preserve Question History

**Date:** 2024-03-28
**Context:** Questions disappeared after answering
**Decision:** Questions now saved to message history and displayed
**Rationale:**
- Users need context when reviewing conversation
- Better for debugging and transparency

### Decision: Verb-First Input

**Date:** 2024-03-27
**Context:** Original design had full context sentence input
**Decision:** Changed to "Which one should I [verb]" pattern
**Rationale:**
- More natural language
- Faster input
- Clearer intent

## Future Design Considerations

- **Animations**: Add fade-in for new messages
- **Typing Indicator**: Show when AI is "thinking"
- **Progress Bar**: Visual indicator of decision confidence
- **Theme Toggle**: Explicit dark/light mode switch
