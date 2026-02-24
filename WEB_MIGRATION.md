# Web Migration Guide

This document outlines the changes made to convert the BloomSwiftPOS Electron application into a standard web application.

## 1. Architecture Changes

- **Backend**: The Node.js/Express backend now serves as the primary application server. It serves the frontend static files and provides the API.
- **Frontend**: The React frontend is now a standard Single Page Application (SPA) served by the backend. Electron-specific code (IPC) has been removed.
- **WhatsApp**: The WhatsApp integration has been moved from the Electron main process to the backend using `whatsapp-web.js`.

## 2. Key Modifications

### Frontend
- **Removed Electron IPC**: All calls to `window.electronAPI` have been replaced with HTTP API calls to the backend.
- **Service Layer**:
  - Created `src/services/whatsapp.ts` to handle WhatsApp API calls.
  - Updated `src/services/api.ts` to use relative paths (or environment variables) instead of `file://` protocol logic.
  - Updated `src/services/errorReporter.ts` to remove Electron logging.
- **Components**:
  - `Settings.tsx`: Updated to use the new `whatsapp` service for connection status, QR code, and disconnection.
  - `Sales.tsx`: Updated to use the new `whatsapp` service for sending invoices.

### Backend
- **Static File Serving**: Updated `index.ts` to serve the `frontend/dist` folder.
- **WhatsApp Service**: Implemented a full server-side WhatsApp service in `src/services/whatsapp.ts` (replacing the Electron implementation).
- **API Routes**: Created `src/routes/whatsapp.ts` to expose WhatsApp functionality via REST API.

### Project Structure
- **Removed**: `electron/` directory.
- **Updated**: Root `package.json` to remove Electron dependencies and scripts.
- **Build Process**: `npm run build` now builds both frontend and backend. `npm start` starts the backend server (which serves the frontend).

## 3. How to Run

### Development
1. Start the backend:
   ```bash
   npm run backend:dev
   ```
2. Start the frontend (in a separate terminal):
   ```bash
   npm run frontend:dev
   ```

### Production
1. Build the application:
   ```bash
   npm run build
   ```
2. Start the server:
   ```bash
   npm start
   ```
   Access the application at `http://localhost:5000`.

## 4. Environment Variables

Ensure the `backend/.env` file is configured correctly.
- `WHATSAPP_ENABLED`: Set to `true` (optional, the service initializes on demand).
- `DATABASE_URL`: Must point to your PostgreSQL database.
