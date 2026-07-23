# Domain 1: Agentic Architecture & Orchestration

Study guide for the **Claude Certified Architect – Foundations** exam.
Source: https://anthropic-partners.skilljar.com/claude-certified-architect-foundations-certification

Format: for each Task Statement — concept explanation, the distinction the exam is actually testing, code-grounded examples, common wrong answers, and practice Q&A.

---

## Task Statement 1.1 — Agentic loops for autonomous task execution

### The core concept

An agentic loop is not "call the model in a while loop." It's a specific, mechanical protocol:

1. Send Claude the conversation (messages array) plus available `tools`.
2. Claude responds with a `stop_reason`.
3. **If `stop_reason == "tool_use"`**: Claude's response contains one or more `tool_use` content blocks. You execute those tools yourself (Claude does not execute anything — it only requests). You then send a new message back with `role: "user"` containing `tool_result` blocks matching each `tool_use_id`.
4. **If `stop_reason == "end_turn"`**: Claude believes the task is complete (or it's just giving a plain conversational answer). The loop terminates.
5. Go to step 1 with the updated message history.

The entire mechanism for the model to "keep going" is: *the tool results you append become part of the context Claude reasons over on the next call.* There is no hidden state on Anthropic's servers between calls — every call is stateless and re-reads the full conversation you send.

```python
messages = [{"role": "user", "content": "What's the weather in Paris, then book a flight there if it's sunny."}]

while True:
    response = client.messages.create(
        model="claude-sonnet-5",
        max_tokens=1024,
        tools=tools,
        messages=messages,
    )

    messages.append({"role": "assistant", "content": response.content})

    if response.stop_reason == "tool_use":
        tool_results = []
        for block in response.content:
            if block.type == "tool_use":
                result = execute_tool(block.name, block.input)   # you write this
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result,
                })
        messages.append({"role": "user", "content": tool_results})
        continue   # loop again — Claude reasons over the new results

    if response.stop_reason == "end_turn":
        break   # Claude is done
```

### The distinction the exam is testing

**Model-driven decision-making vs. pre-configured decision trees.**

- Model-driven: Claude looks at the current context (original goal + all tool results so far) and *decides* which tool to call next, or whether to stop. The developer does not hardcode "after tool A, call tool B."
- Decision tree / hardcoded sequence: the *application code* decides the next step (`if tool_A_succeeded: call_tool_B()`), and Claude is just an executor for individual steps.

The agentic loop pattern is specifically the model-driven version — the control flow in your code is generic (`while stop_reason == tool_use: execute and continue`), and *all* domain reasoning about "what to do next" lives in Claude, driven by what's in the conversation.

### Anti-patterns (things a wrong exam answer will describe)

| Anti-pattern | Why it's wrong |
|---|---|
| Parsing Claude's natural-language text for phrases like "I'm done" or "Task complete" to decide when to stop the loop | Fragile, not what `stop_reason` is for. Use the structured `stop_reason` field, never string-match assistant text. |
| Using a fixed iteration cap (e.g., "stop after 10 loops") as the *primary* stopping mechanism | A cap is a reasonable **safety net** (prevents runaway loops/cost), but the *primary* termination signal must be `stop_reason == "end_turn"`. If your main stop logic is "loop 10 times then quit," that's the anti-pattern. |
| Checking `if response.content has text` (i.e., "if there's any assistant text, we must be done") | Claude can emit explanatory text *and* a `tool_use` block in the same turn. Text presence is not a completion signal — only `stop_reason` is authoritative. |
| Forgetting to append tool results to `messages` before the next call | Without this, Claude has no memory of what the tool returned and cannot reason about next steps — it will either repeat the call or hallucinate a result. |

### Practice Q&A

**Q1.** An agent's control loop checks `if "done" in response.text.lower(): break`. What's wrong with this design, and what should replace it?
> **A.** It parses natural language as a control signal — brittle and unreliable (Claude may say "done" mid-explanation without meaning to terminate, or finish without using that word). Replace with checking `response.stop_reason == "end_turn"`.

**Q2.** True or false: Claude executes the tool itself when it returns a `tool_use` block.
> **A.** False. Claude only *requests* a tool call. The client/application code is responsible for actually executing it and returning a `tool_result`.

**Q3.** Why is a max-iteration cap still recommended even though it shouldn't be the primary stop condition?
> **A.** As a safety bound against runaway loops (cost, infinite loops from a confused agent) — a backstop, not the intended termination mechanism.

**Q4.** In the message array, what role is used to send `tool_result` blocks back to Claude?
> **A.** `"user"` — tool results are sent as user-role messages, even though they're generated by your code, not a human.

---

## Task Statement 1.2 — Coordinator–subagent orchestration (hub-and-spoke)

### The core concept

**Hub-and-spoke**: one coordinator agent sits at the center. All subagents ("spokes") talk *only* to the coordinator — never to each other directly. The coordinator is responsible for:

- **Task decomposition** — breaking a complex query into subtasks.
- **Delegation** — deciding *which* subagents to invoke (not necessarily all of them).
- **Result aggregation** — collecting and synthesizing subagent outputs.
- **Error handling** — if a subagent fails or returns low-quality output, the coordinator decides what to do (retry, reroute, degrade gracefully).
- **Observability** — because everything flows through one place, you can log/monitor/audit the entire system from a single point.

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

Subagents never call each other. If Analysis needs something from Search, it goes: Search → Coordinator → Analysis. This is deliberate — it keeps error handling, retries, and logging in one place instead of scattered across N² potential subagent-to-subagent links.

### Key knowledge points

- **Subagents have isolated context.** They do *not* automatically inherit the coordinator's conversation history. If the coordinator has been talking to the user for 20 turns, a freshly spawned subagent sees none of that unless the coordinator explicitly puts it in the subagent's prompt (this connects directly to Task Statement 1.3).
- **Dynamic subagent selection.** A well-designed coordinator doesn't always invoke the full pipeline (e.g., Search → Analysis → Synthesis) for every query. It should analyze query complexity/requirements and select only the subagents actually needed. A simple factual question might skip the deep-analysis subagent entirely.
- **Risk: overly narrow task decomposition.** If the coordinator splits a broad research topic into subtasks that are each too narrow, the union of subagent outputs can miss whole facets of the topic. E.g., "research the impact of AI on healthcare" split only into "AI diagnostics" and "AI drug discovery" subagents misses regulatory, workforce, and ethics angles — the decomposition itself created a coverage gap, not any individual subagent's failure.

### Skills the exam wants you to demonstrate

**1. Dynamic subagent selection based on query complexity**, not a fixed pipeline:

```python
def coordinator_plan(query):
    # Coordinator reasons about which subagents are actually needed
    if is_simple_factual(query):
        return ["search"]
    elif requires_deep_comparison(query):
        return ["search", "analysis", "synthesis"]
    else:
        return ["search", "synthesis"]
```

**2. Scope partitioning to minimize duplication** — assign distinct subtopics/source types per subagent rather than letting every subagent search the same thing:

```python
subagent_tasks = [
    {"agent": "search", "focus": "peer-reviewed clinical studies 2023-2025"},
    {"agent": "search", "focus": "industry/market reports and funding data"},
    {"agent": "search", "focus": "regulatory and policy documents"},
]
```

**3. Iterative refinement loop** — the coordinator evaluates the synthesis output for gaps, and if coverage is insufficient, re-delegates with *targeted* follow-up queries rather than re-running everything from scratch:

```python
synthesis = run_synthesis(all_findings)
gaps = coordinator_evaluate_coverage(synthesis, original_query)

while gaps:
    targeted_results = [run_search_subagent(gap) for gap in gaps]
    all_findings.extend(targeted_results)
    synthesis = run_synthesis(all_findings)
    gaps = coordinator_evaluate_coverage(synthesis, original_query)
```

**4. All communication routed through the coordinator** — for a consistent point of observability and error handling, never subagent → subagent directly.

### Practice Q&A

**Q1.** A coordinator always invokes Search → Analysis → Synthesis for every incoming query, regardless of complexity. What's the problem?
> **A.** It's not dynamically selecting subagents based on query needs — this wastes cost/latency on simple queries and is the opposite of the "analyze requirements, select subagents" skill the exam wants. A good coordinator decides per-query.

**Q2.** Two subagents need to exchange information mid-task. What's the correct architecture?
> **A.** They should not talk directly — the information must be routed through the coordinator (hub-and-spoke), which forwards/relays as needed.

**Q3.** A coordinator decomposes "analyze the effects of remote work" into exactly two subagent tasks: "productivity data" and "employee satisfaction data." The final report is thin. What likely went wrong, and whose responsibility was it?
> **A.** Overly narrow task decomposition by the coordinator — the split missed facets like real estate/commercial impact, management practices, or economic effects on cities. This is a coordinator-level risk, not a subagent execution failure.

**Q4.** After synthesis, the coordinator notices the report lacks any cost data. What's the correct next step per the iterative refinement pattern?
> **A.** Re-delegate to a search (and possibly analysis) subagent with a targeted query specifically about cost data, then re-run synthesis — not restart the entire pipeline from scratch.

---

## Task Statement 1.3 — Subagent invocation, context passing, and spawning

### The core mechanism: the Task tool

Subagents are spawned via the **Task tool**. For a coordinator to be able to invoke subagents at all, its `allowedTools` configuration **must include `"Task"`** — this is a specific, testable fact. If `Task` is missing from allowed tools, the coordinator has no mechanism to spawn subagents, no matter how well-designed its prompt is.

### Context does not propagate automatically

This is the single most important idea in this task statement, and it connects directly back to 1.2:

> Subagents do not automatically inherit the parent's conversation history, and they do not share memory with each other between invocations.

Every subagent starts **cold**. Whatever it needs to know — the user's original question, prior findings, constraints, formatting requirements — must be **explicitly included in the prompt you give it** when spawning it.

```python
# WRONG (assumes context is inherited)
Task(subagent_type="synthesis", prompt="Write the final report.")

# RIGHT (context explicitly passed)
Task(
    subagent_type="synthesis",
    prompt=f"""Write a synthesis report answering: {original_user_query}

    Web search findings:
    {search_subagent_output}

    Document analysis findings:
    {analysis_subagent_output}

    Quality criteria: cite every claim with its source; flag contradictions
    between sources rather than silently picking one.
    """
)
```

### AgentDefinition

Each subagent *type* is configured via an `AgentDefinition`, which typically includes:

- **description** — what this subagent type is for (used for selection/discovery).
- **system prompt** — role, behavior, constraints specific to that subagent type.
- **tool restrictions** — which tools this subagent type is allowed to use (principle of least privilege — a "search" subagent shouldn't have a `process_refund` tool available, for instance).

### Structured data formats for attribution

When passing findings from one subagent into another's prompt (e.g., search results → synthesis subagent), separate **content** from **metadata** (source URL, document name, page number) using a structured format, so the receiving agent can preserve attribution instead of losing it in a wall of prose:

```json
{
  "findings": [
    {
      "content": "Remote work increased self-reported productivity by 13% in the study cohort.",
      "source_url": "https://example.org/study-2024",
      "document_name": "Remote Work Productivity Study 2024",
      "page_number": 12
    }
  ]
}
```

If you instead just concatenate everything into "Here's what I found: ..." free text, the synthesis subagent has no reliable way to cite sources correctly — attribution gets scrambled or dropped.

### Parallel spawning

To run subagents **in parallel**, emit **multiple Task tool calls within a single coordinator response/turn**. If you instead issue one Task call, wait for it to resolve, then issue the next in a separate turn, subagents run **sequentially**, not in parallel — this is a common wrong-answer trap.

```python
# Parallel: multiple Task calls in ONE response
response.content = [
    ToolUseBlock(name="Task", input={"subagent_type": "search", "prompt": "...topic A..."}),
    ToolUseBlock(name="Task", input={"subagent_type": "search", "prompt": "...topic B..."}),
    ToolUseBlock(name="Task", input={"subagent_type": "search", "prompt": "...topic C..."}),
]
```

### Goals and quality criteria, not procedures

Coordinator prompts to subagents should specify the **research goal and quality bar**, not a rigid step-by-step procedure. This gives the subagent room to adapt its approach to what it actually finds, rather than blindly following a script that may not fit the situation.

```
# Weak (overly procedural — brittle to subagent adaptability)
"Step 1: search for 'AI healthcare 2024'. Step 2: open the first 3 results.
Step 3: copy the abstract of each."

# Strong (goal + quality criteria — subagent adapts)
"Find the most credible, recent evidence on how AI is changing clinical
diagnostics. Prioritize peer-reviewed sources and note any conflicting
findings. Cite sources for every claim."
```

### Fork-based session management

`fork_session` creates an **independent branch from a shared analysis baseline**. Use it when you've already done expensive shared analysis (e.g., fully explored a codebase) and now want to explore **divergent approaches** from that same starting point without redoing the analysis or having the branches interfere with each other. (This overlaps with Task Statement 1.7, covered in depth there.)

### Practice Q&A

**Q1.** A coordinator's `allowedTools` list is `["WebSearch", "Read", "Write"]`. It tries to spawn a subagent. What happens?
> **A.** It can't — `"Task"` is missing from `allowedTools`. The Task tool must be explicitly allowed for a coordinator to invoke subagents at all.

**Q2.** A coordinator spawns a synthesis subagent with the prompt "Summarize the findings." No findings are included in the prompt. What will happen, and why?
> **A.** The subagent has no findings to summarize and no way to retrieve the coordinator's conversation history — it starts with isolated/cold context. It will likely hallucinate, ask for clarification, or produce an empty/generic response. The findings must be explicitly included in the prompt text.

**Q3.** Three independent search subagents need to run concurrently. How should the coordinator invoke them?
> **A.** Emit all three Task tool calls within a single coordinator response/turn, not as three separate sequential turns.

**Q4.** Why pass findings between subagents as structured data (content + source metadata) rather than a single free-text blob?
> **A.** To preserve attribution — so downstream agents (e.g., synthesis) can correctly cite sources, page numbers, and document names rather than losing or scrambling that information when it's all mashed into prose.

**Q5.** Should a coordinator's prompt to a research subagent read like a numbered step-by-step script, or a statement of goals and quality bar? Why?
> **A.** Goals and quality bar — this preserves subagent adaptability so it can adjust its approach based on what it actually discovers, instead of being locked into a procedure that may not fit.

---

## Task Statement 1.4 — Multi-step workflows: enforcement and handoff patterns

### Programmatic enforcement vs. prompt-based guidance

This is a foundational distinction across the whole exam, and it resurfaces again in 1.5:

| | Programmatic enforcement | Prompt-based guidance |
|---|---|---|
| Mechanism | Hooks, prerequisite gates, code that blocks a tool call | Instructions in the system/user prompt telling Claude what order to follow |
| Compliance | Deterministic — 100% guaranteed by code | Probabilistic — Claude usually follows it, but has a **non-zero failure rate** |
| When required | Any time deterministic compliance is required (e.g., regulatory, financial, safety-critical steps) | Fine for preferences, style, non-critical ordering |

**Key exam fact:** "prompt instructions alone have a non-zero failure rate." Even a very well-written prompt saying "always verify identity before processing a refund" can occasionally be skipped or reordered by the model. If the business requirement is "this must never happen out of order" (e.g., identity verification before financial operations), you need **programmatic** enforcement, not just a well-worded prompt.

### Prerequisite gating example

Block `process_refund` until `get_customer` has been called and returned a *verified* customer:

```python
def before_tool_call(tool_name, tool_input, session_state):
    if tool_name == "process_refund":
        if not session_state.get("customer_verified"):
            return {
                "block": True,
                "reason": "Customer identity must be verified via get_customer before processing a refund."
            }
    return {"block": False}
```

This is enforced in code — Claude cannot talk its way past it, because the gate exists outside the model's control entirely.

### Decomposing multi-concern requests

A single customer message can bundle multiple issues ("my order is late AND I was double-charged AND I want to change my address"). The pattern:

1. **Decompose** into distinct concern items.
2. **Investigate each in parallel**, sharing context across the investigations (so, e.g., the customer ID looked up for concern 1 doesn't need to be re-looked-up for concern 2).
3. **Synthesize** a single unified resolution response back to the customer — not three disjointed replies.

### Structured handoff to human agents

When escalating mid-process to a human, the human agent typically has **no access to the conversation transcript**. A structured handoff summary must therefore be self-contained, including at minimum:

- Customer ID / identifying details
- Root cause analysis (what actually went wrong, not just the symptom)
- Recommended action
- Relevant transactional details (e.g., refund amount, order ID)

```python
handoff = {
    "customer_id": "cust_8891",
    "issue_summary": "Double-charged $89.99 on order #45213 due to duplicate webhook retry.",
    "root_cause": "Payment gateway retried webhook after timeout, creating duplicate charge.",
    "recommended_action": "Refund $89.99 to original payment method.",
    "attempted_steps": ["Verified identity", "Confirmed duplicate charge in billing system"],
}
```

Without this, the human agent has to start from zero, defeating the point of the agent having already done the investigation.

### Practice Q&A

**Q1.** A support agent's system prompt says "Always verify the customer's identity before issuing a refund." Is this sufficient for a financial compliance requirement?
> **A.** No — prompt instructions have a non-zero failure rate. A compliance-critical ordering requirement needs programmatic enforcement (e.g., a hook/gate blocking `process_refund` until verification is confirmed in code-tracked state).

**Q2.** What's the mechanism to guarantee `process_refund` can never be called before `get_customer` succeeds?
> **A.** A programmatic prerequisite gate (hook) that checks state and blocks the tool call — not a prompt instruction.

**Q3.** A customer emails about three unrelated issues in one message. What's the correct workflow pattern?
> **A.** Decompose into distinct items, investigate each in parallel with shared context, then synthesize one unified response — not three separate uncoordinated replies or handling only the first issue mentioned.

**Q4.** When escalating to a human agent, why must the handoff include root cause analysis and not just "customer is upset about a charge"?
> **A.** Because the human agent has no access to the conversation transcript — the handoff must be self-contained enough for them to act without redoing the investigation.

---

## Task Statement 1.5 — Agent SDK hooks: interception and normalization

### What hooks are for

Hooks let you intercept the agent loop at defined points to run your own code — deterministically, every time, regardless of what the model decides. Two patterns matter most for this exam:

1. **PostToolUse** — intercepts a tool's *result* after it executes, before Claude sees it. Used for **data normalization**.
2. **Pre-call / tool-call interception** — intercepts an outgoing tool *call* before it executes. Used for **policy enforcement**.

### PostToolUse: normalization

Different MCP tools/backends often return heterogeneous formats for conceptually identical data — Unix timestamps vs. ISO 8601 strings, numeric status codes vs. string enums, etc. If you feed this heterogeneity straight to Claude, it has to guess/infer formats repeatedly and inconsistently. A `PostToolUse` hook normalizes the data **once, deterministically**, before it ever reaches the model.

```python
def post_tool_use_hook(tool_name, tool_result):
    if tool_name == "legacy_order_lookup":
        # normalize Unix timestamp -> ISO 8601
        tool_result["created_at"] = datetime.utcfromtimestamp(
            tool_result["created_at"]
        ).isoformat()
        # normalize numeric status code -> readable string
        status_map = {0: "pending", 1: "shipped", 2: "delivered", 3: "cancelled"}
        tool_result["status"] = status_map.get(tool_result["status"], "unknown")
    return tool_result
```

### Tool-call interception: policy enforcement

A hook can inspect an outgoing tool call *before execution* and block it if it violates a business rule — e.g., refunds over a threshold must go to a human, not be auto-approved.

```python
def pre_tool_call_hook(tool_name, tool_input):
    if tool_name == "process_refund" and tool_input["amount"] > 500:
        return {
            "block": True,
            "redirect": "escalate_to_human",
            "reason": f"Refund amount ${tool_input['amount']} exceeds $500 auto-approval threshold."
        }
    return {"proceed": True}
```

### The core distinction (same theme as 1.4, now at the SDK-mechanics level)

**Hooks = deterministic guarantee. Prompts = probabilistic compliance.**

If the exam gives you a scenario like *"business rules require that refunds over $500 must never be auto-approved,"* the correct answer is a **hook**, not "add an instruction to the system prompt telling Claude not to approve large refunds." The word "never" / "must" / "guaranteed" / "compliance" in a scenario is a strong signal the intended answer is hook-based enforcement.

### Practice Q&A

**Q1.** An MCP tool returns `status: 2` while another returns `status: "shipped"` for the same concept. What hook pattern addresses this, and at what point in the pipeline?
> **A.** A `PostToolUse` hook, applied after the tool executes and before Claude processes the result — normalizing both into a consistent format.

**Q2.** Business policy: refunds above $500 must always be escalated to a human, no exceptions. Should this be implemented as a prompt instruction or a hook? Why?
> **A.** A hook (tool-call interception) — because prompt instructions are probabilistic and have a non-zero failure rate, which is unacceptable for a "no exceptions" business rule. The hook blocks the call deterministically and redirects to escalation.

**Q3.** What's the difference in *when* a PostToolUse hook fires versus a tool-call interception hook?
> **A.** PostToolUse fires *after* a tool has executed, operating on its result (for transformation/normalization). Tool-call interception fires *before* execution, operating on the proposed call itself (for blocking/redirecting).

**Q4.** True or false: hooks and prompt instructions achieve the same reliability, so the choice is just style preference.
> **A.** False. Hooks are deterministic (code-level guarantee); prompts are probabilistic (model-level, non-zero failure rate). The choice matters whenever compliance must be guaranteed.

---

## Task Statement 1.6 — Task decomposition strategies for complex workflows

### Two decomposition families

| | Prompt chaining (fixed sequential pipeline) | Dynamic adaptive decomposition |
|---|---|---|
| Structure | Fixed sequence of steps known in advance | Subtasks generated based on what's discovered along the way |
| Best for | Predictable, multi-aspect but well-understood workflows (e.g., "review each file, then do a cross-file pass") | Open-ended investigation where the right next step depends on findings so far |
| Example | Code review: analyze file 1, file 2, file 3 individually → then one integration pass across all files | "Add comprehensive tests to a legacy codebase" — you don't know the priority areas until you've mapped the structure |

### Why split "per-file" + "cross-file integration" for code review

If you ask a model to review 20 files *and* reason about their interactions in a single pass, you get **attention dilution** — quality drops because the model is juggling too much simultaneously. The fix: prompt-chain it —

1. **Step 1 (repeated per file):** analyze file N in isolation for local issues (bugs, style, complexity).
2. **Step 2 (single pass, after all files are done):** a dedicated cross-file integration pass that looks specifically at interactions, consistency, and architecture-level issues across the set.

This is a fixed, predictable pipeline — you know in advance that "per-file passes then one integration pass" is the shape of the work, regardless of what the files actually contain.

### Why adaptive decomposition for open-ended tasks

"Add comprehensive tests to a legacy codebase" has no fixed shape in advance — you don't know what's undertested, what's high-risk, or what depends on what, until you look. The right pattern:

1. **Map structure first** — understand the codebase's shape (modules, dependencies, existing test coverage).
2. **Identify high-impact areas** — based on what step 1 actually found (not a template).
3. **Create a prioritized plan that adapts** — as testing proceeds and dependencies are discovered (e.g., "module A can't be tested cleanly until we mock module B's database calls" — a fact you couldn't know before starting).

The subtasks in step 3 are *generated from* what was discovered in steps 1–2, not predetermined.

### Selecting the right pattern — the actual skill being tested

The exam wants you to **match the decomposition strategy to the workflow's predictability**:

- Predictable, well-understood, multi-aspect → **prompt chaining**.
- Open-ended, exploratory, next-step-depends-on-findings → **dynamic/adaptive decomposition**.

A common wrong answer is applying a fixed pipeline to an open-ended task (forcing "legacy codebase testing" into rigid predetermined steps, missing dependencies discovered along the way), or the reverse — building an elaborate adaptive planning system for a review task that's actually entirely predictable and would be simpler and more reliable as a fixed chain.

### Practice Q&A

**Q1.** A code review task involves 15 files. Why not just ask Claude to review "all 15 files and their interactions" in one shot?
> **A.** Attention dilution — trying to hold local per-file analysis and cross-file interaction reasoning simultaneously across 15 files degrades quality. Better: per-file passes (prompt chain) plus one dedicated cross-file integration pass.

**Q2.** "Add comprehensive tests to this legacy codebase" — should this use a fixed sequential pipeline or dynamic decomposition? Why?
> **A.** Dynamic/adaptive decomposition — the high-impact areas and dependency order aren't knowable up front; the plan must adapt as structure-mapping and testing reveal new information.

**Q3.** What's the defining difference between prompt chaining and dynamic decomposition?
> **A.** Prompt chaining is a fixed, predetermined sequence of steps known in advance. Dynamic decomposition generates subtasks based on intermediate findings — the plan isn't fully known until execution is underway.

**Q4.** A reviewer wants a "cross-file integration pass." What does that step specifically check for, that per-file passes miss?
> **A.** Interactions, consistency, and architectural issues *across* files — things invisible when each file is analyzed in isolation.

---

## Task Statement 1.7 — Session state, resumption, and forking

### Named session resumption

`--resume <session-name>` continues a specific prior conversation by name, preserving its full context (conversation history, prior tool results) rather than starting cold. Use this when the **prior context is still valid** — e.g., you're picking up an investigation you paused yesterday and nothing relevant has changed since.

### fork_session

`fork_session` creates an **independent branch from a shared analysis baseline**. The classic use case: you've done substantial (possibly expensive) shared analysis — e.g., fully explored and understood a codebase — and now want to explore **multiple divergent approaches** from that same starting point without them interfering with each other or redoing the shared analysis.

```
                 [Baseline: codebase fully analyzed]
                            │
              fork_session ─┴─ fork_session
                  │                  │
        [Branch A: refactor      [Branch B: refactor
         via extraction]          via composition]
```

Example: comparing two testing strategies, or two refactoring approaches, both starting from the same "we've already read and understood this codebase" point — forking avoids re-paying that analysis cost twice, and keeps the two explorations from contaminating each other.

### The critical resumption pitfall: stale tool results

If you resume a session after the underlying files/code have **changed since the last time the agent looked at them**, the session's prior tool results (e.g., "I read file X and it looks like Y") are now **stale** — they no longer reflect reality, but the agent will still reason as if they do unless told otherwise.

Two remedies, and knowing *when to use which* is the actual exam skill:

1. **Inform the resumed session about specific file changes** — "Note: `auth.py` was modified since we last looked at it; here's what changed" — so the agent does a **targeted re-analysis** of just what changed, instead of blindly trusting stale results *or* wastefully re-exploring everything from scratch.
2. **Start a new session with a structured summary injected**, instead of resuming — when prior context is mostly stale/invalid, resuming just carries forward bad assumptions. It's more reliable to start fresh and hand the new session a clean, structured summary of what's known to still be true, rather than dragging along a conversation history full of now-wrong tool results.

### Decision rule (this is the testable judgment call)

| Situation | Correct choice |
|---|---|
| Prior context still mostly valid, nothing significant changed | **Resume** with `--resume <session-name>` |
| A few specific files changed since last analysis | **Resume**, but explicitly inform the agent which files changed, for targeted re-analysis |
| Prior tool results are largely stale/invalid (major changes, long time gap) | **Start fresh** with an injected structured summary — do not resume |
| Want to explore multiple divergent approaches from one expensive shared baseline | **fork_session** |

### Practice Q&A

**Q1.** You paused an investigation session two days ago. Nothing in the codebase has changed. How should you continue?
> **A.** `--resume <session-name>` — prior context is still valid, no need to re-explore or start fresh.

**Q2.** You want to compare a "test with mocks" strategy against a "test with a real DB" strategy, both starting from the same already-completed codebase analysis. What mechanism fits?
> **A.** `fork_session` — branch into two independent explorations from the shared baseline, avoiding redundant re-analysis and cross-contamination between the two strategies.

**Q3.** You resume a session from last week, but three files it previously analyzed have since been substantially rewritten. What's the best next step — resume and proceed normally, resume and inform it of the specific changes, or start fresh?
> **A.** Resume, but explicitly inform the agent which files changed and how — enabling targeted re-analysis of just those files, rather than either trusting stale results or paying for a full re-exploration.

**Q4.** Why might starting a new session with a structured summary be more reliable than resuming a session with extensively stale tool results?
> **A.** Resuming carries forward the full history of now-incorrect tool results, and the agent may keep reasoning from them. A fresh session with a clean, structured, accurate summary avoids inheriting bad assumptions baked into stale conversation history.

---

## Cross-cutting themes to keep in mind for the exam

These distinctions each show up in more than one task statement — expect the exam to test them from different angles:

1. **Deterministic vs. probabilistic compliance** — hooks/gates/code (1.4, 1.5) vs. prompts (unreliable for hard requirements). The "non-zero failure rate" phrase is the tell.
2. **Structured signals vs. natural language parsing** — `stop_reason` (1.1) vs. text-matching; structured data with metadata (1.3) vs. free-text blobs.
3. **Isolated context by default** — subagents (1.2, 1.3) and forked/resumed sessions (1.7) don't automatically carry context; you must explicitly provide it.
4. **Fixed/predictable vs. adaptive/dynamic** — decision trees vs. model-driven reasoning (1.1); prompt chaining vs. dynamic decomposition (1.6); full pipeline vs. dynamically selected subagents (1.2).
5. **Coverage risk from decomposition** — narrow task-splitting can leave gaps (1.2), which is why iterative refinement/re-delegation loops exist.
