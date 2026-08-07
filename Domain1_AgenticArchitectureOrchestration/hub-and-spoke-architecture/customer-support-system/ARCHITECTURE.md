# Hub-and-Spoke Architecture Deep Dive

## Overview

This customer support system implements a true hub-and-spoke architecture with:
- **1 Orchestrator Agent** (the Hub)
- **3 Specialized Subagents** (the Spokes)
- **9 Domain-Specific Tools** shared among spokes

## Architecture Diagram

```
                    Customer Issue
                          |
                          v
                  [OrchestratorAgent]
                          |
                 ______|______|______
                |       |       |
         (routing decision)
                |       |       |
                v       v       v
          Billing   Technical  Account
          Agent     Agent      Agent
            |         |         |
      Check balance   Check     Get customer
      Get invoice     service   history
      Process         Restart   Update info
      refund          service   Escalate
      Get error logs  
                |       |       |
                |_______|_______|
                          |
                          v
              Synthesize Response
                          |
                          v
              Customer-Facing Response
```

## Components

### 1. Orchestrator Agent (Hub)
**File**: `lib/agents/orchestrator.ts`

Responsibilities:
- Routes incoming customer issues to appropriate subagents
- Uses LLM to intelligently decide which agent can best handle the issue
- Collects findings from the assigned subagent
- Synthesizes a professional customer-facing response
- **Does NOT** make domain-specific decisions—delegates to specialists

Key methods:
- `routeIssue()` - Analyzes issue and determines routing
- `handleCustomerIssue()` - Orchestrates the full flow
- `synthesizeResponse()` - Creates final customer response

### 2. Subagents (Spokes)

#### BillingAgent
**Specialization**: Payment, invoice, and financial issues
**Tools**:
- `check_account_balance` - View balance and payment history
- `get_invoice` - Retrieve specific invoices
- `process_refund` - Execute refunds

**Autonomy Example**:
- User: "I was charged twice"
- Agent: "Let me check the account balance and invoices"
  1. Calls `check_account_balance`
  2. Sees duplicate charge in results
  3. Calls `get_invoice` for details
  4. Decides: "This warrants a refund"
  5. Calls `process_refund`
  6. Reports back to orchestrator

#### TechnicalAgent
**Specialization**: Service outages, performance, errors
**Tools**:
- `check_service_status` - Verify service health
- `get_error_logs` - Retrieve error history
- `restart_service` - Restart services

**Autonomy Example**:
- User: "My service keeps timing out"
- Agent: "Let me diagnose this"
  1. Calls `check_service_status`
  2. Service is operational, but there are timeouts
  3. Calls `get_error_logs` for patterns
  4. Identifies: Load spike correlation
  5. Decides: "Restart service"
  6. Calls `restart_service`
  7. Reports resolution

#### AccountAgent
**Specialization**: Profile, account settings, complex issues
**Tools**:
- `get_customer_history` - Review past interactions
- `update_contact_info` - Modify customer info
- `escalate_to_human` - Escalate complex issues

**Autonomy Example**:
- User: "Update email and upgrade tier"
- Agent: "Let me handle this"
  1. Calls `get_customer_history`
  2. Sees Gold loyalty status
  3. Calls `update_contact_info`
  4. May recommend upgrade
  5. Or escalates if tier change requires human approval

### 3. Tool System

**File**: `lib/agents/tools.ts`

Tools are **not agent-owned**. They're shared infrastructure with specific permissions per agent:

```typescript
// Tool registry
check_account_balance -> only BillingAgent
get_invoice -> only BillingAgent
check_service_status -> only TechnicalAgent
// ... etc
```

Benefits:
- Consistent tool behavior
- Easy to add new tools
- Clear tool permissions model
- Simulates real authorization (not all agents can restart services)

## Key Architectural Decisions

### 1. **Dynamic Routing vs. Rule-Based**
We use LLM routing instead of keyword matching because:
- Handles edge cases and ambiguous issues
- Can consider customer history
- More natural language understanding
- Easier to evolve without code changes

### 2. **Tool-Based Autonomy**
Subagents have real tool access, not just prompt instructions:
- Can verify claims against real data
- Can take actions, not just recommend
- Creates accountability (actions are logged)
- Enables true multi-turn reasoning

### 3. **Synthesis Layer**
The orchestrator doesn't just concatenate agent responses:
- Translates technical findings to customer language
- Adds empathy and context
- Ensures consistency
- Can highlight important caveats

## Comparison: This vs. Your Job Scanner

| Aspect | Job Scanner | Support System |
|--------|------------|----------------|
| **Spoke Nature** | Simple function calls | True autonomous agents |
| **Tool Access** | None | Domain-specific tools |
| **Decision Making** | Fixed prompts | Independent reasoning |
| **Iteration** | Single shot | Multi-turn loops |
| **Routing** | Fixed order | Dynamic based on content |
| **Autonomy Level** | Low (execution only) | High (full decision loop) |

## How to Extend

### Add a New Subagent

1. Create new agent class:
```typescript
export class InventoryAgent extends BaseSubAgent {
  constructor() {
    super(
      'InventoryAgent',
      'Handle inventory and shipping issues',
      getToolsByAgent('inventory')
    );
  }
}
```

2. Register tools in `tools.ts`:
```typescript
export const toolRegistry = {
  check_stock: { ... },
  track_shipment: { ... },
  ...
}
```

3. Update orchestrator:
```typescript
private inventoryAgent: InventoryAgent;

switch (routing.primaryAgent) {
  case 'inventory':
    result = await this.inventoryAgent.processRequest(...);
    break;
}
```

### Add a New Tool

1. Define in `tools.ts`:
```typescript
check_refund_status: {
  name: 'check_refund_status',
  description: 'Check the status of a refund',
  execute: async (params) => { ... }
}
```

2. Register tool for agents:
```typescript
const toolMap = {
  billing: ['check_refund_status'],
  ...
}
```

## Deployment Considerations

1. **Tool Execution**: Replace simulated tools with real APIs
2. **Permissions**: Implement proper authorization checks
3. **Audit Logging**: Log all tool calls and decisions
4. **Rate Limiting**: Limit subagent iterations
5. **Failover**: Handle agent failures gracefully
6. **Cost Control**: Monitor API usage per agent

## Performance Notes

- Routing: ~2-3 seconds (single LLM call)
- Subagent processing: ~3-8 seconds (multi-turn loops)
- Synthesis: ~1-2 seconds (final LLM call)
- **Total**: ~6-13 seconds per issue

Optimize by:
- Caching routing decisions for common patterns
- Using faster models for synthesis
- Parallel subagent execution if needed
