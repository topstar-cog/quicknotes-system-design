

\# QuickNotes System Architecture



\## 1. Overview



QuickNotes is moving from a browser-only application to an online service designed to support one million registered users. The browser client communicates with an API, which authenticates requests, validates data and accesses persistent storage. Caching, load balancing and asynchronous workers help the service handle growth.



\## 2. Functional Requirements



1\. Users can register and authenticate securely.

2\. Users can create, view, update and delete their own notes.

3\. Users can create tags and assign tags to notes.

4\. Users can search and paginate through notes.

5\. The API validates input and returns consistent JSON responses and error codes.

6\. Users cannot access or modify another user's private notes.

7\. The service reports failures and supports operational monitoring.



\## 3. Non-Functional Requirements



\- \*\*Scalability:\*\* add application instances to handle growing traffic.

\- \*\*Availability:\*\* avoid relying on one application server or one availability zone.

\- \*\*Performance:\*\* cache frequently requested data and deliver static assets through a CDN.

\- \*\*Security:\*\* use HTTPS, secure authentication, authorization and encrypted secrets.

\- \*\*Durability:\*\* persist notes in a database with backups and tested recovery.

\- \*\*Consistency:\*\* commit note writes to the primary database and manage cache invalidation.

\- \*\*Maintainability:\*\* use versioned APIs, automated tests, logs and monitoring.

\- \*\*Recoverability:\*\* define recovery time and recovery point objectives and test failover procedures.



\## 4. Load Estimates for One Million Users



These are planning estimates, not measured production traffic.



\### Assumptions



\- 1,000,000 registered users.

\- 10% are active daily: 100,000 daily active users.

\- Each active user reads 50 notes or feed items per day.

\- Each active user creates 1 note per day.

\- Each note averages 2 KB of text and metadata.

\- Use 86,400 seconds per day for average request-rate calculations.

\- Storage estimate excludes indexes, backups, replication, logs and database overhead.



\### Reads per second



100,000 active users × 50 reads/day = 5,000,000 reads/day.



5,000,000 ÷ 86,400 ≈ \*\*58 average reads per second\*\*.



For capacity planning, if peak traffic is five times the average, plan for approximately \*\*290 reads per second\*\* initially.



\### Writes per second



100,000 active users × 1 note/day = 100,000 note writes/day.



100,000 ÷ 86,400 ≈ \*\*1.16 average note writes per second\*\*.



At five times the average, plan for approximately \*\*6 writes per second\*\*, before accounting for edits, deletes, tags and retries.



\### Storage per year



100,000 notes/day × 2 KB = 200,000 KB/day, approximately 200 MB/day using decimal units.



200 MB/day × 365 ≈ \*\*73 GB/year\*\* of new note content and metadata.



This estimate is only for note records. Attachments, indexes, audit logs, backups, replicas and operational overhead can increase storage substantially.



\### Capacity caveat



Registered users are not the same as active users, and averages hide traffic bursts. Monitor real request rates, response times, cache hit rates and database load, then revise the estimates as actual usage becomes available.



\## 5. Architecture Diagram



```text

&#x20;                    Users / Browser

&#x20;                           |

&#x20;                          DNS

&#x20;                           |

&#x20;                    CDN (static assets)

&#x20;                           |

&#x20;                     Load Balancer

&#x20;                      /          \\

&#x20;                App Server 1   App Server 2

&#x20;                      \\          /

&#x20;                       API Service

&#x20;                      /     |      \\

&#x20;                   Cache  Primary DB  Queue

&#x20;                     |        |        |

&#x20;                   Reads   Read Replica Worker

&#x20;                                 ^       |

&#x20;                                 |       |

&#x20;                             DB replication

&#x20;                                         |

&#x20;                                   Background jobs

```



The diagram is logical: the production deployment should use managed, redundant services and secure network connections. The worker reads queued jobs and writes results to the database or object storage where needed.



\## 6. Components and the Problems They Solve



\- \*\*Client/browser:\*\* provides the user interface for creating, viewing, editing and deleting notes.

