# Comparison: Job Scanner vs. Customer Support System

## Job Application Scanner
**Pattern**: Hub-and-spoke with **simple spoke functions**

```
   Orchestrator (analyzize)
         |
    _____|_____
    |   |   |
  Job  App Resume
  ↓    ↓   ↓
[LLM] [LLM] [LLM]  ← Single call each
    |   |   |
    └───┴───┘
      |
  Decision Engine
      |
    [Final LLM Call]
```

**Characteristics**:
- Spoke functions make a single API call
- Fixed prompt per function
- No iteration or autonomous decision-making
- Sequential processing (calls Promise.all but each is one-shot)
- Good for: Parallel analysis of different aspects of the same data

## Customer Support System
**Pattern**: Hub-and-spoke with **autonomous subagents**

```
   Orchestrator
       |
    Route (dynamic LLM decision)
       |
    ___|___
    |  |  |
Billing Technical Account
    |  |  |
   [Agent with Tools]
    |  |  |
 Loop & Loop & Loop &
 Reason Reason Reason
    |  |  |
 Tool Tool Tool
    |  |  |
    └──┴──┘
       |
  Synthesize (LLM)
       |
  Customer Response
```

**Characteristics**:
- Subagents have tool access
- Multi-turn reasoning loops
- Autonomous decision-making
- Dynamic routing based on content
- Good for: Complex problem-solving requiring investigation and action

## Side-by-Side Comparison

| Feature | Job Scanner | Support System |
|---------|-------------|----------------|
| **Agent Type** | Functions | True Agents |
| **Tool Access** | ❌ None | ✅ Domain-specific |
| **Iteration** | ❌ Single call | ✅ Multi-turn loops |
| **Decision Making** | ❌ Fixed prompts | ✅ Independent reasoning |
| **Routing** | ❌ Fixed (job→app→resume) | ✅ Dynamic (by issue type) |
| **Autonomy Level** | 🔴 Very Low | 🟢 High |
| **Use Case** | Parallel analysis of related data | Autonomous problem-solving |
| **Complexity** | Low | Medium-High |
| **Extensibility** | Add new analysis function | Add new agent with tools |

## When to Use Each Pattern

### Job Scanner Pattern (Simple Spokes)
Use when:
- Analyzing different facets of the same data
- Each spoke has a focused, well-defined task
- No back-and-forth between analysis and action
- Results can be combined deterministically
- Examples: Resume scoring, document classification, multi-angle analysis

### Support System Pattern (Autonomous Agents)
Use when:
- Issues are diverse and require routing
- Solutions require investigation before action
- Agents need to make independent decisions
- Multi-step reasoning is needed
- Agents need tool/API access to take real actions
- Examples: Customer support, IT troubleshooting, complex workflows

## Code Structure Comparison

### Job Scanner (Spoke Functions)
```typescript
async function analyzeJobOffer(jobOffer: string) {
  // Single LLM call
  return client.messages.create({ ... });
}

async function orchestrateAnalysis(params) {
  // Parallel calls to spokes
  const [offer, app, resume] = await Promise.all([
    analyzeJobOffer(...),
    analyzeJobApplication(...),
    analyzeResume(...)
  ]);
  
  // Synthesize results
  return makeFinalDecision(offer, app, resume);
}
```

### Support System (Autonomous Agents)
```typescript
abstract class BaseSubAgent {
  async processRequest(issue, customerId) {
    // Multi-turn reasoning loop
    while (shouldContinue) {
      // Agent decides what tool to use
      const response = await client.messages.create({
        tools: this.availableTools
      });
      
      // Agent uses tools autonomously
      const results = await executeTool(response);
      
      // Agent iterates based on findings
      messages.push(toolResults);
    }
  }
}

class OrchestratorAgent {
  async handleCustomerIssue(issue) {
    // Dynamic routing
    const routing = await routeIssue(issue);
    
    // Dispatch to appropriate agent
    const result = await selectAgent(routing).processRequest(...);
    
    // Synthesize response
    return synthesize(result);
  }
}
```

## Learning Paths

**If you understand Job Scanner**, here's what's new in Support System:
1. **Agents vs Functions**: Agents have state (conversation history) and make decisions
2. **Tools**: Agents can call external APIs/functions to gather info or take action
3. **Loops**: Agents iterate until they decide they're done (not predetermined)
4. **Autonomy**: Agents choose what to do next based on results, not a script
5. **Routing**: Hub routes to agents dynamically, not sequentially

**To extend Support System**:
1. Add a new `SpeakAgent extends BaseSubAgent`
2. Create tools for that agent domain
3. Update `getToolsByAgent()` to assign tools
4. Update routing prompt in orchestrator
5. Done! New agent is integrated

## Production Considerations

### Job Scanner Production Issues
- Needs consent/GDPR tracking (already implemented ✅)
- Data minimization important ✅
- Pseudonymization helps with bias auditing
- Simple to audit (fixed flow)

### Support System Production Issues
- Tool execution needs authorization checks
- Audit logging of all agent decisions and tool calls
- Rate limiting on agent iterations
- Error recovery if agent gets stuck
- Cost monitoring per agent/tool
- Customer context management (maintaining session state)

Both benefit from:
- Comprehensive logging
- Error handling
- API key security
- Rate limiting
- Cost monitoring
