# Brush-It

**Real-time collaborative drawing board**

Brush‑It is a lightweight web application that lets multiple users draw together on a shared canvas in real time. It is built with a modern React frontend and a Node/Express backend that uses Socket.IO for realtime events. The backend is designed to use Redis pub/sub for horizontal scaling and MongoDB for optional persistence of rooms/canvas history.

---

## Key features

* Real-time drawing sync across connected clients.
* Basic drawing tools: pen, eraser, color, stroke width.
* Room support (invite links).
* State preservation so late-joining users can receive the current canvas.
* Designed to scale using Redis pub/sub for multi-instance Socket.IO deployments.
* Optional persistence to MongoDB for saving room history.

---

## Tech stack

* **Frontend:** React.js, HTML5 Canvas, Socket.IO client
* **Backend:** Node.js, Express, Socket.IO
* **Realtime scaling:** Redis (pub/sub / socket.io-redis adapter)
* **Persistence (optional):** MongoDB (mongoose)
* **Deployment / Hosting:** Can be deployed to Vercel / Heroku / any Node host; Docker support possible

---

## How it works (high level)

1. The **frontend** renders an HTML5 `<canvas>` and captures drawing events (mouse/touch). It emits compact drawing actions to the backend via Socket.IO (for example: `draw`, `erase`, `clear`, `change-tool`).
2. The **backend** receives drawing events and broadcasts them to other clients in the same room.
3. For single-server deployments Socket.IO handles broadcasting directly. For **multiple backend instances**, a Redis adapter is used as a pub/sub gateway so events received by one instance are published to Redis and propagated to other instances, keeping all clients in sync.
4. Optionally, the backend stores room state / history to **MongoDB** so rooms can be restored, or sessions can be saved for later playback.

---

## Why Redis pub/sub?

* When you run more than one backend instance (for availability/scaling), Socket.IO instances need a way to forward messages between themselves. The Redis adapter (socket.io-redis) uses Redis pub/sub under the hood to propagate events between instances.
* Redis pub/sub is fast and simple — ideal for passing realtime drawing events without the overhead of persistent queues.

---

## Why MongoDB?

* MongoDB is used as an optional persistent store to keep room metadata and canvas history. This enables features such as saving and restoring rooms, replaying sessions, or storing user-saved boards.
* Using a document DB like Mongo fits well with storing array-like drawing operations or snapshot blobs (e.g., base64 PNGs or serialized draw operation lists).

---

## Repository layout (master branch)

```
/frontend   # React app that renders canvas and UI
/backend    # Node/Express + Socket.IO server
README.md
```

(Note: exact filenames and structure may vary. See the repo tree for current files.)

---

## Local development — quick setup

> The steps below assume you have `node` (v16+), `npm` or `yarn`, `git`, and optionally Docker installed.

### Option A — Run services locally (Node + local Redis + local Mongo)

1. Clone the repo

```bash
git clone https://github.com/sarvansh30/brush-it.git
cd brush-it
```

2. Start Redis and MongoDB

* **Using Docker (recommended)**

```bash
# from repository root
# start mongo and redis
docker run -d --name brushit-mongo -p 27017:27017 mongo:6
docker run -d --name brushit-redis -p 6379:6379 redis:7
```

* **Or install locally** using your OS package manager or MongoDB/Redis installers.

3. Configure environment variables

Create a `.env` file in `/backend` with the following (example):

```
PORT=4000
MONGO_URI=mongodb://localhost:27017/brushit
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
JWT_SECRET=change-me-if-needed
NODE_ENV=development
```

4. Install and run backend

```bash
cd backend
npm install
npm run dev    # or `node server.js` depending on scripts
```

5. Install and run frontend

```bash
cd ../frontend
npm install
npm run dev #for dev enviornment
```

6. Open the app in the browser (e.g. `http://localhost:5173` for frontend).


---

## Environment variables

(Example variables to set in `/backend/.env`)

* `PORT` — backend HTTP port (default 4000)
* `MONGO_URI` — connection string to MongoDB
* `REDIS_HOST` — Redis host (127.0.0.1 or service name in Docker)
* `REDIS_PORT` — Redis port (default 6379)

---

## Scaling notes

* For horizontal scaling, run multiple instances of the backend behind a load balancer. Configure Socket.IO to use `socket.io-redis` (or `@socket.io/redis-adapter`) and point it to the same Redis instance so broadcast events are propagated across instances.
* Persisting every single draw event to Mongo is expensive. Two common approaches:

  * Persist snapshots occasionally (e.g., every N seconds or after a session end) as an image or compressed operation list.
  * Persist a compact operation log for rooms and trim/compact periodically.

---


