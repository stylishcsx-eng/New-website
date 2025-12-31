# shadowzm: Zombie reverse - CS 1.6 Server Hub

## Project Overview
A full-stack web application for managing a Counter-Strike 1.6 game server community.

## Architecture
- **Frontend**: React with Tailwind CSS (dark tactical theme)
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **External**: AMXBans MySQL integration (optional)

## User Personas
1. **Players**: View server status, rankings, rules, apply for admin
2. **Admins**: Manage applications, bans, users

## Core Requirements
- [x] Home page with live server status
- [x] Live server querying via python-a2s
- [x] Player registration & login
- [x] Private admin login (Stylish/Itachi1849)
- [x] Server Status page (real-time)
- [x] Rankings page (Top 15)
- [x] Banlist page with search
- [x] Rules page
- [x] Apply for Admin (once per month limit)
- [x] Admin Panel (Applications, Users, Bans tabs)
- [x] On-site notifications for application status
- [x] AMXBans MySQL sync (requires remote MySQL access)

## What's Been Implemented (Dec 29, 2025)
1. Full React frontend with dark tactical theme
2. FastAPI backend with JWT authentication
3. MongoDB models for Users, Bans, Players, Applications, Notifications
4. Live CS 1.6 server status via python-a2s
5. Admin panel with approve/reject notifications
6. Monthly application limit enforcement
7. AMXBans integration (ready, needs MySQL remote access)

## API Endpoints
- `GET /api/server-status` - Live server status
- `GET /api/dashboard/stats` - Statistics
- `GET /api/rankings/top` - Top players
- `GET /api/bans` - Banlist
- `POST /api/auth/register` - Player registration
- `POST /api/auth/login` - Player login
- `POST /api/auth/admin-login` - Admin login
- `GET/POST /api/admin-applications` - Admin applications
- `GET /api/notifications` - User notifications
- `POST /api/bans/sync-amxbans` - Sync from AMXBans

## Prioritized Backlog

### P0 (Critical)
- [x] Live server status
- [x] Admin authentication
- [x] Player registration

### P1 (High)
- [x] Application notifications
- [x] Once-per-month application limit
- [ ] AMXBans MySQL connection (requires MySQL server config)

### P2 (Medium)
- [ ] Email notifications (optional)
- [ ] More detailed player profiles
- [ ] Server statistics over time

## VPS Deployment
See `/app/VPS_DEPLOYMENT_GUIDE.md` for full instructions.

## Next Tasks
1. Configure MySQL server to allow remote connections for AMXBans
2. Deploy to VPS following the deployment guide
3. Optional: Add email notifications via SendGrid/Resend
