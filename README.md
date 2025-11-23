# [CS-375-Final-Project](https://cs-375-final-project.fly.dev/)

## Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file, and adjust the example values to match the real ones:
   ```bash
   cp .env-example .env
   ```

3. Set up the database (Fly.io, requires `flyctl` and an attached Postgres app) -- NOTE: I don't think we need to do this more than once, I (Sean) already ran this so you probably will not have to at any point:
   ```bash
   npm run setup
   ```
   This will drop/recreate the `foo` table and insert sample rows.

4. Set up a local database:
   ```bash
   npm run setup:local
   ```
   This command expects a local Postgres instance reachable at the values in `.env`.

5. Start the server:
   ```bash
   npm start
   ```
   For local development with `.env`, use:
   ```bash
   npm run start:local
   ```

## Development

- `npm run start:local` loads `.env` and starts `server.js`
- `npm start` runs the server without loading `.env`
- `npm run setup` applies `setup.sql` to the Fly Postgres database
- `npm run setup:local` applies `setup.sql` to a local Postgres instance
- `npm run build` / `npm run dev` keep working for Tailwind CSS if you need the compiled assets

## Project Structure

- Followed some ideas
  from [this Medium Article](https://mr-alien.medium.com/folder-structure-for-nodejs-expressjs-project-56be9ec35548) as
  well as [this one](https://dev.to/mr_ali3n/folder-structure-for-nodejs-expressjs-project-435l) with some modifications
  for modular design.

### Subdirectories:

1. Config - This might also be used for database setup, authentication setup, etc. It seems that a best practice is to
   not commit this to GitHub since there will sensitive information.
2. Controllers - Will handle the incoming requests from the API routes, and have a different outcome depending on the
   purpose of the route
3. Helpers - Essentially utils, but more dynamic. The existing example is the visit PHL scraper, which is more related
   to a specific function of our project instead of static like a logger.
4. Middleware - Where we'll handle things like Auth, enabling CORS, Global Error Handlers
5. Models - For defining data objects/schemas such as the existing event object for use in the database.
6. Routes - useful for organizing our application's routes, and allows us to separate them into multiple files. We will
   also likely be using an Express Router instance, which this directory will be useful for.
7. Services - There is a fair chance we won't really use this one, but it's here if we need it. Might end up using it
   for the notification service for one of our features or an auth service.
8. Utils - Tools to be used throughout the project statically, like a logger if we are to add one at any point.

- server.js is the main project entry point, which kicks off src/app.js

### Example: Adding a New Feature

1. Create a route in `src/routes/`
2. Add route handlers in `src/controllers/`
3. Add logic in `src/services/`
4. Define data models in `src/models/` if needed
5. Register routes in `src/routes/index.js`
