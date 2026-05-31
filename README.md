# Milestone I Submission

## Team Name:
Yinyang

## Proposed Level of Achievement:
Apollo

---

# Motivation
As university students ourselves, we understand how difficult it can be to manage multiple modules, assignments, quizzes, projects, and deadlines at the same time. Important academic tasks are often spread across different platforms such as notes, spreadsheets, calendars, and learning management systems.

This can make planning confusing and stressful, especially when deadlines overlap or when students are unsure of what to prioritise first.

Through ParanoidPlanner, we hope to create a simple academic planning tool that helps students organise their workload in one place. Instead of manually tracking everything across different apps, students can use ParanoidPlanner to manage modules, create tasks, track deadlines, and generate study schedules.

In the process of building this project, we also hope to improve our understanding of full-stack web development, database design, authentication, deployment, and software engineering practices.

---

# Vision
ParanoidPlanner will be a web-based productivity application designed for university students.

The application helps students manage academic workload by organising modules, tasks, deadlines, priorities, and study sessions in one platform.

Ultimately, we envision ParanoidPlanner as a simple but useful academic planner that reduces the mental load of planning and helps students focus on completing their work more effectively.

In the future, the application can be expanded with smarter scheduling, calendar integration, reminders, collaborative study planning, and mobile support.

---

# Scope of Project
ParanoidPlanner is a full-stack web application for academic workload management.

Students will be able to create modules, add academic tasks, assign deadlines and priority levels, view task progress, and generate study schedules.

ParanoidPlanner’s features are outlined in the following sections, organised by the following tags:

**[Proposed]** - features planned for the project
**[Current Progress]** - current progress of the feature
**[Additional Features]** - possible features to improve the product after the MVP is completed

---

# Features

## User Authentication

### [Proposed]
Users should be able to register and log in securely. Each user should only be able to access their own modules, tasks, and schedules.

### [Current Progress]
The authentication system has been implemented.

Users are currently able to:

- Register a new account
- Log in to an existing account
- Access protected routes using JWT authentication
- Store passwords securely using bcrypt

### [Additional Features]
Possible future improvements include:

- Password reset
- Email verification
- Google login

---

## Module Management

### [Proposed]
Users should be able to create modules based on the courses they are taking. These modules help organise academic tasks clearly.

### [Current Progress]
The module management system has been implemented.

Users are currently able to:

- Create modules
- View modules
- Edit modules
- Delete modules

Each module can contain information such as module code, module name, and description.

### [Additional Features]
Possible future improvements include:

- Module colour labels
- Semester grouping
- Module workload summary

---

## Task Management

### [Proposed]
Users should be able to create and manage academic tasks. Each task should include important information such as deadline, priority, status, and completion.

### [Current Progress]
The task management system has been implemented.

Users are currently able to:

- Create tasks
- View tasks
- Edit tasks
- Delete tasks
- Set deadlines
- Set priority levels
- Mark tasks as completed

### [Additional Features]
Possible future improvements include:

- Recurring tasks
- Subtasks
- Task reminders
- Estimated time needed for each task

---

## Smart Guided Task Creator

### [Proposed]
The Smart Guided Task Creator should help users create tasks more easily through structured options instead of typing everything manually.

Users can select options such as module, task type, urgency level, and deadline.

### [Current Progress]
The Smart Guided Task Creator has been implemented.

It currently supports:

- Module selection
- Task type selection
- Urgency selection
- Deadline picker
- Auto-generated task titles

### [Additional Features]
Possible future improvements include:

- Natural language task creation
- Suggested deadlines
- Automatic task breakdown

---

## Dashboard

### [Proposed]
The dashboard should give users a quick overview of their academic workload.

It should help students understand how many tasks they have, how many are completed, and which tasks are still pending.

### [Current Progress]
The dashboard has been implemented with basic statistics.

It currently shows:

- Module statistics
- Task statistics
- Productivity overview
- Workload summary

### [Additional Features]
Possible future improvements include:

- Weekly productivity charts
- Upcoming deadline alerts
- Module workload comparison

---

## Study Schedule

### [Proposed]
The study schedule feature should help students plan study sessions based on their tasks and deadlines.

### [Current Progress]
The study schedule feature has been scaffolded.

It currently supports:

- Generating study sessions
- Displaying planned workload
- Helping users decide what to study next

### [Additional Features]
Possible future improvements include:

- Better schedule optimisation
- Calendar integration
- Custom study session duration
- Automatic rescheduling

---

## Kanban Workflow

### [Proposed]
Users should be able to track their tasks visually using a Kanban-style workflow.

Tasks should be grouped based on their progress.

### [Current Progress]
The current workflow includes:

- To Do
- In Progress
- Completed

### [Additional Features]
Possible future improvements include:

- Drag-and-drop task movement
- Filtering by module
- Filtering by deadline
- Filtering by priority

---

# Technology Stack
AreaTechnology UsedFrontendReact, Vite, Tailwind CSSBackendNode.js, Express.jsDatabasePostgreSQL, NeonAuthenticationJWT, bcryptDeploymentVercel, RenderToolsGitHub, VS Code, Postman
---

# System Architecture
ParanoidPlanner uses a frontend-backend structure.

The frontend handles the user interface. The backend handles the application logic, authentication, and API routes. The database stores users, modules, tasks, and schedule information.

