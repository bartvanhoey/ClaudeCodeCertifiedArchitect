import { NextRequest, NextResponse } from 'next/server';
import { OrchestratorAgent } from '@/lib/agents/orchestrator';
import { CustomerIssue } from '@/lib/agents/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, description } = body;

    if (!customerId || !description) {
      return NextResponse.json(
        {
          error: 'MISSING_FIELDS',
          message: 'customerId and description are required',
        },
        { status: 400 }
      );
    }

    const issue: CustomerIssue = {
      customerId,
      description,
      timestamp: new Date().toISOString(),
    };

    const orchestrator = new OrchestratorAgent();
    const response = await orchestrator.handleCustomerIssue(issue);

    return NextResponse.json(
      {
        success: true,
        customerId,
        response,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        error: 'SUPPORT_REQUEST_FAILED',
        message: 'Failed to process support request',
      },
      { status: 500 }
    );
  }
}
