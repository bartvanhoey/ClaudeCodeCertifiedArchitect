# Multi-Agent System Topologies: Hub-and-Spoke, Peer-to-Peer/Mesh, Hierarchical

Companion note to [`Domain1-AgenticArchitecture.md`](./Domain1-AgenticArchitecture.md) (Task Statement 1.2 covers
hub-and-spoke in depth). This file puts all three common multi-agent topologies side by side —
what they are, when to reach for each, and their tradeoffs — so the choice between them is a
deliberate design decision rather than a default.

---

## 1. Hub-and-Spoke (Coordinator–Subagent)

### Structure

One coordinator ("hub") sits at the center. All subagents ("spokes") talk **only** to the
coordinator — never to each other. The coordinator decomposes tasks, delegates, aggregates
results, and handles errors.

```
        ┌─────────────┐
        │ Coordinator │
        └──┬───┬───┬──┘
     ┌──────┘   │   └──────┐
┌────▼───┐  ┌────▼───┐ ┌────▼───┐
│Search  │  │Analysis│ │Writer  │
│Subagent│  │Subagent│ │Subagent│
└────────┘  └────────┘ └────────┘
```

If Analysis needs something from Search, it goes Search → Coordinator → Analysis. This is
deliberate: it keeps error handling, retries, and logging in one place instead of scattered
across N² potential subagent-to-subagent links.

### Use case

**Research report generation.** A user asks for a competitive analysis report. The coordinator
decomposes the request into a `search` subagent (gathers sources), an `analysis` subagent
(extracts findings), and a `writer` subagent (produces the final report). The coordinator
decides which subagents are needed per query, routes findings between them, evaluates the
final output for gaps, and re-delegates targeted follow-ups if coverage is thin.

### Advantages

- **Single point of observability** — every interaction flows through the hub, so logging,
  monitoring, and auditing the whole system means watching one place.
- **Centralized error handling** — the coordinator decides how to react to a failed or
  low-quality subagent result (retry, reroute, degrade gracefully) instead of that logic being
  duplicated everywhere.
- **Simple to reason about and extend** — adding a new spoke means teaching the hub about it;
  you don't need to update every other spoke's knowledge of the system.
- **Low connection count** — N spokes need N links to the hub, not up to N² links to each other.

### Disadvantages

- **Hub is a single point of failure** — if the coordinator crashes or is misconfigured, the
  entire system stalls, even if every spoke is individually healthy.
- **Hub can become a bottleneck** — every piece of inter-agent information passes through one
  node, which caps throughput as spoke count or message volume grows.
- **Extra hop latency** — spoke-to-spoke information always detours through the hub, even when
  a direct exchange would be cheaper.
- **Decomposition risk** — if the hub splits a task too narrowly, the union of spoke outputs
  can miss whole facets of the original goal (a hub-level risk, not a spoke failure — see 1.2's
  "narrow task decomposition" pitfall).

---

## 2. Peer-to-Peer / Mesh

### Structure

There is no central coordinator. Every agent can communicate directly with every other agent
it needs to. Control is decentralized — decisions emerge from negotiation between peers rather
than being handed down from a hub.

```
┌────────┐         ┌────────┐
│Agent A │◄───────►│Agent B │
└───┬────┘         └────┬───┘
    │      ╲       ╱     │
    │       ╲     ╱      │
    │        ╲   ╱       │
    ▼         ╲ ╱        ▼
┌────────┐     X     ┌────────┐
│Agent D │◄───┴─┴────►│Agent C │
└────────┘            └────────┘
```

### Use case

**Multi-agent negotiation / auction systems** — e.g., a fleet of warehouse-robot agents
bidding on delivery tasks. Each robot agent knows its own position, battery level, and current
load, and negotiates directly with nearby robots to decide who takes which task. There's no
practical benefit to routing every bid through a central dispatcher when the relevant
information (proximity, availability) is inherently local to the peers involved — direct
peer negotiation resolves it faster and keeps working even if some robots go offline.

Another common example: **distributed sensor/monitoring networks**, where nearby nodes
cross-validate each other's readings directly rather than every reading being relayed through
one central node first.

### Advantages

- **No single point of failure** — there's no hub whose outage takes down the whole system;
  the network degrades gracefully as individual peers drop out.
- **Scales without a central bottleneck** — throughput isn't capped by one node's capacity,
  since work and communication are distributed across peers.
- **Lower latency for local interactions** — two agents that need to coordinate can do so
  directly, without a round trip through a hub that has no real stake in that exchange.
