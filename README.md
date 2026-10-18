# QuickNotes System Design

QuickNotes is a small browser client and a system design exercise for a notes service intended to support one million registered users.

The browser client uses JavaScript `fetch()` to load, create, and delete sample notes through [JSONPlaceholder](https://jsonplaceholder.typicode.com/). The design documents describe a possible production API, PostgreSQL data model, and scalable architecture.

> **Demo limitation:** JSONPlaceholder simulates create and delete responses. It does not permanently save new notes or deletions. Reloading the page restores the original sample data.

## Features

- Load up to 10 sample notes with `GET`.
- Create notes with `POST` and delete notes with `DELETE`.
- Require a title of at most 100 characters.
- Show loading, success, error, and empty states.
- Disable controls while a request is running.
- Display note text with `textContent`, so user text is treated as text rather than HTML.
- Keep each displayed note distinct even when the demo API returns duplicate IDs.

## Project structure

```text
quicknotes-system-design/
├── index.html
├── api.js
├── style.css
├── README.md
└── docs/
    ├── api-design.md
    ├── data-model.md
    └── architecture.md
```

## Run the browser client

1. Clone or download this repository.
2. Open `index.html` in a modern browser, or serve the folder with a local web server.
3. Select **Load notes** to retrieve sample notes.
4. Enter a title and optional body, then select **Create note**.
5. Select **Delete** beside a note to try the delete request.

The browser needs an internet connection to reach JSONPlaceholder. A local web server, such as the VS Code Live Server extension, provides a consistent development setup.

## Design documents

- [API design](docs/api-design.md): endpoints, examples, authentication, and error responses.
- [Data model](docs/data-model.md): entities, ownership constraints, SQL examples, and indexes.
- [Architecture](docs/architecture.md): requirements, capacity estimates, request flows, and trade-offs.

## What this project demonstrates

1. How HTML, CSS, and JavaScript work together in a browser application.
2. How `fetch()`, HTTP methods, JSON, and `async`/`await` communicate with an API.
3. How validation, error handling, and status messages help users understand requests.
4. How primary keys, foreign keys, joins, and indexes support relational data.
5. How load balancers, caches, read replicas, and queues can support growth.
6. How system design balances performance, consistency, availability, and cost.

## Limitations and next steps

- Replace JSONPlaceholder with a persistent backend and database.
- Add real user registration, authentication, and authorization.
- Add automated tests and continuous integration.
- Add accessibility review, pagination, and search to the client.
- Add production monitoring, backups, and recovery procedures.

## Technologies

HTML5, CSS3, JavaScript, the Fetch API, JSONPlaceholder, Markdown, and PostgreSQL examples.
