# Today — Todo

A small React todo app served by a Rails 8 JSON API. The production Docker image builds the Vite frontend and serves it from Rails on the same origin.

## Requirements

- Ruby 3.3.13 and Bundler 2.5.22
- Node.js 22 and npm
- Docker with the Compose plugin for deployment

## Local development

From the repository root, in one terminal:

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

Install Docker Engine and the Docker Compose plugin on the instance. Add a GitHub Actions deploy key to the `ubuntu` user's `~/.ssh/authorized_keys`, then configure these repository settings:

- Variable `LIGHTSAIL_HOST`: the instance's static IP or hostname
- Variable `LIGHTSAIL_USER`: `ubuntu`
- Secret `LIGHTSAIL_SSH_KEY`: the matching private SSH key

The `Deploy to Lightsail` workflow runs on pushes to `main` and can also be started manually. The GitHub Actions runner sends the checked out code to the VM and runs `docker compose up -d --build`. The local development machine does not need SSH access to Lightsail.

To deploy manually from the instance, copy the repository to the VM and run this from its root:

```sh
docker compose up -d --build
```

The Compose file publishes port 80, restarts the app if it exits, and keeps task data in a named Docker volume across container rebuilds. Make sure the instance firewall allows inbound HTTP on port 80. If port 80 is already in use, change the host side of the port mapping in `docker-compose.yml`.

For Rails credentials, set `RAILS_MASTER_KEY` in an `.env` file beside `docker-compose.yml` if the app needs encrypted credentials. Do not commit that file.
