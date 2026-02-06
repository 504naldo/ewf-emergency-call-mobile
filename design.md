# EWF Emergency Call Service - Design Document

## Overview

An internal emergency call routing and incident management system for technicians and administrators. The system orchestrates emergency calls through on-call ladders, creates incidents, enforces ownership, and provides live admin control.

## Design Principles

- **Mobile-First**: Designed for portrait orientation (9:16) and one-handed usage
- **HIG Compliance**: Follows Apple Human Interface Guidelines for native iOS feel
- **Clarity Over Decoration**: Focus on critical information and fast actions
- **Minimal Taps**: Emergency flows require minimal interaction
- **Offline-Tolerant**: Queue status updates when network is unavailable

## Color Scheme

- **Primary (Accent)**: `#DC2626` (Red 600) - Emergency/Critical actions
- **Success**: `#16A34A` (Green 600) - Accepted/Resolved states
- **Warning**: `#F59E0B` (Amber 500) - En Route/On Site states
- **Background**: `#FFFFFF` (Light) / `#151718` (Dark)
- **Surface**: `#F5F5F5` (Light) / `#1E2022` (Dark) - Cards
- **Foreground**: `#11181C` (Light) / `#ECEDEE` (Dark) - Primary text
- **Muted**: `#687076` (Light) / `#9BA1A6` (Dark) - Secondary text

## Screen Structure

### 1. Home Screen (Technician Dashboard)

**Purpose**: Primary screen for technicians to view assigned incidents and availability status

**Content**:
- Header with tech name and current on-call status badge
- Availability toggle (Available / Unavailable)
- Current assigned incident card (if any) with:
  - Incident ID
  - Status badge
  - Time elapsed since received
  - Site name/address
  - Quick action buttons (Update Status, View Details)
- Recent incidents list (last 10)
  - Each shows: ID, status, site, timestamp
  - Tap to view details

**Key Flows**:
- Toggle availability → Updates user status in database
- Tap incident card → Navigate to Incident Detail
- Pull to refresh → Reload incidents

### 2. Incoming Emergency Screen

**Purpose**: Full-screen alert when tech receives emergency call

**Content**:
- Large "EWF EMERGENCY" header in red
- Caller ID (if available)
- Site name (if matched)
- Address with map button
- Time received
- Two large action buttons:
  - **Accept** (green, full-width) - Claims incident
  - **Decline** (red, full-width) - Requires reason selection

**Key Flows**:
- Accept → Claims incident, navigates to Incident Detail
- Decline → Shows reason picker modal → Logs decline → Returns to Home
- Deep link from push notification → Opens this screen with incident context

**Decline Reasons**:
- Busy on another call
- Already on call
- Out of area
- Other (requires text input)

### 3. Incident Detail Screen

**Purpose**: Full incident information and status management

**Content**:
- Header with Incident ID and SLA timer
- Status timeline showing:
  - Received timestamp
  - Assigned timestamp
  - En Route timestamp (if applicable)
  - On Site timestamp (if applicable)
  - Resolved timestamp (if applicable)
- Caller Information section:
  - Caller ID
  - Site name
  - Address with map button
- Assigned Tech section:
  - Tech name
  - Contact button (call/text)
- Call Attempts Log (collapsible):
  - Each attempt shows: tech name, time, result
- Internal Notes section (admin only):
  - Read-only notes from admin
- Status Update section:
  - Current status badge
  - Update Status button → Opens status picker
- Close Incident section (only when on-site):
  - Outcome picker
  - Notes text area
  - Follow-up required toggle
  - Submit button

**Key Flows**:
- Update Status → Shows status picker modal → Updates incident status
- Close Incident → Validates outcome/notes → Marks resolved → Returns to Home
- View Map → Opens native maps app with address
- Contact Tech → Opens native phone/SMS

**Status Options**:
- Open
- En Route
- On Site
- Resolved
- Follow-up Required

**Outcome Options** (for closing):
- Nuisance call
- Device issue
- Panel trouble
- Unknown
- Other (requires text input)

