# Deploying BloomSwiftPOS to Railway

This guide explains how to deploy the BloomSwiftPOS application (Backend & Frontend) to Railway.app.

## Prerequisites

- A [Railway](https://railway.app/) account
- The project code pushed to a GitHub repository

## 1. Deploy the Backend

1.  **New Project**: In Railway, create a new project and select "Deploy from GitHub repo".
2.  **Select Repo**: Choose your BloomSwiftPOS repository.
3.  **Configure Service**:
    - Railway might try to auto-detect. If it detects multiple services, that's great.
    - If you need to manually configure, add a service for the **backend**.
    - **Root Directory**: Set to `/backend`.
    - **Build Command**: `npm install && npm run build` (or rely on the Dockerfile).
    - **Start Command**: `npm start` (or rely on the Dockerfile).
    - **Watch Paths**: `/backend/**`
4.  **Environment Variables**:
    - Add the following variables:
      - `PORT`: `5000` (CRITICAL: Must match Dockerfile EXPOSE 5000)
      - `DATABASE_URL`: Add a PostgreSQL database plugin in Railway and link it. Railway will automatically provide this variable.
      - `JWT_SECRET`: A long random string.
      - `ADMIN_USERNAME`: Your desired admin username.
      - `ADMIN_PASSWORD`: Your desired admin password.
      - `NODE_ENV`: `production`
      - `WHATSAPP_ENABLED`: `true`
      - `THERMAL_PRINTER_NAME`: (Optional, leave blank if no printer attached to server)
5.  **Domain**:
    - Go to Settings -> Networking -> Generate Domain.
    - Copy this domain (e.g., `backend-production.up.railway.app`). You'll need it for the frontend.

**Recommended**: Use the `Dockerfile` deployment method for the backend to ensure all system dependencies (Canvas, Puppeteer) are installed correctly. Railway usually detects the `Dockerfile` automatically.

## 2. Deploy the Frontend

1.  **Add Service**: In the same Railway project, click "New" -> "GitHub Repo" -> Select the same repo.
2.  **Configure Service**: - **Root Directory**: Set to `/frontend`. - **Build Command**: `npm install && npm run build`. - **Start Command**: `npm start`.
3.  **Environment Variables**:
    - `BACKEND_URL`: The full URL of your backend service (e.g., `https://backend-production.up.railway.app`).
    - `PORT`: `8080` (CRITICAL: Must match Dockerfile EXPOSE 8080).
    - `NIXPACKS_NX_APP_NAME`: If using Nixpacks, but we recommend Dockerfile.

**Important**: This project is configured to use **Dockerfiles** for both backend and frontend to ensure consistent environments.

**To ensure correct deployment:**

1. Go to Service -> Settings -> Builder.
2. Select "Dockerfile" (NOT Nixpacks/Heroku).
3. Set Context to `/frontend` (for frontend) or `/backend` (for backend).
4. Redeploy.

(We have removed Nginx to simplify the stack. The frontend now runs a lightweight Node.js server).**Domain**: - Go to Settings -> Networking -> Generate Domain. - This is the URL where you will access your application.

## 3. Verify Deployment

1.  Open your Frontend URL.
2.  Login with the admin credentials you set in the backend environment variables.
3.  Check the "Diagnostics" page to ensure the database and WhatsApp service are connected.

## Troubleshooting

- **WhatsApp Issues**: If WhatsApp fails to initialize, ensure you are using the `Dockerfile` build for the backend, as it installs the necessary Chromium dependencies.
- **Connection Errors**: Check the `BACKEND_URL` in the frontend service. It must start with `https://` and have no trailing slash (though the server script handles the slash).
- **Database Errors**: Ensure the PostgreSQL plugin is attached to the backend service.

## Docker Deployment (Advanced)

If you prefer to use the Dockerfiles directly (recommended):

1.  In Railway, go to the Service -> Settings.
2.  Under "Builder", select "Dockerfile".
3.  Ensure the "Dockerfile Path" is set correctly (e.g., `backend/Dockerfile` for backend, `frontend/Dockerfile` for frontend).
