/**
 * Demo script showing how the hub-and-spoke system works
 * This file demonstrates the architecture without running the full Next.js server
 */

import { OrchestratorAgent } from './agents/orchestrator';
import { CustomerIssue } from './agents/types';

const demoIssues: CustomerIssue[] = [
  {
    customerId: 'CUST-12345',
    description:
      'I was charged twice for my subscription this month. Can I get a refund?',
    timestamp: new Date().toISOString(),
  },
  {
    customerId: 'CUST-67890',
    description:
      'My API service keeps timing out. I am getting connection refused errors every 5 minutes.',
    timestamp: new Date().toISOString(),
  },
  {
    customerId: 'CUST-54321',
    description:
      'I need to update my email address and I am interested in upgrading my account tier.',
    timestamp: new Date().toISOString(),
  },
];

export async function runDemo() {
  console.log('\n' + '='.repeat(80));
  console.log('HUB-AND-SPOKE ARCHITECTURE DEMO');
  console.log('Customer Support System with Specialized Subagents');
  console.log('='.repeat(80));

  const orchestrator = new OrchestratorAgent();

  for (const issue of demoIssues) {
    console.log('\n' + '—'.repeat(80));
    console.log(`\n📬 INCOMING ISSUE FOR ${issue.customerId}\n`);
    console.log(`Issue: "${issue.description}"\n`);

    try {
      const response = await orchestrator.handleCustomerIssue(issue);

      console.log('\n' + '—'.repeat(80));
      console.log(`\n✅ FINAL CUSTOMER RESPONSE:\n`);
      console.log(response);
      console.log('\n' + '—'.repeat(80));
    } catch (error) {
      console.error(`\n❌ Error processing issue: ${error}`);
    }

    // Small delay between issues
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(80));
  console.log('DEMO COMPLETE');
  console.log('='.repeat(80));
  console.log('\nKey Observations:');
  console.log('1. Issues were routed to different agents based on content');
  console.log('2. Each agent used domain-specific tools autonomously');
  console.log('3. Agents made independent decisions without hub intervention');
  console.log('4. Responses were synthesized into customer-friendly language');
  console.log('\nThis is TRUE hub-and-spoke architecture with real subagents.\n');
}

// Run if executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}
