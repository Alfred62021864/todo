# Today — Todo

A small React todo app served by a Rails 8 JSON API. The production Docker image builds the Vite frontend and serves it from Rails on the same origin.

## Requirements

- Ruby 3.3.13 and Bundler 2.5.22
- Node.js 22 and npm
- Docker with the Compose plugin for deployment

## Local development

In one terminal, from `api/`:

```sh
bin/rails server
```

In another terminal:

```sh
cd frontend
npm install
npm run dev
```

Open the Vite URL printed in the terminal. Vite proxies `/api` requests to Rails on port 3000. Tasks are stored in `tmp/todos.json` locally.

## API

- `GET /api/health` — health check
- `GET /api/todos` — list tasks
- `POST /api/todos` with `{"title":"..."}` — create a task
- `PATCH /api/todos/:id` with `{"completed":true}` — mark complete or active
- `DELETE /api/todos/:id` — delete a task

## Deploy to a Lightsail instance

Install Docker Engine and the Docker Compose plugin on the instance, then clone this repository and run these commands from `api/`:

```sh
docker compose up -d --build
```

The Compose file publishes port 80, restarts the app if it exits, and keeps task data in a named Docker volume across container rebuilds. Make sure the instance firewall allows inbound HTTP on port 80. If port 80 is already in use, change the host side of the port mapping in `docker-compose.yml`.

For Rails credentials, set `RAILS_MASTER_KEY` in an `.env` file beside `docker-compose.yml` if the app needs encrypted credentials. Do not commit that file.
