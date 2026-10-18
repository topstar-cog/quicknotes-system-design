# QuickNotes data model

## Database choice

PostgreSQL is a good default for users, notes, and tags because these records have clear relationships and benefit from transactions, constraints, and joins. A different database could be added later for a specific workload, but the core records fit a relational model.

## Tables and relationships

- A user can own many notes and many tags.
- A note can have many tags, and a tag can be attached to many notes. The `note_tags` table represents this many-to-many relationship.
- Every association must connect a note and a tag owned by the same user.

## PostgreSQL table definitions

```sql
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 100),
    body TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, id)
);

CREATE TABLE tags (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, name),
    UNIQUE (user_id, id)
);

CREATE TABLE note_tags (
    user_id BIGINT NOT NULL,
    note_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (user_id, note_id)
        REFERENCES notes(user_id, id) ON DELETE CASCADE,
    FOREIGN KEY (user_id, tag_id)
        REFERENCES tags(user_id, id) ON DELETE CASCADE
);
```

The composite foreign keys on `note_tags` ensure that the note and tag belong to the same user. The extra `(user_id, id)` unique constraints provide valid referenced keys even though `id` is already the primary key. Passwords must be stored as secure password hashes, never as plain text.

`updated_at` gets its initial value from the default, but a default does not update the value on later edits. The application or a database trigger must set it whenever a note changes.

## Example queries

The value `:current_user_id` below is supplied by trusted server code after authentication, not accepted from an untrusted query parameter.

List the newest notes with a stable order:

```sql
SELECT id, title, body, created_at, updated_at
FROM notes
WHERE user_id = :current_user_id
ORDER BY created_at DESC, id DESC
LIMIT 10;
```

Retrieve a user's notes and their tags:

```sql
SELECT n.id, n.title, t.name AS tag_name
FROM notes AS n
LEFT JOIN note_tags AS nt
  ON nt.user_id = n.user_id AND nt.note_id = n.id
LEFT JOIN tags AS t
  ON t.user_id = nt.user_id AND t.id = nt.tag_id
WHERE n.user_id = :current_user_id
ORDER BY n.id;
```

Count notes per user:

```sql
SELECT u.id, u.username, COUNT(n.id) AS note_count
FROM users AS u
LEFT JOIN notes AS n ON n.user_id = u.id
GROUP BY u.id, u.username
ORDER BY note_count DESC;
```

## Indexes and search

The primary keys and unique constraints create indexes automatically. This index supports retrieving one user's newest notes in the same order used above:

```sql
CREATE INDEX idx_notes_user_created_id
ON notes (user_id, created_at DESC, id DESC);
```

The `note_tags` primary key starts with `note_id`, so add an index beginning with `tag_id` for reverse lookups:

```sql
CREATE INDEX idx_note_tags_tag_id
ON note_tags (tag_id);
```

A normal B-tree index does not speed up a search such as `ILIKE '%meeting%'`. For basic PostgreSQL full-text search across title and body, one option is a GIN expression index:

```sql
CREATE INDEX idx_notes_search
ON notes USING GIN (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
);
```

The query must use the same expression and still restrict results to the authenticated user:

```sql
SELECT id, title, body
FROM notes
WHERE user_id = :current_user_id
  AND to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
      @@ plainto_tsquery('english', :search_text)
ORDER BY created_at DESC, id DESC
LIMIT 10;
```

Indexes improve reads but consume storage and add write overhead. Add them for measured query patterns, and review query plans as data grows.

## Integrity and security

- Foreign keys prevent orphaned notes, tags, and associations.
- Cascading deletes remove dependent records when a user, note, or tag is deleted.
- Unique constraints prevent duplicate usernames, emails, and tag names per user.
- Constraints and server-side validation enforce non-empty titles and tag names.
- Authorization must verify ownership on every read and write.
- Parameterized queries prevent user input from being treated as SQL code.
