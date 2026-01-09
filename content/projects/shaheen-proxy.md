---
title: "Shaheen Proxy: Intelligent Middleware & Router"
date: 2026-01-08
type: projects
description: "A high-performance aggregation server written in Rust that standardizes upstream proxy providers, implementing traffic sanitization and dynamic routing."
tags: ["project", "rust", "networking", "distributed-systems", "high-performance", "security"]
image: "https://raw.githubusercontent.com/remaldev/shaheen-proxy/refs/heads/main/shaheen%3A%3Alogo.jpg"
---

# Shaheen Proxy
### High-Performance Proxy Aggregation & Routing Middleware

![Status](https://img.shields.io/badge/Status-Active_Development-0052CC)
![Language](https://img.shields.io/badge/Language-Rust_2021-000000)
![Architecture](https://img.shields.io/badge/Architecture-Asynchronous_Tokio-009688)

Shaheen Proxy is a specialized middleware server developed in **Rust**. It functions as a unified gateway that aggregates disparate upstream proxy providers (SOCKS5, HTTP) into a single, standardized interface. By abstracting the complexity of vendor-specific implementations, it allows client applications to interact with a distributed pool of resources through a coherent API, handling session management, protocol translation, and security enforcement transparently.

## Technical Overview & Problem Statement

In automated data retrieval infrastructure, managing proxy resources is a significant friction point. Different providers impose unique authentication schemas, rate-limiting headers, and error formats.

**Core Capabilities:**
1.  **Unified Interface:** Abstraction of vendor-specific protocols into a single standard. Clients interface with Shaheen, which manages the translation logic for upstream providers.
2.  **Traffic Sanitization (Whitelabeling):** The proxy acts as a security firewall for response metadata. It intercepts upstream error messages (e.g., vendor-specific bandwidth limits or 403s) and translates them into generic HTTP status codes, preventing information leakage about the underlying infrastructure.
3.  **Stateless Routing:** Complex routing logic—such as distinct geolocation targets or session stickiness—is encoded directly in the credentials (`user_country-US_session-1a`), keeping the API stateless and scalable.

## Dynamic Template Engine

One of the system's most innovative features is its **Data-Driven Adapter Layer**. Instead of hardcoding logic for every new proxy provider, Shaheen utilizes a flexible JSON-based template system. This allows the routing engine to dynamically construct authentication strings and connection URLs based on the target provider's requirements.

**How it works:**
The system maps generic parameters (User, Country, Session) to vendor-specific formats using configuration templates.

**Example Configuration (Dummy Data):**

```json
"templates": {
  "CloudRotator": {
    "url_format": "http://customer-{user}-cc-{country}-sess-{session}:{password}@{host}:{port}",
    "default_params": { "country": "us" }
  },
  "StaticBackbone": {
    "url_format": "socks5://{user}:{password}_country_{country}@{host}:{port}",
    "requires_whitelist": true
  }
}
```

When a request arrives, the `ProxyManager` identifies the optimal provider and hydrates the corresponding template. This architecture allows for the addition of new upstream vendors via configuration updates alone, requiring zero code changes or recompilation.

## Architecture & Implementation

The system is built on the **Tokio** asynchronous runtime to ensure non-blocking I/O operations, critical for high-throughput middleware.

### Stack
*   **Core Runtime:** Tokio (Multi-threaded work stealing scheduler)
*   **Protocol Layer:** Hyper (HTTP/1 & HTTP/2 implementation)
*   **Upstream Client:** Reqwest (customized for high-concurrency pooling)

### Request Flow

![REQ FLOW DIAGRAM](/assets/shaheen/shaheen-architecture.svg)

### The Interceptor Pattern:

![shaheen-Interceptor-Pattern.svg](/assets/shaheen/shaheen-Interceptor-Pattern.svg)

A critical component for stability is the **Connection Pre-flight & Interception** mechanism. Standard tunneling behaviors can cause client crashes if an upstream proxy returns an HTML error body during a handshake (e.g., a "407 Proxy Auth Required" page instead of a TCP stream).

Shaheen implements a "Look-Ahead" buffer during the connection phase:

1.  **Establish Upstream:** The server connects to the provider but holds the client connection.
2.  **Analyze Handshake:** It inspects the first packet returned by the upstream.
3.  **Sanitize:** If the upstream returns a provider-specific error (leaking vendor info), Shaheen intercepts it, logs the detailed telemetry internally, and returns a generic `502 Bad Gateway` or `503 Service Unavailable` to the client.
4.  **Confirm:** Only upon a successful `200 Connected` response is the byte stream bridged to the client.

## Scalability Challenges & Future Architecture

While the current implementation performs robustly on a single node (handling hundreds of concurrent threads), distinct challenges emerge under extreme load (1000+ RPS).

### Current Bottlenecks
1.  **Session Locking:** The internal session storage uses standard Mutex locks (`std::sync::Mutex`). Under high concurrency, lock contention for reading/writing session states becomes a performance bottleneck.
2.  **Ephemeral Port Exhaustion:** Basic connection pooling can struggle with rapid recycling of outgoing connections to hundreds of different upstream IPs.

### Distributed Roadmap:

![shaheen-distributed-Pattern](/assets/shaheen/shaheen-distributed-Pattern.svg)
To move from a single-node utility to an enterprise-grade cluster, the architecture is evolving towards a distributed model:

1.  **Horizontal Scaling:** Deploying multiple stateless Shaheen nodes behind a Layer 4 Load Balancer (e.g., HAProxy or NGINX).
2.  **Distributed State Management:** Refactoring the internal `HashMap` session storage to use an external, low-latency store like **Redis**. This will allow session stickiness to persist across different nodes in the cluster.
3.  **Circuit Breaking:** Implementing robust failure detection that temporarily removes underperforming upstream nodes from the rotation pool across the entire cluster.

## Status

The project is functional and in active development.

*   **Core Status:** Stable Alpha.

*   **Protocol Support:** HTTP CONNECT, SOCKS5.
*   **Security:** Active traffic masking and error sanitization.

### Active Engineering Tasks
 

- [ ] **Refactor Session Management:** migrating from in-memory Mutex maps to lock-free concurrent data structures (e.g., `DashMap`) or external Redis storage.
- [ ] **Load Balancing Strategy:** Designing the deployment architecture for multi-node orchestration.
- [ ] **Observability:** Integrating standard metrics (Prometheus) to visualize lock contention and upstream latency distribution.

