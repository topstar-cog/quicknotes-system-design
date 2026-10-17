

\# QuickNotes Data Model



\## 1. Database Choice



QuickNotes will use a relational SQL database such as PostgreSQL. Users, notes and tags have clear relationships, and the system needs referential integrity, transactions and reliable joins. SQL also supports indexing and structured queries for retrieving notes and their tags.



A NoSQL database could be useful for some high-volume, flexible workloads, but SQL is the better default for this application's core data because the relationships and consistency requirements are well defined.



\## 2. Entities and Columns



\### Users



| Column | Type | Key / constraint |

|---|---|---|

| id | BIGINT | Primary key, generated |

| username | VARCHAR(50) | Unique, not null |

| email | VARCHAR(255) | Unique, not null |

| password\_hash | VARCHAR(255) | Not null |

| created\_at | TIMESTAMPTZ | Not null |



Passwords must be stored as secure password hashes, never as plain text.



\### Notes



| Column | Type | Key / constraint |

|---|---|---|

| id | BIGINT | Primary key, generated |

| user\_id | BIGINT | Foreign key to users.id, not null |

| title | VARCHAR(100) | Not null |

| body | TEXT | Nullable |

| created\_at | TIMESTAMPTZ | Not null |

| updated\_at | TIMESTAMPTZ | Not null |



\### Tags



| Column | Type | Key / constraint |

|---|---|---|

| id | BIGINT | Primary key, generated |

| user\_id | BIGINT | Foreign key to users.id, not null |

| name | VARCHAR(50) | Not null |

| created\_at | TIMESTAMPTZ | Not null |



A tag name is unique within a user's account.



\### Note\_tags



| Column | Type | Key / constraint |

|---|---|---|

| note\_id | BIGINT | Part of composite primary key; foreign key to notes.id |

| tag\_id | BIGINT | Part of composite primary key; foreign key to tags.id |



The pair `(note\_id, tag\_id)` must be unique.



\## 3. Relationships



\- \*\*Users to notes — one-to-many:\*\* one user can own many notes, while each note belongs to one user.

\- \*\*Users to tags — one-to-many:\*\* one user can create many tags, while each tag belongs to one user.

\- \*\*Notes to tags — many-to-many:\*\* a note can have several tags, and a tag can be assigned to several notes. The `note\_tags` junction table implements this relationship.



The design should enforce ownership so users cannot associate their notes with tags belonging to other users.



\## 4. SQL Table Definitions



The following examples use PostgreSQL.



```sql

CREATE TABLE users (

&#x20;   id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

&#x20;   username VARCHAR(50) NOT NULL UNIQUE,

&#x20;   email VARCHAR(255) NOT NULL UNIQUE,

&#x20;   password\_hash VARCHAR(255) NOT NULL,

&#x20;   created\_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT\_TIMESTAMP

);



CREATE TABLE notes (

&#x20;   id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

&#x20;   user\_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

&#x20;   title VARCHAR(100) NOT NULL,

&#x20;   body TEXT,

&#x20;   created\_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT\_TIMESTAMP,

&#x20;   updated\_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT\_TIMESTAMP

);



CREATE TABLE tags (

&#x20;   id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

&#x20;   user\_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

&#x20;   name VARCHAR(50) NOT NULL,

&#x20;   created\_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT\_TIMESTAMP,

&#x20;   UNIQUE (user\_id, name)

);



CREATE TABLE note\_tags (

&#x20;   note\_id BIGINT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,

&#x20;   tag\_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,

&#x20;   PRIMARY KEY (note\_id, tag\_id)

);

```



\## 5. Example SQL Queries



\### Query 1: List a user's newest notes



```sql

SELECT id, title, body, created\_at

FROM notes

WHERE user\_id = 7

ORDER BY created\_at DESC

LIMIT 10;

```



\### Query 2: Retrieve notes with their tags (JOIN)



```sql

SELECT n.id, n.title, t.name AS tag\_name

FROM notes AS n

LEFT JOIN note\_tags AS nt ON nt.note\_id = n.id

LEFT JOIN tags AS t ON t.id = nt.tag\_id

WHERE n.user\_id = 7

ORDER BY n.id;

```



In a real API, the user ID must come from the authenticated session or token, not from an untrusted client parameter.



\### Query 3: Count notes per user



```sql

SELECT u.id, u.username, COUNT(n.id) AS note\_count

FROM users AS u

LEFT JOIN notes AS n ON n.user\_id = u.id

GROUP BY u.id, u.username

ORDER BY note\_count DESC;

```



\### Query 4: Find notes containing a word



```sql

SELECT id, title, body

FROM notes

WHERE user\_id = 7

&#x20; AND title ILIKE '%meeting%';

```



\## 6. Indexes



```sql

CREATE INDEX idx\_notes\_user\_created

ON notes (user\_id, created\_at DESC);

```



This index helps retrieve a user's most recent notes efficiently. The `user\_id` filter comes first, followed by the sort order. The foreign key on `note\_tags.note\_id` is already supported by its composite primary key; an additional index on `tag\_id` can help queries that start from a tag.



```sql

CREATE INDEX idx\_note\_tags\_tag

ON note\_tags (tag\_id);

```



Indexes improve reads but consume storage and add overhead to inserts, updates and deletes, so they should be chosen for actual query patterns.



\## 7. Data Integrity and Security



\- Foreign keys prevent orphaned notes and tag associations.

\- Cascading deletes remove dependent records when a user, note or tag is deleted.

\- Unique constraints prevent duplicate usernames, emails and tag names within one user account.

\- Application validation must enforce a non-empty title of no more than 100 characters.

\- Authorization must verify note and tag ownership for every operation.

\- Use parameterized queries and secure password hashing.



