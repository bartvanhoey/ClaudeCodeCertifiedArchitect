import { Anthropic } from '@anthropic-ai/sdk';
import { AgentTool } from './types';

export abstract class BaseSubAgent {
  protected agentName: string;
  protected role: string;
  protected availableTools: AgentTool[];
  protected client: Anthropic;

  constructor(name: string, role: string, tools: AgentTool[]) {
    this.agentName = name;
    this.role = role;
    this.availableTools = tools;
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  protected buildSystemPrompt(): string {
    return `You are the ${this.agentName}, responsible for: ${this.role}

You have access to specific tools to help resolve customer issues.
You should:
1. Use tools to investigate the issue thoroughly
2. Make decisions independently about what actions to take
3. Explain your reasoning and actions to the customer
4. Be professional and empathetic
5. Report back with findings and clear recommendations

When you have enough information to resolve the issue or determine next steps, stop and provide your final analysis.`;
  }

  /**
   * Process customer request autonomously with tool access and reasoning
   */
  async processRequest(customerIssue: string, customerId: string): Promise<string> {
    console.log(`[${this.agentName}] Processing for customer ${customerId}`);

    let messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: `Customer ID: ${customerId}\n\nIssue: ${customerIssue}\n\nInvestigate and resolve this issue using your available tools. Provide clear findings and recommendations.`,
      },
    ];

    let iterationCount = 0;
    const maxIterations = 4;

    while (iterationCount < maxIterations) {
      iterationCount++;

      const response = await this.client.messages.create({
        model: 'claude-opus-5',
        max_tokens: 1024,
        system: this.buildSystemPrompt(),
        tools: this.availableTools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          input_schema: {
            type: 'object' as const,
            properties: {
              customer_id: { type: 'string' },
              service_name: { type: 'string' },
              amount: { type: 'number' },
              reason: { type: 'string' },
              service: { type: 'string' },
              email: { type: 'string' },
              phone: { type: 'string' },
              invoice_date: { type: 'string' },
              last_hours: { type: 'number' },
            },
            required: [],
          },
        })),
        messages,
      });

      const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');
      const textBlocks = response.content.filter((b) => b.type === 'text');

      if (toolUseBlocks.length === 0) {
        const finalResponse = textBlocks
          .map((b) => (b.type === 'text' ? b.text : ''))
          .join('\n');
        return finalResponse;
      }

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        if (toolUse.type === 'tool_use') {
          const tool = this.availableTools.find((t) => t.name === toolUse.name);
          if (tool) {
            const result = await tool.execute(toolUse.input as Record<string, unknown>);
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: result,
            });
          }
        }
      }

      messages.push({
        role: 'assistant',
        content: response.content,
      });

      messages.push({
        role: 'user',
        content: toolResults,
      });
    }

    return `${this.agentName} reached maximum iterations`;
  }
}
