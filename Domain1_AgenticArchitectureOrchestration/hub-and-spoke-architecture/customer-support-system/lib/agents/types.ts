export interface AgentTool {
  name: string;
  description: string;
  execute: (params: Record<string, unknown>) => Promise<string>;
}

export interface CustomerIssue {
  customerId: string;
  description: string;
  timestamp?: string;
}

export interface RoutingDecision {
  primaryAgent: 'billing' | 'technical' | 'account';
  confidence: number;
  reasoning: string;
}

export interface AnalysisResult {
  agentType: string;
  findings: string;
  recommendedActions: string[];
  severity: 'low' | 'medium' | 'high';
}