- **Resilience through redundancy** — the same capability can often be reached via multiple
  paths through the mesh.

### Disadvantages

- **Hard to observe and debug** — there's no single place to look to understand system-wide
  state; you have to reconstruct behavior from many pairwise interactions.
- **Coordination complexity grows fast** — up to N² potential connections between N agents;
  reasoning about emergent behavior (deadlocks, conflicting decisions, race conditions) is
  much harder than with a hub funneling everything through one decision point.
- **No natural place for global policy enforcement** — a rule like "never approve two
  conflicting actions at once" has no obvious single enforcement point, unlike a hub where a
  gate/hook can guard a chokepoint (see 1.4/1.5's programmatic-enforcement theme).
- **Emergent behavior can be unpredictable** — without central arbitration, peers can reach
  inconsistent or contradictory conclusions that nobody individually intended.

---

## 3. Hierarchical

### Structure

A tree of coordinators. A top-level coordinator delegates to mid-level coordinators, each of
which manages its own set of subagents (or further sub-coordinators). It's hub-and-spoke,
recursively nested — a generalization used when a single hub would have too many direct spokes
or too many unrelated concerns to manage well.

```
                ┌───────────────┐
                │ Top Coordinator│
                └──┬──────────┬─┘
          ┌────────┘          └────────┐
    ┌─────▼──────┐              ┌──────▼─────┐
    │ Team Lead A │              │ Team Lead B │
    └──┬───────┬─┘              └──┬───────┬──┘
  ┌────▼──┐ ┌──▼───┐          ┌────▼──┐ ┌──▼───┐
  │Agent 1│ │Agent 2│          │Agent 3│ │Agent 4│
  └───────┘ └───────┘          └───────┘ └───────┘
```

### Use case

**Large-scale software engineering agent system** — a top-level coordinator receives "migrate
this monorepo to the new build system." It delegates to a "Backend Team Lead" coordinator and
a "Frontend Team Lead" coordinator, each of which independently decomposes and manages its own
subagents (per-service migration agents, test-runner agents, etc.) without the top-level
coordinator needing to micromanage every individual file change. This mirrors how a real
engineering org is structured — an EM doesn't personally review every line, but does own
cross-team coordination and final integration.

### Advantages

- **Manages complexity through delegated scope** — no single node needs to hold the full
  system's detail in view; each coordinator only needs to understand its own subtree.
- **Bounded span of control** — a coordinator with 4 direct reports is easier to reason about
  and debug than one hub juggling 40 spokes directly; hierarchy keeps any one node's fan-out
  manageable.
- **Failure containment** — a failure inside one branch (e.g., the frontend sub-tree) can be
  handled or retried within that branch without necessarily taking down unrelated branches.
- **Reuses the hub-and-spoke pattern recursively** — the same observability, error-handling,
  and delegation benefits apply at each level, just partitioned by subtree.

### Disadvantages

- **Latency compounds with depth** — a request/response may need to traverse multiple levels
  up and down the tree, each hop adding overhead, worse than a flat hub-and-spoke for shallow
  tasks.
- **Cross-branch coordination is awkward** — if Agent 1 (under Team Lead A) needs something
  from Agent 3 (under Team Lead B), the request must travel up to a common ancestor and back
  down, since siblings' subagents still can't talk directly (same restriction as hub-and-spoke,
  just deeper).
- **More moving parts to design and observe** — every level needs its own decomposition logic,
  and full-system observability now means stitching together logs across multiple
  coordinators instead of just one.
- **Overkill for small systems** — introducing intermediate coordinators when a flat
  hub-and-spoke would have comfortably handled the fan-out just adds hops and complexity for
  no benefit.

---

## Choosing between them

| Situation | Best fit |
|---|---|
| A handful of specialized subagents, one clear owner of the overall task | **Hub-and-spoke** |
| Agents need to negotiate or exchange information peer-to-peer, no natural central authority, resilience to individual node failure matters | **Peer-to-peer / mesh** |
| The task is large enough that a single coordinator would have too many direct spokes or too many unrelated concerns | **Hierarchical** |
| Strong requirement for centralized policy enforcement, auditing, or deterministic gating (see Task Statement 1.4/1.5) | **Hub-and-spoke** or **hierarchical** — mesh has no natural chokepoint for this |

In practice, most systems default to hub-and-spoke unless there's a specific reason to reach
for mesh (decentralization/resilience requirements) or hierarchical (scale requirements that
would overload a single hub).
