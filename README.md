# GOLD TRADE MARKET — Fixed Full-Stack Version

## Structure
- `/` = customer app
- `/admin` = separate admin website
- `/api/*` = shared backend API

## Run
1. Install Node.js.
2. Run `npm install`.
3. Set `JWT_SECRET` to a long random value.
4. Set `ADMIN_ID` and `ADMIN_PASSWORD` as environment variables.
5. Run `npm start`.
6. Open `http://localhost:3000/`
7. Open `http://localhost:3000/admin`

## Important
Do not open `public/index.html` directly with a file manager. That causes API connection errors.
Do not deploy only the `public` folder to GitHub Pages. Deploy the whole Node.js project to a Node-capable host.

For production, replace the JSON database and base64 proof storage with a real database and secure object storage.
