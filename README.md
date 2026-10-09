*# JobTrack — Job Application Tracker*



*JobTrack is a MERN stack web application that helps job seekers organize, track, and manage their job applications from one place. It provides a dashboard, application management, search and filtering, and status tracking throughout the recruitment process.*



*## Features*



*- \*\*Dashboard:\*\* View application statistics and recent applications.*

*- \*\*Application Management:\*\* Create, view, edit, and delete job applications.*

*- \*\*Status Tracking:\*\* Track applications as Applied, Assessment, Interview, Selected, or Rejected.*

*- \*\*Search:\*\* Find applications using relevant search terms.*

*- \*\*Filtering:\*\* Filter applications by status and job type.*

*- \*\*Sorting:\*\* Sort applications by application date.*

*- \*\*Application Details:\*\* Store company, job title, location, job type, application date, job URL, status, and notes.*

*- \*\*Form Validation:\*\* Validate required fields and display meaningful errors.*

*- \*\*User Feedback:\*\* Display toast notifications and confirmation dialogs.*

*- \*\*REST API:\*\* Use an Express API connected to MongoDB.*



*## Tech Stack*



*\*\*Frontend\*\**

*- React 18*

*- Vite*

*- React Router DOM*

*- JavaScript*

*- CSS*

*- Vitest and React Testing Library*



*\*\*Backend\*\**

*- Node.js*

*- Express.js*

*- MongoDB*

*- Mongoose*

*- JavaScript*

*- Vitest and Supertest*



*## Project Structure*



*```text*

*job-track/*

*├── client/*

*│   ├── src/*

*│   │   ├── components/*

*│   │   ├── hooks/*

*│   │   ├── pages/*

*│   │   ├── services/*

*│   │   └── setupTests.js*

*│   ├── .env.example*

*│   ├── package.json*

*│   └── vite.config.js*

*├── server/*

*│   ├── config/*

*│   ├── controllers/*

*│   ├── middleware/*

*│   ├── models/*

*│   ├── routes/*

*│   ├── .env.example*

*│   ├── package.json*

*│   └── server.js*

*├── .gitignore*

*└── README.md*

*```*



*## Prerequisites*



*Install the following before running the application:*



*- Node.js and npm*

*- MongoDB running locally, or an accessible MongoDB instance*

*- Git (optional, for cloning the repository)*



*## Getting Started*



*### 1. Clone the repository*



*```bash*

*git clone https://github.com/Ranjithkumar352/jobtrack.git*

*cd jobtrack*

*```*



*Replace `<YOUR\_GITHUB\_REPOSITORY\_URL>` with your repository URL.*



*### 2. Configure the backend*



*Open a terminal in the project root and run:*



*```powershell*

*cd server*

*npm install*

*Copy-Item .env.example .env*

*```*



*Edit `server/.env` with your local configuration:*



*```env*

*PORT=5000*

*MONGODB\_URI=mongodb://localhost:27017/jobtrack*

*NODE\_ENV=development*

*CORS\_ORIGIN=http://localhost:5173*

*```*



*Ensure MongoDB is running and the connection string points to your database.*



*Start the backend development server:*



*```bash*

*npm run dev*

*```*



*The backend runs at `http://localhost:5000` by default.*



*### 3. Configure the frontend*



*Open a \*\*second terminal\*\* in the project root:*



*```powershell*

*cd client*

*npm install*

*Copy-Item .env.example .env*

*```*



*The default `client/.env` configuration is:*



*```env*

*VITE\_API\_URL=http://localhost:5000*

*```*



*Start the frontend development server:*



*```bash*

*npm run dev*

*```*



*Vite displays the local frontend URL, typically `http://localhost:5173`.*



*### 4. Open JobTrack*



*Open `http://localhost:5173` in your browser. Keep both the backend and frontend development servers running.*



*## Environment Variables*



*### Backend — `server/.env`*



