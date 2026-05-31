# ParanoidPlanner
### Adaptive Study Scheduling for University Students

**Team Name:** Yinyang
**Proposed Level of Achievement:** Apollo

---

## Overview

ParanoidPlanner is a full-stack academic productivity web application designed to help university students manage their workload more effectively.

Students often juggle multiple modules, assignments, quizzes, projects, revision sessions, and examinations simultaneously. Academic information is frequently scattered across different platforms such as calendars, spreadsheets, learning management systems, and personal notes.

ParanoidPlanner provides a centralized platform where students can:

- Organize modules
- Create and manage academic tasks
- Prioritize work
- Track progress
- Generate study schedules
- Visualize workload through dashboards

---

## Motivation

University students today constantly juggle heavy academic workloads alongside extracurricular commitments, often losing productivity to digital distractions, procrastination, and the sheer complexity of managing multiple deadlines. While existing productivity tools such as Notion are popular, they are typically too generic, require a lot of manual setup, or fail to adapt to fluctuating workloads or automatically reallocate tasks to prevent burnout.

ParanoidPlanner bridges this gap by creating a smart, automated platform specifically tailored to the realities of academic life — optimizing study schedules, automatically adjusting workloads when students fall behind, and integrating seamlessly with existing tools like Notion and Google Calendar.

This project also allows us to strengthen our understanding of:

- Full-stack web development
- Database design
- Authentication systems
- Cloud deployment
- Software engineering practices

---

## Problem Statement

Students often face difficulties with:

- Tracking deadlines across multiple modules
- Prioritizing urgent work
- Managing large numbers of assignments
- Maintaining consistent study schedules
- Visualizing overall workload

Current solutions often require users to manually piece together information across multiple applications. ParanoidPlanner aims to solve this by providing a unified academic planning platform.

---

## Vision

We envision ParanoidPlanner as an intelligent academic companion that helps students make better decisions about their time and workload.

The long-term vision includes:

- Adaptive scheduling
- Calendar integration
- Reminder systems
- Workload forecasting
- Study analytics
- Personalized recommendations

---

## Target Users

- University students
- Polytechnic students
- Junior college students
- Self-directed learners

---

## User Stories

| Feature | Story |
|---|---|
| Academic Planning | As a student, I want to organize my modules in one place so that I can easily manage all my coursework. |
| Task Management | As a student, I want to create and prioritize tasks so that I know what work should be completed first. |
| Progress Tracking | As a student, I want to track task completion so that I can monitor my productivity. |
| Schedule Planning | As a student, I want to generate study schedules so that I can plan my revision more effectively. |
| Workload Visualization | As a student, I want to view workload statistics so that I can better understand my academic commitments. |

---

## Features

> Tags used:
> - **[Proposed]** — Planned functionality
> - **[Current Progress]** — Features already implemented
> - **[Additional Features]** — Future enhancements after the MVP

### 🔐 User Authentication

**[Proposed]** Users should be able to securely create and access personal accounts.

**[Current Progress]**
- User registration
- User login
- Protected routes
- Password hashing using bcrypt

**[Additional Features]**
- Password reset
- JWT authentication
- Email verification
- Google authentication

---

### 📚 Module Management

**[Proposed]** Users should be able to organize their academic modules.

**[Current Progress]**
- Create modules
- View modules
- Edit modules
- Delete modules

Module information includes: module code, module name, and description.

**[Additional Features]**
- Colour coding
- Semester grouping
- Module analytics

---

### ✅ Task Management

**[Proposed]** Users should be able to manage academic tasks efficiently.

**[Current Progress]**
- Create tasks
- Edit tasks
- Delete tasks
- Deadline tracking
- Priority tracking
- Task completion

**[Additional Features]**
- Recurring tasks
- Subtasks
- Task reminders
- Time estimation

---

### 🧠 Smart Guided Task Creator

**[Proposed]** A guided task creation system that reduces manual input.

