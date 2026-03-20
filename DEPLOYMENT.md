# CivicTrack Deployment

## Architecture

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

## 1. MongoDB Atlas

Create a database user, then allow your Render service IP access in Atlas. Use a connection string in this format:

`mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/civictrack?retryWrites=true&w=majority&appName=CivicTrack`

## 2. Backend on Render

Create a new Web Service from this repo and point Render to the `server` directory, or use [`render.yaml`](/Users/jaitheerth/Desktop/civictrack/render.yaml).

Set these environment variables in Render:

- `MONGO_URI`: your Atlas connection string
- `CLIENT_URL`: your Vercel frontend URL, for example `https://civictrack.vercel.app`
- `ADMIN_USERNAME`: admin login username
- `ADMIN_PASSWORD`: admin login password
- `ADMIN_TOKEN_SECRET`: long random secret
- `OPENAI_API_KEY`: optional
- `OPENAI_INSIGHTS_MODEL`: optional, defaults to `gpt-4o-mini`

Render will use:

- Build command: `npm install`
- Start command: `npm start`

## 3. Frontend on Vercel

Import the repo into Vercel and set the project root to `client`.

Add this environment variable in Vercel:

- `VITE_API_BASE_URL`: your Render backend URL plus `/api`

Example:

`https://your-render-service.onrender.com/api`

[`vercel.json`](/Users/jaitheerth/Desktop/civictrack/vercel.json) is included so React Router routes work after refresh.

## Important Note About Uploads

Complaint images are currently stored on the backend filesystem in `server/uploads`. Render disks are ephemeral unless you attach persistent storage, so uploaded images may disappear after redeploys or restarts.

For production, move uploads to cloud storage like Cloudinary, S3, or UploadThing.
