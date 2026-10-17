

\# QuickNotes API Design



\## 1. Overview



QuickNotes provides a RESTful API for managing users' notes and tags. The production API described here is the proposed backend design; the browser client currently uses JSONPlaceholder for practice.



Base URL: `https://api.quicknotes.example/v1`



Authentication: Bearer token in the `Authorization` header for protected endpoints.



\## 2. REST Endpoints



| Method | Path | Description | Success status |

|---|---|---|---|

| POST | `/auth/register` | Register a new user | 201 Created |

| POST | `/auth/login` | Authenticate a user | 200 OK |

| GET | `/notes` | List the authenticated user's notes; supports pagination | 200 OK |

| GET | `/notes/{id}` | Retrieve one note | 200 OK |

| POST | `/notes` | Create a note | 201 Created |

| PATCH | `/notes/{id}` | Update part of a note | 200 OK |

| DELETE | `/notes/{id}` | Delete a note | 204 No Content |

| GET | `/tags` | List the user's tags | 200 OK |

| POST | `/notes/{id}/tags/{tagId}` | Assign a tag to a note | 201 Created |



All note and tag operations must enforce ownership. A user must not read, edit or delete another user's private notes.



\## 3. Authentication



Protected requests include:



`Authorization: Bearer <access-token>`



The API validates the token and derives the user identity from it. Clients must not be allowed to choose another user's identity by submitting a different `user\_id`.



\## 4. Create a Note



\### Request



`POST /notes`



Headers:



`Content-Type: application/json`



`Authorization: Bearer <access-token>`



Request JSON:



```json

{

&#x20; "title": "Meeting notes",

&#x20; "body": "Discuss project milestones and deadlines."

}

```



The title is required and must contain 1–100 characters. The body is optional.



\### Successful response — 201 Created



```json

{

&#x20; "id": 101,

&#x20; "user\_id": 7,

&#x20; "title": "Meeting notes",

&#x20; "body": "Discuss project milestones and deadlines.",

&#x20; "created\_at": "2026-10-17T10:00:00Z",

&#x20; "updated\_at": "2026-10-17T10:00:00Z"

}

```



The server generates the ID, user association and timestamps.



\## 5. List Notes



\### Request



`GET /notes?page=1\&limit=10`



Headers:



`Authorization: Bearer <access-token>`



\### Successful response — 200 OK



```json

{

&#x20; "data": \[

&#x20;   {

&#x20;     "id": 101,

&#x20;     "title": "Meeting notes",

&#x20;     "body": "Discuss project milestones and deadlines.",

&#x20;     "created\_at": "2026-10-17T10:00:00Z",

&#x20;     "updated\_at": "2026-10-17T10:00:00Z"

&#x20;   }

&#x20; ],

&#x20; "pagination": {

&#x20;   "page": 1,

&#x20;   "limit": 10,

&#x20;   "total": 1

&#x20; }

}

```



The API returns only notes owned by the authenticated user. An empty collection returns `200 OK` with an empty `data` array.



\## 6. Error Status Codes



| Status | Meaning | Example situation |

|---|---|---|

| 400 Bad Request | Invalid request data | Missing title or malformed JSON |

| 401 Unauthorized | Authentication required or invalid | Missing or expired token |

| 403 Forbidden | Authenticated user lacks permission | Attempt to access a restricted operation |

| 404 Not Found | Resource not found | Note ID does not exist |

| 409 Conflict | Conflicting operation | Duplicate unique username |

| 422 Unprocessable Content | Validation failed | Title exceeds 100 characters |

| 429 Too Many Requests | Rate limit exceeded | Too many requests in a short period |

| 500 Internal Server Error | Unexpected server failure | Unhandled application error |



\### Example error response



```json

{

&#x20; "error": {

&#x20;   "code": "VALIDATION\_ERROR",

&#x20;   "message": "The title must contain between 1 and 100 characters.",

&#x20;   "details": {

&#x20;     "field": "title"

&#x20;   }

&#x20; }

}

```



Error responses should not expose stack traces, passwords, access tokens or internal database details.



\## 7. Design Considerations



\- Use HTTPS for all production traffic.

\- Validate and normalize input on the server.

\- Use parameterized SQL queries to prevent SQL injection.

\- Apply pagination to list endpoints.

\- Enforce authorization on every resource operation.

\- Use consistent JSON response and error formats.

\- Add rate limiting, monitoring and audit logging.

\- Version the API so future changes can be introduced safely.



