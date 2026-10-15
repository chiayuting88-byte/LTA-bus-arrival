# Prompt History & Build Log

This document records the user prompts and requirements executed during the creation and development of the **Singapore Bus Arrival & Real-Time Fleet Tracker** application.

---

## 1. Initial Prompt: Frontend Architecture & Real-Time Transit App

**Date & Time**: 2026-10-14 23:39 (UTC-7)

### Prompt Text
> build a singapore based bus arrival time application that tracks real time bus locations and provides accurate wait time predictions for all LTS bus stops.
> 
> build just the front end for now, i will include the backend connection later.

### Implemented Scope
- **3-Tier Bus Arrival Board**: Implemented predictions for 1st Bus, 2nd Bus, and 3rd Bus with live countdown seconds, deck type (`SD`, `DD`, `BD`), wheelchair accessibility (`WAB`), and official LTA crowdedness indicators (`SEA` Seats Available, `SDA` Standing Available, `LSD` Limited Standing).
- **Interactive Singapore Fleet Map**: Interactive Leaflet map with custom Singapore bus SVG markers, bearing-based heading rotation, real-time approach telemetry, speed in km/h, and route traces.
- **Search & Geolocation**: 5-digit bus stop code search (e.g. `01012`, `03011`), MRT stations, road names, and browser GPS "Near Me" locator using the Haversine formula.
- **Route Timelines & Schedules**: Stop sequence explorer with operating hours and headway intervals for major Singapore bus services (Bus 65, 190, 147, 10, 143, 960).
- **Commuter Utilities**: Star/favorite bus stops saved in browser localStorage, 2-minute arrival reminder alert, and LTA legend reference guide.

---

## 2. Remote Repository Push & Git Setup

**Date & Time**: 2026-10-14 23:49 (UTC-7)

### Prompt Text
> git push https://<GITHUB_TOKEN>@github.com/chiayuting88-byte/LTA-bus-arrival.git

### Implemented Scope
- Initialized local Git repository and configured commit metadata for `chiayuting88-byte`.
- Committed all initial project files to branch `main`.
- Pushed branch to remote `https://github.com/chiayuting88-byte/LTA-bus-arrival.git`.
- Sanitized local Git remote URL configuration to prevent storing the personal access token in plain text.

---

## 3. Serverless LTA Datamall v3 Integration

**Date & Time**: 2026-10-15 00:06 (UTC-7)

### Prompt Text
> add a serverless connection that pulls live data from LTA Datamall using the following endpoints:
> 
> - store this in /api folder (project root level) not the src folder
> - include /health.ts and /busarrival.ts within that subfolder
> - do not hardcode any key, I will include them later
> 
> GET https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=83139
> # AccountKey: <LTA_ACCOUNT_KEY>
> # accept: application/json

### Implemented Scope
- Created `/api/health.ts` for service health verification and key status check.
- Created `/api/busarrival.ts` targeting `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival` with query parameters `BusStopCode` and `ServiceNo`.
- Configured dynamic credential resolution from `process.env.LTA_ACCOUNT_KEY` (or request header `AccountKey`) with zero hardcoded credentials.
- Updated `server.ts` to mount `/api/health` and `/api/busarrival` alongside Vite dev middlewares.
- Added `LTA_ACCOUNT_KEY` placeholder documentation to `/.env.example`.
- Updated the frontend `busService.ts` and `BackendConfigModal.tsx` to automatically query the `/api/busarrival` serverless endpoint.

---

## 4. Git Push (Serverless Updates)

**Date & Time**: 2026-10-15 00:15 (UTC-7)

### Prompt Text
> git push

### Implemented Scope
- Committed the serverless endpoints and backend proxy files (`api/health.ts`, `api/busarrival.ts`, `server.ts`, `.env.example`, `package.json`, and client services).
- Pushed commit `4ea9d63` to `origin/main`.
- Verified branch synchronization with remote GitHub repository.

---

## 5. Collate Prompts

**Date & Time**: 2026-10-15 00:54 (UTC-7)

### Prompt Text
> collate the prompt that you have written thus far and store them in prompt.md file

### Implemented Scope
- Collated and documented all project prompts, chronologically detailing instructions, architectural requirements, and execution results into `prompt.md`.
