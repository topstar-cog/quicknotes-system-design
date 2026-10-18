# QuickNotes system architecture

## 1. Overview

The browser demo calls JSONPlaceholder. This document describes a possible production service: a browser or mobile client calls an authenticated API, which validates requests and reads or writes persistent data. The estimates below are planning examples, not measured traffic or a promise that a particular design will meet a service target.

## 2. Requirements

### Functional

- Users can register and authenticate.
- Users can create, view, update, and delete their own notes.
- Users can create tags and assign tags to their notes.
- Users can search and paginate through their notes.
- The API validates data and returns consistent responses and errors.
- Users cannot read or change another user's private data.
- The service records operational health and failures.

### Non-functional

- **Scalability:** add application instances as demand grows.
- **Availability:** avoid depending on one application server or failure zone.
- **Performance:** cache suitable reads and serve static assets from a CDN.
- **Security:** use HTTPS, authentication, authorization, and protected secrets.
- **Durability:** store data in a database with backups and tested recovery.
- **Consistency:** write to the primary database and manage cache invalidation.
- **Maintainability:** version the API and use tests, logs, and monitoring.
- **Recoverability:** define and test recovery time and recovery point objectives.

## 3. Example capacity estimates

Assumptions:

- 1,000,000 registered users.
- 10% are active each day: 100,000 daily active users.
- Each active user requests 50 notes per day and creates 1 note per day.
- Each note averages 2 KB of text and metadata.
- One day has 86,400 seconds; peak traffic is estimated at five times average.

### Reads

100,000 users × 50 note reads/day = 5,000,000 note reads/day.

5,000,000 ÷ 86,400 ≈ **58 average note reads per second**. At five times average, plan for about **290 reads per second** as a starting estimate.

### Writes

100,000 users × 1 note/day = 100,000 note writes/day.

100,000 ÷ 86,400 ≈ **1.16 average writes per second**. At five times average, plan for about **6 writes per second**, before edits, deletes, tags, and retries.

### Storage

100,000 notes/day × 2 KB = 200,000 KB/day, or about 200 MB/day using decimal units. Over 365 days, that is about **73 GB/year** for note content and metadata.

This excludes indexes, backups, replicas, logs, attachments, and database overhead. Registered users are not the same as active users, and averages hide bursts. Measure actual traffic, response times, cache hit rates, and database load, then revise the estimates.

## 4. Logical architecture

```text
                         +-------------------+
                         |   User / Browser  |
                         +---------+---------+
                                   |
                                  DNS
                           ________|________
                          /                 \
              Static asset requests      API requests
                        |                    |
                      CDN              Load balancer
                                             |
                                  +----------+----------+
                                  |                     |
                              App server            App server
                                  |                     |
                                  +----------+----------+
                                             |
                                         API service
                                   _________|_________
                                  /         |         \
                              Cache    Primary DB    Queue
                                          |             |
                                    Read replica      Worker
```

This is a logical diagram, not a deployment blueprint. Static asset requests go to the CDN; API requests go to the load balancer. A worker consumes queued jobs. Managed, redundant services and secure network connections would be selected for an actual deployment.

## 5. Components

- **DNS:** directs the service name to the appropriate public endpoint.
- **CDN:** serves cached static files near users and reduces origin traffic.
- **Load balancer:** routes API requests to healthy application instances.
- **Application servers:** run the API and allow horizontal scaling.
- **API service:** authenticates users, checks ownership, validates input, and applies business rules.
- **Cache:** reduces repeat database reads. Private data keys must include the user identity.
- **Primary database:** accepts authoritative writes and enforces data integrity.
- **Read replica:** can serve eligible reads, subject to replication lag.
- **Queue and worker:** handle non-essential background jobs outside the request path.
- **Monitoring, backups, and recovery procedures:** help detect, diagnose, and recover from failures.

## 6. Read flow: `GET /notes`

1. The client sends an HTTPS request to the API domain.
2. DNS and the load balancer route the request to a healthy application instance.
3. The API validates the access token and identifies the user.
4. The API checks a cache key scoped to that user and the filters or cursor.
5. On a cache miss, the API reads from a replica when its freshness is acceptable; otherwise it reads from the primary.
6. The API returns only that user's notes in a stable, paginated order and may cache the result for a controlled period.
7. Monitoring records latency, status, and relevant metrics without recording secrets.

## 7. Write flow: `POST /notes`

1. The client sends JSON over HTTPS.
2. The API authenticates the user and validates the title and body.
3. In a transaction, the API writes the note to the primary database with the authenticated user's ID.
4. After commit, the API invalidates or updates affected cache entries.
5. If extra work is needed, the API publishes a background job and returns `201 Created` with the new note.
6. A worker handles the job independently, with idempotency, bounded retries, and monitoring.

The API must not report successful creation before the database commit succeeds. A transactional outbox can help reliably coordinate a database write and publishing a queue event.

## 8. Trade-offs

- **Cache freshness and speed:** caching lowers latency and database load but can return stale data. Use justified time-to-live values, invalidate affected keys after writes, and scope private keys to users.
- **Read replicas and consistency:** replicas spread read load but can lag. Use the primary or a consistency-aware approach for read-after-write requests.
- **Queues and immediate completion:** queues absorb bursts and keep slow tasks off the request path, but jobs can be delayed or retried. Make workers idempotent and monitor failed jobs.
- **Availability and cost:** multiple instances, replicas, backups, and failure zones improve resilience but raise cost and complexity. Scale according to measured demand and service objectives.

## 9. Reducing single points of failure

- Run at least two application instances across separate failure zones and use health checks.
- Use highly available load balancing and redundant DNS.
- Configure database failover, backups, and point-in-time recovery; test restoration.
- Use a durable queue with retry limits and monitoring.
- Keep the database as the source of truth; the cache must not be required for correctness.
- Monitor service health and practice recovery procedures.

Redundancy reduces the impact of individual failures but cannot guarantee zero downtime. Recovery procedures need regular testing.
