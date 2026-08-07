import { Anthropic } from '@anthropic-ai/sdk';
import { CustomerIssue, RoutingDecision } from './types';
import { BillingAgent, TechnicalAgent, AccountAgent } from './subagents';

export class OrchestratorAgent {
  private billingAgent: BillingAgent;
  private technicalAgent: TechnicalAgent;
  private accountAgent: AccountAgent;
  private client: Anthropic;

  constructor() {
    this.billingAgent = new BillingAgent();
    this.technicalAgent = new TechnicalAgent();
    this.accountAgent = new AccountAgent();
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Route customer issue to appropriate subagent
   */
  async routeIssue(issue: CustomerIssue): Promise<RoutingDecision> {
    const routingPrompt = `You are an expert customer support router. Analyze this customer issue and determine which specialized agent should handle it.

Customer Issue: "${issue.description}"

Available agents:
1. BillingAgent - handles billing, refunds, invoices, payments, charges
2. TechnicalAgent - handles service issues, errors, performance, connectivity
3. AccountAgent - handles account management, profile updates, complex multi-domain issues

Respond in JSON only:
{
  "primaryAgent": "billing" | "technical" | "account",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation"
}`;

    const response = await this.client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: routingPrompt,
        },
      ],
    });

    const responseText = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('\n');

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const decision = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
      return decision as RoutingDecision;
    } catch (error) {
      console.error('Routing parse error:', error);
      return {
        primaryAgent: 'account',
        confidence: 0.5,
        reasoning: 'Default routing due to parsing',
      };
    }
  }

  /**
   * Orchestrate the entire support flow
   */
  async handleCustomerIssue(issue: CustomerIssue): Promise<string> {
    const routing = await this.routeIssue(issue);

    let result: string;
    switch (routing.primaryAgent) {
      case 'billing':
        result = await this.billingAgent.processRequest(issue.description, issue.customerId);
        break;
      case 'technical':
        result = await this.technicalAgent.processRequest(issue.description, issue.customerId);
        break;
      case 'account':
        result = await this.accountAgent.processRequest(issue.description, issue.customerId);
        break;
    }

    const finalResponse = await this.synthesizeResponse(
      issue.description,
      result,
      routing.primaryAgent
    );

    return finalResponse;
  }

  /**
   * Synthesize subagent findings into customer-facing response
   */
  private async synthesizeResponse(
    issue: string,
    agentFindings: string,
    agentType: string
  ): Promise<string> {
    const synthesisPrompt = `You are a customer support coordinator synthesizing findings from specialist agents.

Original Issue: "${issue}"

${agentType} Agent Findings:
${agentFindings}

Create a professional, empathetic customer-facing response that:
1. Acknowledges the issue
2. Explains the investigation and actions taken
3. Provides clear next steps or resolution
4. Maintains a helpful, supportive tone
5. Offers additional help if needed

Keep response concise but complete (150-250 words).`;

    const response = await this.client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: synthesisPrompt,
        },
      ],
    });

    return response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('\n');
  }
}
