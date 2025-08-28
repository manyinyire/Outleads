# Outleads Project

Outleads is a comprehensive, enterprise-grade solution for lead and campaign management, designed to streamline marketing and sales workflows.

## Features

- **Campaign Management**: Create, manage, and track marketing campaigns. Each campaign gets a unique trackable link.
- **Lead Capture**: A public-facing form allows for easy lead submission.
- **Lead Management**: View, filter, and assign leads to agents.
- **User Roles & Permissions**: Granular control over user access with roles like Admin, Supervisor, and Agent.
- **Dashboard & Reporting**: (Coming Soon) Analytics and reporting on campaign performance and lead conversion.
- **Secure Authentication**: Robust authentication and authorization system.

## Architecture Overview

The project is a full-stack application built with a modern tech stack:

- **Framework**: [Next.js](https://nextjs.org/) (using the App Router) provides the foundation for both the frontend and backend API.
- **Language**: [TypeScript](https://www.typescriptlang.org/) for type safety and improved developer experience.
- **Database**: [PostgreSQL](https://www.postgresql.org/) for the relational database.
- **ORM**: [Prisma](https://www.prisma.io/) for database access and migrations.
- **UI**: [Ant Design](https://ant.design/) for a rich set of UI components.
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/) for global state management and [@tanstack/react-query](https://tanstack.com/query/latest) for server state management.
- **Testing**: [Jest](https://jestjs.io/) for unit/integration testing and [Playwright](https://playwright.dev/) for end-to-end testing.

The application is structured as a monorepo with the frontend and backend code colocated. The `app` directory contains all the pages and API routes, `components` holds the reusable UI components, and `lib` contains the core business logic, database models, and utilities.

## API Documentation

The following are the key API endpoints available. All endpoints are prefixed with `/api`.

| Endpoint | Method | Description | Authorized Roles |
|---|---|---|---|
| `/admin/users` | GET | Fetches a list of users. | ADMIN, BSS, INFOSEC |
| `/admin/users` | POST | Creates a new user. | ADMIN, BSS |
| `/admin/users/{id}` | PUT | Updates a user. | ADMIN, BSS |
| `/admin/users/{id}` | DELETE | Deletes a user. | ADMIN |
| `/admin/leads` | GET | Fetches a list of leads. | ADMIN, AGENT, SUPERVISOR |
| `/admin/campaigns` | GET | Fetches a list of campaigns. | ADMIN, SUPERVISOR, AGENT |
| `/admin/campaigns` | POST | Creates a new campaign. | ADMIN, SUPERVISOR |
| `/auth/login` | POST | Authenticates a user. | Public |
| `/auth/me` | GET | Retrieves the current user's profile. | Authenticated Users |

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- pnpm

### Installation and Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd Outleads
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    ```bash
    cp .env.example .env
    ```
    Update the `.env` file with your database credentials and other required variables.

4.  **Run database migrations:**
    ```bash
    pnpm db:migrate
    ```

5.  **Seed the database:**
    ```bash
    pnpm db:seed
    ```

6.  **Run the development server:**
    ```bash
    pnpm dev
    ```

The application should now be running at [http://localhost:3000](http://localhost:3000).

## Testing

- **Run unit and integration tests:**
  ```bash
  pnpm test
  ```

- **Run tests with coverage:**
  ```bash
  pnpm test:cov
  ```

- **Run end-to-end tests:**
  ```bash
  pnpm e2e
  ```

## Available Scripts

- `pnpm dev`: Starts the development server.
- `pnpm build`: Creates a production build.
- `pnpm start`: Starts the production server.
- `pnpm lint`: Lints the codebase.