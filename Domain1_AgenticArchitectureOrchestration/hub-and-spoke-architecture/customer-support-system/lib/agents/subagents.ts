import { BaseSubAgent } from './base-agent';
import { getToolsByAgent } from './tools';

export class BillingAgent extends BaseSubAgent {
  constructor() {
    super(
      'BillingAgent',
      'Handle billing inquiries, refunds, invoices, and payment issues',
      getToolsByAgent('billing')
    );
  }
}

export class TechnicalAgent extends BaseSubAgent {
  constructor() {
    super(
      'TechnicalAgent',
      'Diagnose and resolve technical issues with services and connectivity',
      getToolsByAgent('technical')
    );
  }
}

export class AccountAgent extends BaseSubAgent {
  constructor() {
    super(
      'AccountAgent',
      'Manage account information, customer history, profile updates, and complex issues',
      getToolsByAgent('account')
    );
  }
}