```
Browser / Client
      |
      v
Vercel Frontend
React + Vite
      |
      v
Render Backend
Node.js + Express
      |
      v
Neon PostgreSQL Database
```

---

# Timeline and Development Plan
MilestoneTaskDescriptionStatusMilestone 1IdeationFinalised project idea, problem statement, and target usersCompletedMilestone 1Frontend setupSet up React, Vite, Tailwind CSS, and basic pagesCompletedMilestone 1Backend setupSet up Node.js, Express, and backend routesCompletedMilestone 1Database setupConnected PostgreSQL database using NeonCompletedMilestone 1AuthenticationImplemented registration, login, JWT, and protected routesCompletedMilestone 1Module managementImplemented module CRUD functionsCompletedMilestone 1Task managementImplemented task CRUD functionsCompletedMilestone 1Smart Guided Task CreatorImplemented option-based task creationCompletedMilestone 1DashboardAdded basic task and module statisticsCompletedMilestone 1Study scheduleCreated basic study schedule featureIn ProgressMilestone 1DeploymentPrepared frontend and backend for deploymentIn ProgressMilestone 1DocumentationCreated README and testing instructionsCompleted
---

# Evaluation for Milestone 1
For Milestone 1, ParanoidPlanner currently has a working full-stack foundation.

The current version includes:

- User authentication
- Module management
- Task management
- Smart Guided Task Creator
- Dashboard overview
- Basic study schedule feature
- Backend API routes
- PostgreSQL database connection
- Deployment setup
- Project documentation

This version demonstrates the main workflow of the application and provides a strong base for future development.

---

# Proof-of-Concept
The proof-of-concept shows that users can complete the main academic planning workflow.

A user can:

1. Register an account.
2. Log in securely.
3. Create academic modules.
4. Add tasks under modules.
5. Set task deadlines and priorities.
6. Track task progress.
7. View dashboard statistics.
8. Generate a basic study schedule.

Demo video:

```
Replace this with your video demonstration link.
```

---

# Work Log
Refer to attached project log:

```
Replace this with your work log or spreadsheet link.
```

---

# Future Development
After Milestone 1, we plan to improve ParanoidPlanner by adding:

- Natural language task creation
- Calendar integration
- Deadline reminders
- Better study schedule optimisation
- Drag-and-drop Kanban board
- Mobile-friendly design
- Unit and integration testing
- Collaborative study planning
- Offline support

---

# Challenges Faced
Some challenges faced during development include:

1. Connecting the frontend and backend smoothly.
2. Implementing JWT authentication correctly.
3. Designing database relationships between users, modules, tasks, and schedules.
4. Managing environment variables locally and during deployment.
5. Structuring the project clearly so that it is easy to maintain.
6. Writing documentation that is simple and evaluator-friendly.

---

# Lessons Learned
Through this project, we learned that:

1. A clear project structure makes development easier.
2. Frontend and backend responsibilities should be separated properly.
3. API routes should be planned before connecting them to the frontend.
4. Authentication must be handled carefully to protect user data.
5. Database design is important because many features depend on it.
6. Testing and deployment should be done early to avoid last-minute issues.

---

# Installation Guide

## Clone the Repository

```
git clone https://github.com//Paranoid-Planner.git
cd Paranoid-Planner
```

## Install Backend Dependencies

```
cd backend
npm install
```

## Install Frontend Dependencies

```
cd ../frontend
npm install
```

---

# Local Development

## Start Backend

```
cd backend
npm run dev
```

## Start Frontend

```
cd frontend
npm run dev
```
The frontend usually runs at:

```
http://localhost:5173
```
The backend usually runs at:

```
http://localhost:5000
```

---

# Testing Instructions
Suggested testing flow:

1. Register a new account.
2. Log in.
3. Create a new module.
4. Edit the module.
5. Delete a module.
6. Create a new task.
7. Set a deadline and priority.
8. Mark a task as completed.
9. Use the Smart Guided Task Creator.
10. View the dashboard.
11. Generate a study schedule.

---

# Screenshots
Replace the placeholder links below with actual screenshots.

## Login / Register
![Login Screen](https://chatgpt.com/g/g-p-68b5a70645608191b8f8eba2aba6abd3/c/screenshots/login.png)

## Dashboard
![Dashboard Screen](https://chatgpt.com/g/g-p-68b5a70645608191b8f8eba2aba6abd3/c/screenshots/dashboard.png)

## Module Management
![Modules Screen](https://chatgpt.com/g/g-p-68b5a70645608191b8f8eba2aba6abd3/c/screenshots/modules.png)

## Task Management
![Tasks Screen](https://chatgpt.com/g/g-p-68b5a70645608191b8f8eba2aba6abd3/c/screenshots/tasks.png)

## Study Schedule
![Schedule Screen](https://chatgpt.com/g/g-p-68b5a70645608191b8f8eba2aba6abd3/c/screenshots/schedule.png)

---

# Team Information
ItemDetailsProject NameParanoidPlannerTeam NameYinyangProposed Level of AchievementApolloRepositoryParanoid-PlannerFrontendReact, Vite, Tailwind CSSBackendNode.js, Express.jsDatabasePostgreSQL, NeonDeploymentVercel, Render
