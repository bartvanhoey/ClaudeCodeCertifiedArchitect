import { AgentTool } from './types';

export const toolRegistry: { [key: string]: AgentTool } = {
  // Billing tools
  check_account_balance: {
    name: 'check_account_balance',
    description: 'Check the customer account balance and payment history',
    execute: async (params: Record<string, unknown>) => {
      const customerId = params.customer_id;
      return `Balance: $150.50, Last payment: 2024-08-01, Status: Active, Customer: ${customerId}`;
    },
  },

  get_invoice: {
    name: 'get_invoice',
    description: 'Retrieve a specific invoice by date or ID',
    execute: async (params: Record<string, unknown>) => {
      const invoiceDate = params.invoice_date || 'latest';
      return `Invoice from ${invoiceDate}: $89.99 for Monthly Premium Subscription, Status: Paid`;
    },
  },

  process_refund: {
    name: 'process_refund',
    description: 'Process a refund for the customer',
    execute: async (params: Record<string, unknown>) => {
      const amount = params.amount || 'requested';
      const reason = params.reason || 'general';
      return `Refund of $${amount} processed successfully for reason: ${reason}. Refund ID: REF-20240807-001`;
    },
  },

  // Technical tools
  check_service_status: {
    name: 'check_service_status',
    description: 'Check if services are up and running',
    execute: async (params: Record<string, unknown>) => {
      const serviceName = params.service_name || 'primary';
      return `Service '${serviceName}' is operational. Last incident: 3 days ago (resolved). Uptime: 99.95%`;
    },
  },

  get_error_logs: {
    name: 'get_error_logs',
    description: 'Retrieve error logs for a customer account',
    execute: async (params: Record<string, unknown>) => {
      const lastHours = params.last_hours || 24;
      return `Recent errors (last ${lastHours}h): [10:45] Connection timeout (1 occurrence), [09:22] Database query slow >5s (2 occurrences). Pattern: Load spike correlation`;
    },
  },

  restart_service: {
    name: 'restart_service',
    description: 'Restart a specific service for the customer',
    execute: async (params: Record<string, unknown>) => {
      const service = params.service || 'primary';
      return `Service '${service}' restarted successfully. Status: healthy. Connections re-established.`;
    },
  },

  // Account tools
  get_customer_history: {
    name: 'get_customer_history',
    description: 'Get customer interaction history and profile',
    execute: async (params: Record<string, unknown>) => {
      const customerId = params.customer_id;
      return `Customer ${customerId}: Tenure 2 years, Total issues: 3 (all resolved), Loyalty status: Gold, Satisfaction score: 4.8/5`;
    },
  },

  update_contact_info: {
    name: 'update_contact_info',
    description: 'Update customer contact information',
    execute: async (params: Record<string, unknown>) => {
      const updates = Object.keys(params)
        .filter((k) => k !== 'customer_id' && params[k])
        .join(', ');
      return `Contact info updated successfully for fields: ${updates || 'none'}`;
    },
  },

  escalate_to_human: {
    name: 'escalate_to_human',
    description: 'Escalate the issue to human support staff',
    execute: async (params: Record<string, unknown>) => {
      const reason = params.reason || 'complex issue';
      return `Issue escalated to human support team. Ticket #98765 created. Reason: ${reason}. Expected response: 2 hours`;
    },
  },
};

export function getToolsByAgent(agentType: 'billing' | 'technical' | 'account'): AgentTool[] {
  const toolMap = {
    billing: ['check_account_balance', 'get_invoice', 'process_refund'],
    technical: ['check_service_status', 'get_error_logs', 'restart_service'],
    account: ['get_customer_history', 'update_contact_info', 'escalate_to_human'],
  };

  return toolMap[agentType]
    .map((name) => toolRegistry[name])
    .filter((tool) => tool !== undefined);
}
