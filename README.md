# PCB CRM System

A comprehensive Customer Relationship Management system specifically designed for PCB (Printed Circuit Board) manufacturing companies. Built with Node.js, Express, SQLite, and vanilla JavaScript for simplicity and reliability.

## Features

### 🏢 Account Management
- Create, edit, and delete customer/prospect accounts
- Track company information, industry, size, and location
- Monitor account status (Prospect, Customer, Inactive)
- Revenue potential and decision timeline tracking
- Duplicate detection to prevent redundant entries

### 👥 Contact Management
- Manage contacts for each account
- Track contact details, titles, and roles
- Mark primary contacts and decision makers
- Link contacts to specific accounts

### 💬 Communication Logging
- Log all customer interactions (emails, calls, meetings)
- Track communication direction (inbound/outbound)
- Set follow-up reminders
- Detailed communication summaries and next steps

### 💰 Opportunity Tracking
- Create and manage sales opportunities
- Track deal stages and probabilities
- Monitor pipeline value and expected close dates
- Competition and requirement analysis

### 📊 Dashboard & Analytics
- Real-time statistics and KPIs
- Account status breakdown
- Recent activity timeline
- Pipeline value calculations

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: SQLite (portable and lightweight)
- **Frontend**: Pure HTML/CSS/JavaScript (no frameworks)
- **Containerization**: Docker/Podman support
- **Development**: Nodemon for hot-reload

## Quick Start

### Prerequisites
- Docker/Podman installed
- Or Node.js 18+ if running locally

### Option 1: Using Docker/Podman (Recommended)

1. **Clone and navigate to the project**:
   ```bash
   cd SimpleCRM
   ```

2. **Run with Docker Compose**:
   ```bash
   docker-compose up --build
   ```

3. **Or run with Podman Compose** (Fedora users):
   ```bash
   podman-compose up --build
   ```

4. **Access the application**:
   Open http://localhost:3000 in your browser

### Option 2: Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Or start production server**:
   ```bash
   npm start
   ```

## Project Structure

```
SimpleCRM/
├── package.json              # Dependencies and scripts
├── server.js                 # Main Express server
├── database.js               # SQLite database layer
├── routes/                   # API route handlers
│   ├── accounts.js
│   ├── contacts.js
│   ├── communications.js
│   └── opportunities.js
├── public/                   # Frontend files
│   ├── index.html           # Dashboard
│   ├── accounts.html        # Account management
│   ├── contacts.html        # Contact management
│   ├── communications.html  # Communication log
│   ├── opportunities.html   # Opportunity tracking
│   ├── css/
│   │   └── style.css        # Responsive CSS
│   └── js/
│       ├── main.js          # Shared utilities
│       ├── accounts.js      # Account page logic
│       ├── contacts.js      # Contact page logic
│       ├── communications.js # Communication logic
│       └── opportunities.js # Opportunity logic
├── data/                    # Database storage (created automatically)
├── docker-compose.yml       # Container orchestration
├── Dockerfile              # Container definition
└── README.md               # This file
```

## API Endpoints

### Accounts
- `GET /api/accounts` - List all accounts
- `POST /api/accounts` - Create new account
- `GET /api/accounts/:id` - Get specific account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

### Contacts
- `GET /api/contacts` - List all contacts
- `POST /api/contacts` - Create new contact
- `GET /api/contacts/:id` - Get specific contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

### Communications
- `GET /api/communications` - List all communications
- `POST /api/communications` - Create new communication
- `GET /api/communications/:id` - Get specific communication
- `PUT /api/communications/:id` - Update communication
- `DELETE /api/communications/:id` - Delete communication

### Opportunities
- `GET /api/opportunities` - List all opportunities
- `POST /api/opportunities` - Create new opportunity
- `GET /api/opportunities/:id` - Get specific opportunity
- `PUT /api/opportunities/:id` - Update opportunity
- `DELETE /api/opportunities/:id` - Delete opportunity

### Utility
- `GET /api/dashboard` - Dashboard statistics
- `GET /api/search?query=term` - Search across entities
- `GET /health` - Health check

## Database Schema

The system uses SQLite with the following main tables:

- **accounts**: Company information and account details
- **contacts**: Individual contacts linked to accounts
- **communications**: Interaction history and logs
- **opportunities**: Sales pipeline and deal tracking

All tables include proper foreign key relationships and timestamps.

## Features in Detail

### Dashboard
- Real-time statistics cards
- Account status breakdown visualization
- Recent activity feed
- Quick action buttons

### Search & Filtering
- Global search across all entities
- Account-specific filtering
- Stage-based opportunity filtering
- Communication type filtering

### Data Validation
- Client and server-side validation
- Duplicate detection for accounts
- Email format validation
- Required field enforcement

### Responsive Design
- Mobile-friendly interface
- Adaptive layouts for all screen sizes
- Touch-friendly controls

## Configuration

### Environment Variables
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode

### Database
- SQLite database is automatically created on first run
- Database file stored in `./data/pcb_crm.db`
- Persistent storage via Docker volumes

## Development

### Available Scripts
- `npm start`: Start production server
- `npm run dev`: Start development server with auto-reload
- `npm test`: Run tests (placeholder)

### Adding New Features
1. Create database methods in `database.js`
2. Add API routes in `routes/` directory
3. Create frontend pages in `public/`
4. Add JavaScript functionality in `public/js/`

## Production Deployment

### Using Docker
1. Build the image: `docker build -t pcb-crm .`
2. Run with volume: `docker run -p 3000:3000 -v ./data:/app/data:z pcb-crm`

### Using Podman (Fedora/RHEL)
1. Build: `podman build -t pcb-crm .`
2. Run: `podman run -p 3000:3000 -v ./data:/app/data:z pcb-crm`

### Environment Considerations
- Ensure proper SELinux context (`:z`) for volume mounts
- Configure firewall to allow port 3000
- Consider reverse proxy (nginx) for production

## Security

- Input validation on all forms
- Parameterized SQL queries (SQLite3)
- CORS enabled for API access
- No authentication (single-user system)

## Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Troubleshooting

### Port Issues
- Check if port 3000 is available
- Try different port: `PORT=3001 npm start`

### SELinux Issues (Fedora)
- Use `:z` suffix for volume mounts
- Allow network connections: `setsebool -P httpd_can_network_connect 1`

### Container Issues
- Ensure Docker/Podman is running
- Check container logs: `podman logs pcb-crm`

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review container logs
3. Verify API endpoints with curl/Postman
4. Check browser console for JavaScript errors

## Roadmap

Future enhancements could include:
- User authentication and roles
- Email integration
- Advanced reporting
- File attachments
- Calendar integration
- Mobile app
- API rate limiting
- Data export/import