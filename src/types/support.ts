export type TicketIssueType = 'failed_charge' | 'cancellation' | 'dispute' | 'general';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'assigned' | 'pending_customer' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  subscriptionId: string;
  issueType: TicketIssueType;
  priority: TicketPriority;
  status: TicketStatus;
  title: string;
  description: string;
  assignee?: string;
  externalSystem?: string;
  externalTicketId?: string;
  resolutionSubscriptionId?: string;
  relatedTicketIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionSupportEvent {
  subscriptionId: string;
  issueType: TicketIssueType;
  message: string;
  severity?: TicketPriority;
  occurredAt: Date;
}

export interface SubscriptionSupportContext {
  subscriptionName: string;
  planName: string;
  planTier: string;
  billingCycle: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  nextBillingDate: string;
  failedPayments: number;
  chargeCount: number;
  history: string[];
}

export interface TicketingIntegrationConfig {
  provider: 'zendesk' | 'freshdesk' | 'intercom' | 'internal';
  enabled: boolean;
  defaultAssignee?: string;
}