*| Variable | Description | Example |*

*|---|---|---|*

*| `PORT` | Backend server port | `5000` |*

*| `MONGODB\_URI` | MongoDB connection string | `mongodb://localhost:27017/jobtrack` |*

*| `NODE\_ENV` | Runtime environment | `development` |*

*| `CORS\_ORIGIN` | Allowed frontend origin | `http://localhost:5173` |*



*### Frontend — `client/.env`*



*| Variable | Description | Example |*

*|---|---|---|*

*| `VITE\_API\_URL` | Base URL for the backend API | `http://localhost:5000` |*



*Do not commit actual `.env` files or credentials. Use the supplied `.env.example` files as configuration templates.*



*## API Endpoints*



*The backend exposes the following REST API endpoints.*



*| Method | Endpoint | Description |*

*|---|---|---|*

*| `GET` | `/api/health` | Check API health |*

*| `GET` | `/api/applications` | List applications; supports search, filtering, and sorting |*

*| `GET` | `/api/applications/:id` | Retrieve an application by ID |*

*| `POST` | `/api/applications` | Create an application |*

*| `PUT` | `/api/applications/:id` | Update an application |*

*| `DELETE` | `/api/applications/:id` | Delete an application |*

*| `GET` | `/api/dashboard/stats` | Retrieve dashboard statistics |*



*### Example requests*



*Check API health:*



*```http*

*GET http://localhost:5000/api/health*

*```*



*Retrieve applications:*



*```http*

*GET http://localhost:5000/api/applications*

*```*



*Create an application:*



*```http*

*POST http://localhost:5000/api/applications*

*Content-Type: application/json*

*```*



*```json*

*{*

&#x20; *"companyName": "Example Corp",*

&#x20; *"jobTitle": "Frontend Developer",*

&#x20; *"location": "Hyderabad",*

&#x20; *"jobType": "Internship",*

&#x20; *"applicationDate": "2026-10-09",*

&#x20; *"status": "Applied",*

&#x20; *"jobUrl": "https://example.com/jobs/123",*

&#x20; *"notes": "Applied through the company website"*

*}*

*```*



*Application fields and accepted enum values are validated by the backend.*



*## Testing*



*### Frontend tests*



*From the `client` directory:*



*```bash*

*npm test*

*```*



*The frontend test suite covers API service behavior, status badges, toast notifications, confirmation dialogs, and add/edit application flows.*



*### Frontend production build*



*From the `client` directory:*



*```bash*

*npm run build*

*```*



*To preview the production build locally:*



*```bash*

*npm run preview*

*```*



### Backend verification

The backend API was manually verified against the running MongoDB-backed server.

Verified endpoints:
- `GET /api/health`
- `GET /api/applications`
- `GET /api/dashboard/stats`

Automated backend test files have not yet been added.





*## Development Workflow*



## AI Development Tool: Kiro

**Selected Tool:** Kiro

Kiro was used during the initial planning and specification phase of JobTrack. Its spec-driven workflow helped organize project requirements, application design, and implementation tasks. After reaching the available usage limit, development continued through hands-on coding, debugging, and separate AI-assisted guidance.

### Specific Tasks Completed Using Kiro

1. **Requirements definition:** Organized requirements for job application management, status tracking, search, and filtering.
2. **Application design:** Prepared the design specification for the MERN stack application.
3. **Implementation planning:** Organized development work into smaller tasks using the project task specification.

### Development and Testing Experience

The frontend test suite completed with 39 passing tests, and the Vite production build succeeded. The backend health, applications list, and dashboard statistics endpoints were manually verified.

This workflow helped organize development, troubleshoot issues, and verify the implementation before submission.



*## Scope*



*JobTrack focuses on job application management and recruitment progress tracking. Authentication, payments, and deployment are outside the current project scope.*



*## License*



*This project was created as a software development assignment. Add a license if you intend to distribute it publicly.*



