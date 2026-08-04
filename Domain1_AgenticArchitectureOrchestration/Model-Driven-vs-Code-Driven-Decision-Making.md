# Model-Driven vs. Code-Driven Decision Making

When an AI agent needs to decide what happens next, that decision can live in one
of two places: in the **model** (Claude reasons about the situation and chooses
the action itself) or in **code** (Claude only supplies information, and a
hard-coded program decides what to do with it). Most real agentic systems mix
both, but understanding the distinction is central to designing agent
architectures well.

## Code-Driven Decision Making

Claude is used purely for perception or classification. It looks at unstructured
input and reduces it to a small, predictable output (a label, a number, a short
string). All branching logic - the actual decision tree - is written and
maintained in plain code, and reacts to that output.

```python
# Claude only classifies the request in plain text.
response = await client.messages.create(
    max_tokens=1024,
    messages=messages,
    model=model,
)
category = extract_text(response)

# The decision tree lives entirely in Python.
if category == "BILLING":
    handle_billing()
elif category == "TECHNICAL":
    handle_technical()
elif category == "GENERAL":
    handle_general()
else:
    route_to_human()
```

**Characteristics:**

- Control flow is explicit, versioned, and testable like any other code.
- Claude's output space must be constrained (e.g. "reply with exactly one word")
  and the code must defensively handle anything that doesn't match.
- Adding a new branch means writing and deploying new code.
- Behavior is fully deterministic once Claude's classification is known.

**Good fit when:** the set of possible actions is small, stable, and well
understood in advance; when decisions must be auditable step-by-step in code;
or when regulatory/compliance needs demand that business logic not depend on
model behavior.

## Model-Driven Decision Making

Claude is given a set of **tools** (structured actions with typed arguments)
and decides *for itself* which one to call and with what inputs. The code no
longer contains a decision tree - it only executes whichever tool call Claude
chose, via a generic dispatch mechanism.

```python
response = await client.messages.create(
    max_tokens=1024,
    messages=messages,
    model=model,
    tools=tools,  # route_to_billing, route_to_technical, route_to_general
)

# No if/elif tree. Just execute whatever Claude decided to call.
for call in [b for b in response.content if b.type == "tool_use"]:
    handlers[call.name](**call.input)
```

**Characteristics:**

- The decision (which action, with which arguments) is made by the model, not
  by hard-coded rules.
- New capabilities can be added by describing a new tool - often without
  touching the surrounding control flow.
- Claude can supply richer, structured reasoning as part of the decision (e.g.
  an `urgency` field), not just a single classification label.
- Behavior depends on model judgment, so it is probabilistic and must be
  validated/monitored rather than proven correct by inspection alone.

**Good fit when:** the situation requires judgment that's hard to encode as
fixed rules; the set of possible actions is large, varied, or evolving; or the
agent needs to combine several considerations (urgency, tone, context) into one
decision.

## Side by Side

| | Code-Driven | Model-Driven |
|---|---|---|
| Who decides the action | Python (`if/elif`) | Claude (tool choice) |
| Where logic lives | Hard-coded decision tree | Tool descriptions + model reasoning |
| Adding a new outcome | Add a new branch + redeploy code | Add a new tool description |
| Determinism | Fully deterministic given Claude's label | Depends on model judgment |
| Auditability | Trivial to trace in code | Must inspect the model's tool call/reasoning |
| Failure mode | Unrecognized label falls through to a default branch | Model picks a plausible-but-wrong tool |

## Working Examples

This repository contains a runnable pair of examples that implement the exact
same support-ticket routing scenario using both patterns:

- [`anthropic-client-sdk/code-driven-decision-making`](anthropic-client-sdk/code-driven-decision-making) -
  Claude classifies the request as `BILLING`/`TECHNICAL`/`GENERAL` text, and a
  Python `if/elif` tree routes it.
- [`anthropic-client-sdk/model-driven-decision-making`](anthropic-client-sdk/model-driven-decision-making) -
  Claude is given `route_to_billing`, `route_to_technical`, and
  `route_to_general` tools, and chooses which one to call (plus structured
  arguments like `urgency`) itself.

## Choosing Between Them

In practice, most production agents are layered: code-driven guardrails
(input validation, rate limits, permission checks) wrap a model-driven core
where Claude actually decides what to do. Reach for code-driven logic wherever
correctness must be guaranteed, and reserve model-driven decisions for the
parts of the problem that genuinely require judgment.
