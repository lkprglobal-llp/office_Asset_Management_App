# LKPR Office Asset & Expense Management System

## Overview

This is a web-based Office Asset & Expense Management System designed to track office assets, manage borrowing of equipment, and handle employee expense requests. The system provides role-based access control with three user types: Admin, Manager, and Employee. Key features include asset tracking with availability status, a borrowing checkout/return system with due date tracking, and an expense request workflow with approval and payment tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**: Vanilla JavaScript, HTML5, CSS3

- No frontend framework is used; the application relies on pure JavaScript for DOM manipulation
- Client-side routing is handled through static HTML pages (dashboard.html, assets.html, borrow.html, expenses.html, reports.html)
- All business logic runs in the browser using localStorage as the data persistence layer

**Design Pattern**: Multi-page application (MPA)

- Each feature has a dedicated HTML page with its own JavaScript module
- Shared utilities (auth, formatting) are extracted into utils.js
- Common styling is centralized in style.css

**Rationale**: This approach was chosen for simplicity and ease of development without build tools. It allows for rapid prototyping and modification without requiring a compilation step. The downside is potential code duplication and lack of component reusability.

### Authentication & Authorization

**Mechanism**: Client-side authentication with localStorage

- User credentials are validated against hardcoded demo users in auth.js
- Current user session is stored in localStorage as JSON
- Role-based access control (RBAC) is enforced in JavaScript on each page load

**User Roles**:

- **Admin**: Full access to asset management (create, edit, delete assets)
- **Manager**: Can approve/reject expense requests and view all reports
- **Employee**: Can borrow items and submit expense requests

**Security Consideration**: This is a demo/prototype implementation. In production, authentication should be moved server-side with JWT tokens or session cookies, and sensitive operations should be validated on the backend.

### Data Storage

**Current Implementation**: Browser localStorage

- All data (assets, borrowings, expenses, users) is stored as JSON in localStorage
- Data persists only in the current browser and is not shared across devices
- No server-side database is currently implemented

**Data Models**:

- **Assets**: id, name, category, description, status (Available/Borrowed)
- **Borrowings**: id, assetId, assetName, borrowerUsername, borrowerName, borrowDate, dueDate, purpose, status (Borrowed/Returned)
- **Expenses**: id, date, employeeUsername, employeeName, type, amount, description, status (Pending/Approved/Rejected), paymentStatus (Pending Payment/Paid)

**Migration Path**: The application is structured to allow easy migration to a backend database. All data operations are isolated in specific functions that can be converted to API calls. A backend with Express.js (already included as a dependency) and a database like PostgreSQL could be added without major frontend refactoring.

### Backend Architecture

**Current State**: Minimal Express.js server

- server.js provides a basic static file server on port 5000
- Serves the public directory containing all HTML, CSS, and JavaScript files
- No API endpoints are currently implemented
- No database connection exists

**Future Architecture**: RESTful API with Express.js

- API endpoints would follow REST conventions (GET /api/assets, POST /api/borrowings, etc.)
- Authentication middleware would validate user sessions
- Role-based authorization middleware would restrict access to admin-only routes
- Database queries would replace localStorage operations

### Business Logic

**Asset Management** (Admin only):

- Admins can create, edit, and delete assets
- Assets cannot be deleted while borrowed
- Asset status automatically updates when borrowed or returned

**Borrowing System**:

- Users can only borrow available assets
- Borrowed items track borrower, dates, and purpose
- Overdue detection compares current date with due date
- Return functionality updates both borrowing status and asset availability

**Expense Management**:

- Employees submit expense requests with type, amount, and description
- Managers/Admins review and approve/reject requests
- Approved expenses can be marked as paid
- Filtering and reporting available for managers

**Notification System** (Planned):

- The requirements mention reminder notifications before due dates
- This feature is not yet implemented
- Would require a backend service with scheduled jobs (cron) or push notifications

### Reporting & Export

**Excel Export Functionality**:

- Uses SheetJS (xlsx.js) library for client-side Excel generation
- Can export borrowings log, expense requests, assets list, or all data
- Filtering options for borrowing status (all, borrowed, returned, overdue)
- Export happens entirely in the browser without server involvement

**Rationale**: Client-side export was chosen for simplicity and to avoid backend processing. For large datasets or more complex reports, server-side generation would be more appropriate.

## External Dependencies

### JavaScript Libraries

**SheetJS (xlsx.js) v0.18.5**

- Purpose: Client-side Excel file generation and export
- Used in: reports.html for exporting data to .xlsx format
- Source: CDN (cdnjs.cloudflare.com)

### Node.js Packages

**Express.js v5.1.0**

- Purpose: Web server framework for serving static files
- Current usage: Basic static file server in server.js
- Future usage: RESTful API implementation, routing, middleware

### Planned/Required Integrations

**Database** (Not yet implemented):

- Recommended: PostgreSQL or MySQL
- Purpose: Persistent data storage to replace localStorage
- Would require: Database driver (pg for PostgreSQL, mysql2 for MySQL) and potentially an ORM like Drizzle

**Notification Service** (Not yet implemented):

- Purpose: Send reminder notifications before asset due dates
- Options: Email (nodemailer), SMS (Twilio), or push notifications
- Would require: Backend scheduled job runner (node-cron or similar)

**File Upload Service** (Potential enhancement):

- Purpose: Allow receipt/document uploads for expense requests
- Options: Local file storage or cloud storage (AWS S3, Cloudinary)
- Would require: Multer for file handling, cloud SDK if using cloud storage

### Development Tools

**No build tools or bundlers** are currently used. The application runs directly in the browser without transpilation or bundling. This means:

- No webpack, Vite, or Parcel
- No TypeScript compilation
- No CSS preprocessing
- No module bundling

This simplifies development but limits the use of modern JavaScript features and npm packages in the frontend.