### 4. Admin Web Board (Web Interface)

**Purpose**: Live monitoring and manual control for dispatchers/managers

**Content**:
- Header with filters:
  - Status filter (All, Open, En Route, On Site, Unclaimed)
  - Critical only toggle
  - Search by incident ID or site
- Live incidents table with columns:
  - Incident ID
  - Received Time
  - SLA Timer (color-coded: green <5min, yellow 5-10min, red >10min)
  - Caller ID
  - Site
  - Status
  - Assigned Tech (or "UNCLAIMED" badge)
  - Routing Step (current ladder position)
  - Missed/Declined indicators
  - Actions dropdown
- Incident detail panel (slides in from right):
  - Full incident details
  - Call attempts log
  - Admin actions:
    - Assign/Reassign tech (dropdown)
    - Force escalate (moves to next ladder step)
    - Mark critical (highlights in red)
    - Add internal note
    - Close incident

**Key Flows**:
- Click incident row → Opens detail panel
- Assign tech → Shows tech picker → Updates incident
- Force escalate → Triggers routing engine to call next tech
- Mark critical → Updates incident flag, shows red highlight
- Add note → Text input → Saves to incident_events

### 5. Configuration Panel (Admin Web)

**Purpose**: System configuration for business hours, ring duration, and ladder order

**Content**:
- Business Hours section:
  - Days of week checkboxes
  - Start time picker
  - End time picker
  - Timezone selector
- Ring Duration section:
  - Ring duration slider (15-60 seconds)
- Ladder Order section:
  - Business Hours ladder:
    - Drag-and-drop list: Primary On-Call, Secondary, Admin, Manager
  - After Hours ladder:
    - Drag-and-drop list: Primary On-Call, Secondary, Manager, Admin, Rotating Pool
- Rotating Pool section:
  - List of eligible techs with checkboxes
  - Current rotation pointer indicator
- Save Changes button

**Key Flows**:
- Edit hours → Updates config in database
- Drag ladder steps → Reorders routing priority
- Toggle tech in pool → Updates eligible_pool
- Save → Validates and persists all changes

## Typography

- **Headers**: SF Pro Display Bold, 28-34pt
- **Body**: SF Pro Text Regular, 16-17pt
- **Captions**: SF Pro Text Regular, 13-14pt
- **Buttons**: SF Pro Text Semibold, 16-17pt

## Spacing

- Screen padding: 16px
- Card padding: 16px
- Section spacing: 24px
- Element spacing: 12px
- Tight spacing: 8px

## Interaction Patterns

- **Primary Actions**: Large buttons with scale feedback (0.97) and haptic
- **Secondary Actions**: Text buttons with opacity feedback
- **List Items**: Tap with opacity feedback (0.7)
- **Toggles**: Haptic feedback on state change
- **Pull to Refresh**: Standard iOS behavior

## Navigation Structure

```
Tab Bar (Tech App):
├── Home (house.fill)
└── Profile (person.fill) [future]

Modals:
├── Incoming Emergency (full-screen)
├── Status Picker (bottom sheet)
├── Decline Reason Picker (bottom sheet)
└── Close Incident (bottom sheet)

Web Routes:
├── /admin/board (main dashboard)
└── /admin/config (configuration panel)
```

## Push Notification Strategy

- **Emergency Call**: High priority, sound + vibration, deep link to Incoming Emergency screen
- **Incident Assigned**: Medium priority, sound, deep link to Incident Detail
- **Incident Updated**: Low priority, silent, deep link to Incident Detail
- **Unclaimed Alert** (admin): High priority, sound, deep link to admin board

## Offline Behavior

- Status updates queued in AsyncStorage
- Retry on network reconnection
- Show "Offline" indicator in header
- Allow viewing cached incidents
- Prevent new actions until online

## Accessibility

- VoiceOver labels for all interactive elements
- Dynamic Type support for text scaling
- High contrast mode support
- Haptic feedback for critical actions
- Large tap targets (minimum 44x44pt)
