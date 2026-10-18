# QuickNotes API design

This document describes a proposed production API. The browser demo currently uses JSONPlaceholder and does not implement these production endpoints.

**Base URL:** `https://api.quicknotes.example/v1`

**Authentication:** protected routes require `Authorization: Bearer <access-token>` over HTTPS.

## Endpoints

| Method | Path | Purpose | Success response |
|---|---|---|---|
| `POST` | `/auth/register` | Register a user | `201 Created` |
| `POST` | `/auth/login` | Authenticate a user | `200 OK` |
| `GET` | `/notes` | Search and paginate the current user's notes | `200 OK` |
| `GET` | `/notes/{id}` | Get one of the current user's notes | `200 OK` |
| `POST` | `/notes` | Create a note | `201 Created` |
| `PATCH` | `/notes/{id}` | Update a note | `200 OK` |
| `DELETE` | `/notes/{id}` | Delete a note | `204 No Content` |
| `GET` | `/tags` | List the current user's tags | `200 OK` |
| `POST` | `/tags` | Create a tag | `201 Created` |
| `PUT` | `/notes/{id}/tags/{tagId}` | Assign a tag to a note | `204 No Content` |
| `DELETE` | `/notes/{id}/tags/{tagId}` | Remove a tag from a note | `204 No Content` |

Every note and tag operation must check ownership. The API derives the user ID from the verified token; it must not trust a `user_id` supplied by the client. For private resources, an API may return `404 Not Found` for both missing and non-owned records to avoid revealing that another user's record exists.

## Create a note

```http
POST /v1/notes
Authorization: Bearer <access-token>
Content-Type: application/json
```

Request:

```json
{
  "title": "Meeting notes",
  "body": "Discuss project milestones and deadlines."
}
```

The title is required and must contain 1–100 characters after trimming. The body is optional. The server generates the ID, owner, and timestamps.

Response: `201 Created`

```json
{
  "id": 101,
  "user_id": 7,
  "title": "Meeting notes",
  "body": "Discuss project milestones and deadlines.",
  "created_at": "2026-10-17T10:00:00Z",
  "updated_at": "2026-10-17T10:00:00Z"
}
```

## List notes

```http
GET /v1/notes?q=meeting&limit=10&cursor=eyJjcmVhdGVkX2F0IjoiLi4uIn0
Authorization: Bearer <access-token>
```

The optional `q` parameter searches the authenticated user's notes. The cursor is an opaque value returned by the previous response. Keyset pagination avoids increasingly expensive offsets as a user's notes grow. An empty list is still `200 OK` with an empty `data` array.

Response: `200 OK`

```json
{
  "data": [
    {
      "id": 101,
      "title": "Meeting notes",
      "body": "Discuss project milestones and deadlines.",
      "created_at": "2026-10-17T10:00:00Z",
      "updated_at": "2026-10-17T10:00:00Z"
    }
  ],
  "pagination": {
    "next_cursor": null,
    "has_more": false
  }
}
```

The API returns only notes owned by the authenticated user. The ordering should be stable, for example by `created_at DESC, id DESC`, and the cursor should encode both ordering values.

## Error responses

| Status | Meaning | Example |
|---|---|---|
| `400 Bad Request` | Malformed request | Invalid JSON |
| `401 Unauthorized` | Authentication is missing or invalid | Expired token |
| `404 Not Found` | Resource is missing or not visible to this user | Note ID does not exist or is not owned by the user |
| `409 Conflict` | Request conflicts with existing data | Duplicate username |
| `422 Unprocessable Content` | Valid JSON fails field validation | Title is empty or too long |
| `429 Too Many Requests` | Rate limit exceeded | Too many requests in a short period |
| `500 Internal Server Error` | Unexpected server failure | Unhandled application error |

Example validation response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The title must contain between 1 and 100 characters.",
    "details": {
      "field": "title"
    }
  }
}
```

Error responses must not expose stack traces, passwords, access tokens, or internal database details.

## Design notes

- Validate and normalize input on the server; browser validation is only a usability aid.
- Use parameterized SQL, HTTPS, rate limits, and secure password hashing.
- Enforce authorization on every resource operation.
- Use a consistent response and error format, and version the API.
- Make tag assignment idempotent: repeating the same `PUT` should not create duplicate links.
