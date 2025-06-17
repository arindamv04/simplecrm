# PCB Company CRM - Execution Plan

## Project Overview
Develop a web-based CRM system specifically designed for a PCB (Printed Circuit Board) manufacturing company to manage prospects, customers, communications, and opportunities. The system will start as a simple Node.js application with SQLite database and can later be migrated to more robust solutions.

## Architecture Overview

### Technology Stack
- **Backend**: Node.js with Express.js
- **Database**: SQLite (for simplicity and portability)
- **Frontend**: Pure HTML/CSS/JavaScript (no frameworks to keep it simple)
- **Containerization**: Docker & Docker Compose (for easy deployment)
- **Development Tools**: Nodemon (for development hot-reload)

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (HTML/CSS/JS) │◄──►│   (Node.js)     │◄──►│   (SQLite)      │
│   - Dashboard   │    │   - Express API │    │   - accounts    │
│   - Accounts    │    │   - CRUD ops    │    │   - contacts    │
│   - Contacts    │    │   - Data valid. │    │   - comms       │
│   - Reports     │    │   - Business    │    │   - opps        │
└─────────────────┘    │     logic       │    └─────────────────┘
                       └─────────────────┘
```

### Database Schema
```sql
accounts (
  account_id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  industry TEXT,
  company_size TEXT,
  location TEXT,
  website TEXT,
  account_status TEXT DEFAULT 'Prospect',
  source TEXT,
  revenue_potential REAL,
  decision_timeline TEXT,
  technical_requirements TEXT,
  current_supplier TEXT,
  account_owner TEXT,
  last_contact DATE,
  next_followup DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

contacts (
  contact_id TEXT PRIMARY KEY,
  account_id TEXT,
  first_name TEXT,
  last_name TEXT,
  title TEXT,
  email TEXT,
  phone TEXT,
  primary_contact BOOLEAN DEFAULT 0,
  decision_maker BOOLEAN DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(account_id)
)

communications (
  comm_id TEXT PRIMARY KEY,
  account_id TEXT,
  contact_id TEXT,
  comm_date DATE,
  comm_type TEXT,
  direction TEXT,
  subject TEXT,
  summary TEXT,
  next_steps TEXT,
  followup_required BOOLEAN DEFAULT 0,
  followup_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(account_id),
  FOREIGN KEY (contact_id) REFERENCES contacts(contact_id)
)

opportunities (
  opp_id TEXT PRIMARY KEY,
  account_id TEXT,
  opp_name TEXT,
  stage TEXT,
  value REAL,
  probability INTEGER,
  expected_close DATE,
  requirements TEXT,
  competition TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(account_id)
)
```

## Development Phases

### Phase 1: Project Setup & Core Infrastructure
**Duration**: 1-2 hours
**Deliverables**: Project structure, dependencies, basic server

### Phase 2: Database Layer
**Duration**: 2-3 hours
**Deliverables**: Database schema, connection management, CRUD operations

### Phase 3: Backend API Development
**Duration**: 3-4 hours
**Deliverables**: RESTful API endpoints, validation, error handling

### Phase 4: Frontend Core Pages
**Duration**: 4-5 hours
**Deliverables**: HTML pages, CSS styling, basic JavaScript functionality

### Phase 5: Advanced Features
**Duration**: 2-3 hours
**Deliverables**: Search, filtering, duplicate detection, data validation

### Phase 6: Testing & Deployment
**Duration**: 2-3 hours
**Deliverables**: Docker setup, testing, deployment documentation

## Detailed Implementation Steps

### Step 1: Project Initialization
```bash
mkdir pcb-crm
cd pcb-crm
npm init -y
npm install express sqlite3 cors
npm install --save-dev nodemon
```

**Files to create:**
- `package.json` (update scripts)
- `server.js` (main server file)
- `database.js` (database abstraction layer)
- `public/` directory structure

### Step 2: Database Implementation
**Create database.js with:**
- SQLite connection management
- Table initialization
- CRUD methods for each entity
- ID generation utilities
- Data validation methods
- Duplicate detection logic

### Step 3: API Endpoints Implementation
**RESTful API structure:**
```
GET    /api/accounts           # List all accounts
POST   /api/accounts           # Create new account
GET    /api/accounts/:id       # Get specific account
PUT    /api/accounts/:id       # Update account
DELETE /api/accounts/:id       # Delete account

GET    /api/contacts           # List all contacts
POST   /api/contacts           # Create new contact
GET    /api/contacts/:id       # Get specific contact
PUT    /api/contacts/:id       # Update contact
DELETE /api/contacts/:id       # Delete contact

GET    /api/communications     # List all communications
POST   /api/communications     # Create new communication
GET    /api/communications/:id # Get specific communication
PUT    /api/communications/:id # Update communication
DELETE /api/communications/:id # Delete communication

GET    /api/opportunities      # List all opportunities
POST   /api/opportunities      # Create new opportunity
GET    /api/opportunities/:id  # Get specific opportunity
PUT    /api/opportunities/:id  # Update opportunity
DELETE /api/opportunities/:id  # Delete opportunity

GET    /api/dashboard          # Dashboard statistics
GET    /api/search             # Search across entities
```

### Step 4: Frontend Development
**Pages to create:**
1. `index.html` - Dashboard with statistics and recent activity
2. `accounts.html` - Account management with CRUD operations
3. `contacts.html` - Contact management
4. `communications.html` - Communication logging
5. `opportunities.html` - Opportunity tracking
6. `reports.html` - Basic reporting

**Shared components:**
- Navigation header
- Modal dialogs for forms
- Data tables with sorting/filtering
- Status badges and indicators

### Step 5: Advanced Features
- **Search functionality**: Cross-entity search
- **Duplicate detection**: Warn when creating similar accounts
- **Data validation**: Client and server-side validation
- **Export functionality**: CSV export for data backup
- **Responsive design**: Mobile-friendly interface

### Step 6: Containerization & Deployment
**Docker setup:**
- `Dockerfile` for the application
- `docker-compose.yml` for easy deployment
- Environment configuration
- Volume mapping for database persistence

## Special Instructions for Claude Code

### Code Organization
1. **Modular structure**: Keep database operations, API routes, and business logic separated
2. **Error handling**: Implement comprehensive error handling at all levels
3. **Validation**: Validate all inputs both client and server side
4. **Logging**: Add console logging for debugging and monitoring
5. **Comments**: Add clear comments explaining business logic

### Key Implementation Notes
1. **ID Generation**: Use timestamp-based IDs (A001, C001, COM001, OPP001)
2. **Date Handling**: Use YYYY-MM-DD format for consistency
3. **Status Management**: Use predefined status lists with dropdowns
4. **Duplicate Prevention**: Check for similar company names before creating accounts
5. **Responsive Design**: Ensure mobile compatibility
6. **Data Integrity**: Implement foreign key constraints and cascade operations

### Testing Approach
1. **Manual Testing**: Test each CRUD operation
2. **Data Validation**: Test form validation and error messages
3. **Edge Cases**: Test with empty data, invalid inputs, and duplicate entries
4. **Browser Compatibility**: Test in Chrome, Firefox, Safari
5. **Mobile Testing**: Test responsive design on mobile devices

## Development Checklist

### ✅ Phase 1: Project Setup
- [ ] Initialize npm project
- [ ] Install dependencies (express, sqlite3, cors, nodemon)
- [ ] Create basic project structure
- [ ] Set up package.json scripts
- [ ] Create basic server.js with Express setup
- [ ] Test server startup

### ✅ Phase 2: Database Layer
- [ ] Create database.js with SQLite connection
- [ ] Implement table creation (accounts, contacts, communications, opportunities)
- [ ] Add ID generation methods
- [ ] Implement CRUD methods for accounts
- [ ] Implement CRUD methods for contacts
- [ ] Implement CRUD methods for communications
- [ ] Implement CRUD methods for opportunities
- [ ] Add duplicate detection logic
- [ ] Test database operations

### ✅ Phase 3: Backend API
- [ ] Set up Express middleware (cors, json parser, static files)
- [ ] Implement accounts API endpoints (GET, POST, PUT, DELETE)
- [ ] Implement contacts API endpoints
- [ ] Implement communications API endpoints
- [ ] Implement opportunities API endpoints
- [ ] Add dashboard statistics endpoint
- [ ] Add search endpoint
- [ ] Implement error handling middleware
- [ ] Test all API endpoints with Postman/curl

### ✅ Phase 4: Frontend Core
- [ ] Create base HTML template with navigation
- [ ] Implement CSS styling (responsive, modern design)
- [ ] Create dashboard page (index.html)
- [ ] Create accounts management page
- [ ] Implement account form modal
- [ ] Add accounts table with sorting
- [ ] Create contacts management page
- [ ] Create communications logging page
- [ ] Create opportunities tracking page
- [ ] Implement JavaScript for API interactions
- [ ] Add form validation
- [ ] Test all pages functionality

### ✅ Phase 5: Advanced Features
- [ ] Implement search functionality
- [ ] Add filtering and sorting options
- [ ] Implement duplicate warning system
- [ ] Add data export functionality
- [ ] Implement status-based filtering
- [ ] Add follow-up reminders
- [ ] Create basic reporting views
- [ ] Add data visualization (charts)
- [ ] Implement mobile responsive design
- [ ] Test advanced features

### ✅ Phase 6: Testing & Deployment
- [ ] Create Dockerfile
- [ ] Create docker-compose.yml
- [ ] Test Docker build and deployment
- [ ] Create comprehensive README.md
- [ ] Test full application workflow
- [ ] Test data persistence
- [ ] Test error scenarios
- [ ] Performance testing with sample data
- [ ] Security review (input validation, SQL injection prevention)
- [ ] Final user acceptance testing

### ✅ Documentation & Cleanup
- [ ] Update README with setup instructions
- [ ] Document API endpoints
- [ ] Create user manual
- [ ] Clean up code comments
- [ ] Remove debugging console.logs
- [ ] Optimize CSS and JavaScript
- [ ] Create backup/restore procedures
- [ ] Document deployment process

## File Structure
```
pcb-crm/
├── package.json
├── server.js
├── database.js
├── routes/
│   ├── accounts.js
│   ├── contacts.js
│   ├── communications.js
│   └── opportunities.js
├── public/
│   ├── index.html
│   ├── accounts.html
│   ├── contacts.html
│   ├── communications.html
│   ├── opportunities.html
│   ├── reports.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── main.js
│       ├── accounts.js
│       ├── contacts.js
│       ├── communications.js
│       └── opportunities.js
├── docker-compose.yml
├── Dockerfile
├── .dockerignore
├── .gitignore
└── README.md
```

## Success Criteria
1. **Functional**: All CRUD operations work correctly
2. **User-friendly**: Intuitive interface with clear navigation
3. **Responsive**: Works on desktop and mobile devices
4. **Reliable**: Handles errors gracefully
5. **Performant**: Fast response times even with hundreds of records
6. **Deployable**: Easy to deploy using Docker
7. **Maintainable**: Clean, well-documented code

## Future Enhancement Opportunities
1. **Authentication**: User login and role-based access
2. **Email Integration**: Send emails directly from the CRM
3. **Calendar Integration**: Schedule follow-ups
4. **File Attachments**: Attach documents to accounts
5. **Advanced Reporting**: Custom reports and analytics
6. **API Integration**: Connect with accounting software
7. **Mobile App**: Native mobile application
8. **Real-time Notifications**: WebSocket-based updates

## Risk Mitigation
1. **Data Loss**: Regular database backups
2. **Concurrent Access**: Implement proper locking mechanisms
3. **Scalability**: Design for easy migration to PostgreSQL/MySQL
4. **Security**: Input validation and parameterized queries
5. **Browser Compatibility**: Test on multiple browsers
6. **Performance**: Implement pagination for large datasets

---

**Note for Claude Code**: This execution plan should be followed sequentially. Update the checklist as you complete each item. Focus on getting each phase working completely before moving to the next phase. Test thoroughly at each step.