**[Current Progress]**
- Module selection
- Task type selection
- Urgency selection
- Deadline selection
- Auto-generated titles

**[Additional Features]**
- Natural language task creation
- Suggested deadlines
- Automatic task decomposition

---

### 📊 Dashboard

**[Proposed]** Provide a high-level overview of academic workload.

**[Current Progress]**
- Module statistics
- Task statistics
- Productivity overview
- Workload summary

**[Additional Features]**
- Weekly productivity charts
- Deadline alerts
- Trend analysis

---

### 📅 Study Schedule

**[Proposed]** Generate study schedules based on workload.

**[Current Progress]**
- Schedule generation
- Session display
- Workload planning

**[Additional Features]**
- Adaptive scheduling
- Calendar integration
- Automatic rescheduling

---

### 🗂️ Kanban Workflow

**[Proposed]** Visual task tracking.

**[Current Progress]**
- To Do
- In Progress
- Completed

**[Additional Features]**
- Drag-and-drop workflow
- Advanced filtering
- Custom boards

---

## Technology Stack

| Area | Technology |
|---|---|
| Frontend | React 18.3.1, Vite 5.4.21, Tailwind CSS 3.4.19 |
| Backend | Node.js 24.16.0, Express.js 4.22.2 |
| Database | PostgreSQL 18, Neon PostgreSQL |
| Authentication | JWT 9.0.3, Bcrypt 5.1.1 |
| Deployment | Vercel (Frontend), Render (Backend) |
| Tools | GitHub, VS Code, Postman |

---

## System Architecture

```
Browser / User
    └── Frontend Web App (React + Vite, deployed on Vercel)
            └── Backend API (Node.js + Express.js, deployed on Render)
                    └── Database (PostgreSQL, hosted on Neon)
```

---

## Database Design

**Core entities:**

- **Users** — Stores account information
- **Modules** — Stores module details belonging to users
- **Tasks** — Stores academic tasks associated with modules
- **Study Sessions** — Stores generated study schedules

**Relationships:**

```
User
├── Modules
│     └── Tasks
└── Study Sessions
```

---

## Software Engineering Practices

### Version Control
GitHub is used for source control, branch management, and collaboration.

### Modular Architecture
The application is separated into frontend, backend, and database layers.

### Security
- Password hashing
- Environment variable management

### Deployment
Continuous deployment through Vercel, Render, and Neon.

### Testing
- Authentication testing
- CRUD testing
- API testing
- Deployment testing

---

## Milestone 1 Progress

| Milestone | Task | Status |
|---|---|---|
| MS1 | Frontend Setup | ✅ Completed |
| MS1 | Backend Setup | ✅ Completed |
| MS1 | Database Setup | ✅ Completed |
| MS1 | Authentication | ✅ Completed |
| MS1 | Module Management | ✅ Completed |
| MS1 | Task Management | ✅ Completed |
| MS1 | Dashboard | ✅ Completed |
| MS1 | Deployment | ✅ Completed |

---

## Challenges Faced

- Integrating frontend and backend systems
- Designing database relationships
- Handling deployment configuration
- Maintaining clean project structure

---

## Lessons Learned

- Importance of planning system architecture early
- Benefits of modular development
- Practical experience with cloud deployment
- Importance of secure authentication
- Effective use of Git for collaboration

---

## Future Development

Planned features include:

- Natural language task creation
- Adaptive scheduling
- Calendar integration
- Deadline reminders
- Drag-and-drop Kanban boards
- Productivity analytics
- Mobile responsiveness
- Collaborative study planning

---

## Live Application

🌐 **Frontend:** [https://paranoid-planner.vercel.app/](https://paranoid-planner.vercel.app/)

---

## Team Information

| Item | Details |
|---|---|
| Project Name | ParanoidPlanner |
| Team Name | Yinyang |
| Proposed Level | Apollo |
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | PostgreSQL (Neon) |
| Deployment | Vercel + Render |
