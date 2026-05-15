# System Architecture

## Overview

SARP uses a modern three-tier architecture with containerized services for easy deployment and scalability.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                           CLIENT                                 │
│                      (Web Browser)                              │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                    HTTP/HTTPS Requests
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
   ┌────▼──────────┐           ┌──────────▼──────┐
   │  FRONTEND     │           │   API GATEWAY   │
   │  (React)      │           │  (Express.js)   │
   │               │           │                 │
   │ - Dashboard   │           │ - Auth Routes   │
   │ - Components  │           │ - Issue Routes  │
   │ - Services    │           │ - Ambulance     │
   │ - Context API │           │ - Admin Routes  │
   │ - Maps        │           │ - Feedback      │
   └───────────────┘           └────────┬────────┘
                                        │
                          RESTful API Calls
                                        │
                     ┌──────────────────┴──────────────────┐
                     │                                     │
              ┌──────▼────────┐              ┌────────────▼────────┐
              │  SUPABASE     │              │  AUTHENTICATION     │
              │  (PostgreSQL) │              │  (JWT + Supabase)   │
              │               │              │                     │
              │ - Users       │              │ - User login        │
              │ - Issues      │              │ - Role verification │
              │ - Ambulances  │              │ - Token validation  │
              │ - Feedback    │              └─────────────────────┘
              │ - Real-time   │
              │   sync        │
              └───────────────┘
```

## Technology Stack

### Frontend Layer
- **Framework**: React 18+ (Client-side rendering)
- **State Management**: Context API
- **Styling**: CSS Modules
- **Build Tool**: Vite
- **Maps**: Leaflet.js for location visualization
- **HTTP Client**: Axios for API requests

### Backend Layer
- **Runtime**: Node.js
- **Framework**: Express.js
- **Authentication**: JWT (JSON Web Tokens)
- **Middleware**: 
  - CORS for cross-origin requests
  - Body parser for JSON/urlencoded data
  - Custom auth middleware
- **Architecture**: REST API with service layer pattern

### Data Layer
- **Database**: PostgreSQL (via Supabase)
- **Real-time**: Supabase real-time subscriptions
- **Authentication**: Supabase Auth
- **Security**: Row-level security (RLS) policies

## Deployment Infrastructure

### Containerization
- **Docker**: Each service has its own Dockerfile
- **Docker Compose**: Orchestrates multi-container deployment
- **Networking**: Bridge network for inter-service communication

### Container Services
1. **Backend Container**
   - Base image: Node.js Alpine
   - Port: 5000 (internal) → 5001 (host)
   - Environment: .env file based configuration

2. **Frontend Container**
   - Base image: Nginx Alpine
   - Port: 80 (internal) → 3000 (host)
   - Static file serving with SPA routing

## Data Flow

### Request Flow (User Action → Response)
```
User Action → Frontend Component
    ↓
API Request (axios)
    ↓
Express.js Route Handler
    ↓
Authentication Middleware
    ↓
Service Layer (Business Logic)
    ↓
Database Query (Supabase)
    ↓
Response JSON
    ↓
Frontend State Update (Context)
    ↓
UI Re-render
```

### Real-time Updates
```
Database Change (Supabase)
    ↓
Real-time Subscription
    ↓
Frontend Listener
    ↓
State Update
    ↓
UI Re-render (without page refresh)
```

## Security Architecture

### Authentication Flow
```
1. User Login (email + password)
2. Supabase Auth validates credentials
3. JWT token generated
4. Token stored in localStorage
5. Token sent with API requests (Authorization header)
6. Backend validates JWT signature
7. User identity established for request
8. Authorization check (role-based)
9. Request processed with user context
```

### Authorization Levels
- **Superuser/Admin**: Full system access
- **Ambulance Driver**: Ambulance management + issue updates
- **Citizen**: Report issues + view status
- **Guest**: Limited read-only access

## Database Schema Overview

### Core Tables
- **Users**: Admin, ambulance drivers, citizens
- **Issues**: Road problems reported by users
- **Ambulances**: Ambulance fleet and status
- **Feedback**: User feedback and ratings
- **Audit Log**: Track all admin actions

### Relationships
```
Users (1) ──→ (many) Issues
Users (1) ──→ (many) Feedback
Issues (many) ──→ (1) Ambulances
Ambulances (1) ──→ (many) Issues
```

## Scalability Considerations

### Horizontal Scaling
- **Stateless API**: Enables multiple backend instances
- **Load Balancer**: Distribute traffic
- **Database Connection Pool**: Manage connections efficiently

### Performance Optimization
- **Caching**: Frontend caching of static assets
- **Lazy Loading**: Components loaded on demand
- **API Response Compression**: Gzip enabled
- **Database Indexing**: Optimized queries
- **Real-time Subscriptions**: Efficient WebSocket usage

## Deployment Environments

### Local Development
```bash
docker-compose up
```

### Production Deployment
- Docker images pushed to container registry
- Kubernetes orchestration (optional)
- CI/CD pipeline for automated deployment
- Environment-specific configurations

## Monitoring & Logging

### Application Logs
- Frontend: Browser console logs
- Backend: Server-side logging (Express)
- Database: Supabase query logs

### Health Checks
- API endpoint health verification
- Database connectivity checks
- Service uptime monitoring

---

**Last Updated**: May 16, 2026