\- \*\*DNS:\*\* translates the public service domain into the appropriate network destination.

\- \*\*CDN:\*\* serves cached static files close to users, reducing origin traffic and latency.

\- \*\*Load balancer:\*\* distributes incoming API traffic across healthy application instances.

\- \*\*App Server 1 and App Server 2:\*\* run the API so requests can continue if one instance fails and capacity can be increased horizontally.

\- \*\*API service:\*\* validates requests, authenticates users, enforces authorization and applies business rules.

\- \*\*Cache:\*\* stores frequently accessed data to reduce repeated database reads and improve response times.

\- \*\*Primary database:\*\* accepts authoritative writes and maintains transactional data integrity.

\- \*\*Read replica:\*\* serves eligible read queries to reduce load on the primary database.

\- \*\*Queue:\*\* buffers background work so slow tasks do not block normal API responses.

\- \*\*Worker:\*\* processes queued tasks such as notifications, indexing or future attachment processing.

\- \*\*Monitoring and alerts:\*\* detect elevated errors, latency, resource exhaustion and failed background jobs.

\- \*\*Backups and recovery procedures:\*\* protect against accidental deletion, corruption and infrastructure failures.



\## 7. GET /notes Request Flow



1\. The browser resolves the API domain through DNS.

2\. The request travels over HTTPS to the load balancer.

3\. The load balancer routes it to a healthy application server.

4\. The API validates the access token and identifies the user.

5\. The API checks the cache using a key scoped to that user and the requested pagination or filters.

6\. On a cache hit, the API returns the cached result after applying appropriate authorization rules.

7\. On a cache miss, the API queries the read replica when replication freshness is acceptable; otherwise, it uses the primary database.

8\. The API caches the result for a controlled period and returns a paginated JSON response.

9\. Monitoring records latency, status code and relevant operational metrics without logging secrets.



\## 8. POST /notes Request Flow



1\. The browser submits a JSON request over HTTPS.

2\. DNS resolves the service domain, and the load balancer selects a healthy application server.

3\. The API authenticates the user and validates the title and body.

4\. The API writes the note to the primary database in a transaction, associating it with the authenticated user.

5\. After the database confirms the commit, the API invalidates or updates affected cache entries.

6\. If additional work is needed, the API publishes a job to the queue; the request should not wait for non-essential background work.

7\. The API returns `201 Created` with the new note and its identifier.

8\. A worker processes queued work independently and retries transient failures with limits and monitoring.



The database write must succeed before the API reports successful note creation. Cache invalidation and job publishing need reliable handling, such as a transactional outbox, if losing an event would cause inconsistent behavior.



\## 9. Trade-Offs



\### Cache freshness versus performance



Caching reduces database load and response latency, but cached data can become stale. Use short, justified TTLs, invalidate affected keys after successful writes, and avoid caching private data under keys shared by different users.



\### Read replicas versus consistency



Read replicas distribute read traffic but may lag behind the primary database. Read-after-write operations should use the primary or a consistency-aware strategy so users can see their own recent changes.



\### Asynchronous work versus immediate completion



Queues keep slow processing out of the request path and absorb bursts. However, jobs can be delayed or retried. Use idempotent workers, bounded retries, dead-letter handling and queue monitoring.



\### Availability versus cost



Multiple instances, replicas, backups and multiple availability zones improve resilience but increase operating costs and complexity. Start with justified redundancy and scale based on measured demand and service objectives.



\## 10. Avoiding Single Points of Failure



\- Run at least two application instances across separate failure domains and use health checks.

\- Use a highly available load balancer and redundant DNS service.

\- Deploy the database with a tested failover configuration, backups and point-in-time recovery.

\- Use a managed, durable queue with retry and monitoring capabilities.

\- Avoid relying on one cache instance for correctness; the database remains the source of truth.

\- Replicate critical data and regularly test restoration and failover.

\- Monitor service health and alert on failures before they cause prolonged outages.



Redundancy reduces the impact of individual failures but does not guarantee zero downtime. Recovery procedures must be tested.



