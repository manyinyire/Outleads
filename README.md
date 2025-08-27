# Outleads Project

This is the official repository for the Outleads application, a comprehensive solution for lead and campaign management.

## Tech Stack

- **Framework:** Next.js (with App Router)
- **Language:** TypeScript
- **UI:** Ant Design
- **ORM:** Prisma
- **State Management:** Redux Toolkit

## Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:

- Node.js (v18 or later)
- pnpm (Package Manager)

### Installation and Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd Outleads
    ```

2.  **Install dependencies:**
    This project uses `pnpm` as the package manager. Do not use `npm` or `yarn`.
    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    Copy the example environment file and fill in the required values.
    ```bash
    cp .env.example .env
    ```

4.  **Run database migrations:**
    Apply the database schema to your local database.
    ```bash
    pnpm prisma migrate dev
    ```

5.  **Run the development server:**
    ```bash
    pnpm dev
    ```

The application should now be running at [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `pnpm dev`: Starts the development server.
- `pnpm build`: Creates a production build of the application.
- `pnpm start`: Starts the production server.
- `pnpm lint`: Lints the codebase for errors and style issues.
