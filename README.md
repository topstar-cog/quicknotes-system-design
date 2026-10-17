

\# QuickNotes System Design



\## Project Description



QuickNotes is a browser-based notes client and system design project for a service intended to support one million registered users.



The client demonstrates how a web page communicates with an HTTP API using JavaScript `fetch()`. It supports loading, creating and deleting notes through the JSONPlaceholder practice API.



The design documents describe the proposed production API, relational database and scalable system architecture.



\*\*Important:\*\* JSONPlaceholder is a demonstration API. It simulates POST and DELETE responses but does not permanently store created notes or deletions on its server.



\## Features



\- Load up to 10 notes using GET.

\- Create notes using POST.

\- Delete notes using DELETE.

\- Validate required titles and the 100-character limit.

\- Display loading, success, error and empty states.

\- Disable request buttons while operations are running.

\- Render note text using `textContent` to avoid interpreting user text as HTML.



\## Project Structure



```text

quicknotes-system-design/

├── index.html

├── api.js

├── style.css

├── README.md

└── docs/

&#x20;   ├── api-design.md

&#x20;   ├── data-model.md

&#x20;   └── architecture.md

```



\## How to Run the API Client



1\. Clone or download this repository.

2\. Open `index.html` in a modern browser, or use a local development server.

3\. Click \*\*Load notes\*\* to retrieve sample notes from JSONPlaceholder.

4\. Enter a title and optional body, then click \*\*Create note\*\*.

5\. Click \*\*Delete\*\* on a note to test the DELETE request.



An internet connection is required because the client calls the external JSONPlaceholder API.



For a more reliable local development workflow, use the VS Code Live Server extension or another local HTTP server.



\## Design Documents



\- \[API Design](docs/api-design.md) — endpoints, request/response examples, authentication and error codes.

\- \[Data Model](docs/data-model.md) — entities, keys, relationships, SQL queries and indexes.

\- \[Architecture](docs/architecture.md) — requirements, one-million-user estimates, component diagram, request flows and trade-offs.



\## What I Learned



1\. How HTML, CSS and JavaScript work together to build a browser-based API client.

2\. How `fetch()`, HTTP methods, JSON and `async`/`await` support communication with an API.

3\. Why input validation, error handling and clear loading and empty states improve usability.

4\. How primary keys, foreign keys, joins and indexes support relational database design.

5\. How load balancers, caches, read replicas and queues support scalability and resilience.

6\. Why system design requires trade-offs between performance, consistency, availability and cost.



\## Limitations and Future Improvements



\- Replace JSONPlaceholder with a persistent backend and database.

\- Add real user registration, authentication and authorization.

\- Add automated tests and continuous integration.

\- Improve accessibility, pagination and search.

\- Add production monitoring, backups and recovery procedures.



\## Technology



\- HTML5

\- CSS3

\- JavaScript

\- Fetch API

\- JSONPlaceholder practice API

\- Markdown and PostgreSQL system design examples



