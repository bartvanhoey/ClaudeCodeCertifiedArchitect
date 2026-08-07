# Getting Started with the Customer Support System

## Quick Start

```bash
# 1. Navigate to the project
cd C:\Personal\MyGitHubRepos\customer-support-system

# 2. Install dependencies
npm install

# 3. Set your API key (Windows)
$env:ANTHROPIC_API_KEY = "your-api-key-here"

# Or on macOS/Linux
export ANTHROPIC_API_KEY="your-api-key-here"

# 4. Start development server
npm run dev

# 5. Open browser
http://localhost:3000
```

## How to Use the Web Interface

1. **Enter Customer ID**: Something like `CUST-12345`
2. **Describe the Issue**: Paste the customer's problem
3. **Click Submit**: The system processes it
4. **View Response**: AI agent's analysis and resolution

### Example Issues to Test

**Billing Issue** (routes to BillingAgent):
```
Customer ID: CUST-001
Issue: I was charged twice for my subscription this month. Can I get a refund?
```

**Technical Issue** (routes to TechnicalAgent):
```
Customer ID: CUST-002
Issue: My API service keeps timing out. I'm getting connection refused errors every 5 minutes.
```

**Account Issue** (routes to AccountAgent):
```
Customer ID: CUST-003
Issue: I need to update my email address and I'm interested in upgrading my account tier.
```

## Understanding the Flow

### What Happens When You Submit

```
1. [Frontend] User submits issue
   ↓
2. [API Route] POST /api/support receives request
   ↓
3. [Orchestrator] Analyzes issue and routes intelligently
   ↓
4. [Subagent] Processes issue autonomously with tools:
      a. Decides what information is needed
      b. Calls relevant tools
      c. Analyzes results
      d. Takes actions if needed
      e. Repeats until complete
   ↓
5. [Orchestrator] Synthesizes agent findings
   ↓
6. [Frontend] Displays customer-friendly response
```

### Agent Decision Making Example

**Issue**: "I was charged twice"

**BillingAgent Reasoning**:
```
Step 1: "I need to investigate this charge"
        → Call check_account_balance

Step 2: Results show duplicate charge
        → "This needs more details"
        → Call get_invoice

Step 3: Confirmed duplicate
        → "The customer deserves a refund"
        → Call process_refund

Step 4: Refund processed
        → "I have enough information"
        → STOP and report findings

Result: Refund of $89.99 processed for reason: duplicate charge
```

Note: The agent **decided** to use those tools in that order. It wasn't scripted!

## Project Files Explained

### Core Agent Files

**`lib/agents/types.ts`** - TypeScript interfaces
- Defines types for issues, decisions, tools

**`lib/agents/tools.ts`** - Tool library
- 9 simulated tools (billing, technical, account)
- Would connect to real APIs in production

**`lib/agents/base-agent.ts`** - Base class
- Implements autonomous reasoning loop
- Handles tool use and iteration
- All agents inherit from this

**`lib/agents/subagents.ts`** - Specialized agents
- BillingAgent
- TechnicalAgent
- AccountAgent

**`lib/agents/orchestrator.ts`** - Hub
- Routes issues intelligently
- Coordinates subagents
- Synthesizes responses

### Frontend & API

**`app/page.tsx`** - Web interface
- Form to submit issues
- Displays responses
- Clean, accessible UI

**`app/api/support/route.ts`** - API endpoint
- Receives POST requests
- Triggers orchestrator
- Returns JSON responses

### Configuration

**`package.json`** - Dependencies
- `@anthropic-ai/sdk` - Claude API
- `next` - Web framework
- `react` - UI library
- `tailwindcss` - Styling

**`tsconfig.json`** - TypeScript config

**`tailwind.config.ts`** - Styling config

## Customizing for Your Use Case

### Scenario 1: E-commerce Support

1. **Add new agents**:
   - `OrderAgent` (track orders, handle returns)
   - `ShippingAgent` (tracking, delays)
   - `ProductAgent` (recommendations, specs)

2. **Add tools**:
   - `get_order_status`
   - `process_return`
   - `check_inventory`
   - `track_shipment`

3. **Update orchestrator routing** to handle new agent types

### Scenario 2: IT Help Desk

1. **Add agents**:
   - `PasswordResetAgent`
   - `NetworkAgent`
   - `SoftwareAgent`
   - `HardwareAgent`

2. **Add tools**:
   - `reset_password`
   - `check_vpn_status`
   - `check_licenses`
   - `view_device_logs`

3. Configure tools and routing

## Testing

### Option 1: Web Interface
Just submit issues via the browser at `http://localhost:3000`

### Option 2: Direct API
```bash
curl -X POST http://localhost:3000/api/support \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUST-12345",
    "description": "I was charged twice"
  }'
```

### Option 3: Demo Script
```bash
node lib/demo.ts  # Runs through 3 example issues
```

## Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables
```
ANTHROPIC_API_KEY=your_production_key
```

### Considerations
- Add proper error handling
- Implement request validation
- Add rate limiting
- Log all decisions
- Monitor API costs
- Set up alerting

## Troubleshooting

### "API key not found"
Make sure `ANTHROPIC_API_KEY` is set:
```bash
echo $env:ANTHROPIC_API_KEY  # Windows
echo $ANTHROPIC_API_KEY      # macOS/Linux
```

### "Port 3000 in use"
```bash
npm run dev -- -p 3001  # Use different port
```

### Response is slow
- Normal: 6-13 seconds (routing + agent reasoning + synthesis)
- Check network connection
- Verify API key is valid

### Agent seems stuck
- Max iterations set to 4 (line in base-agent.ts)
- Increase if needed for complex issues

## Architecture Files to Read

1. **`README.md`** - Project overview
2. **`ARCHITECTURE.md`** - Deep technical dive
3. **`COMPARISON.md`** - vs. Job Scanner differences
4. **`CLAUDE.md`** - Project guide
5. **Code files** - Well-commented agent implementations

## Next Steps

1. ✅ Install and run locally
2. ✅ Test with example issues
3. ✅ Understand the agent reasoning loops
4. ✅ Read ARCHITECTURE.md for details
5. ⬜ Customize for your domain
6. ⬜ Connect real tools/APIs
7. ⬜ Deploy to production

## Questions?

- Check `ARCHITECTURE.md` for deep explanations
- Check `COMPARISON.md` to understand vs. job-scanner
- Read agent code—it's well-structured and commented

Good luck! 🚀
