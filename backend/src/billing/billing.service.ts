import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from './entities/subscription.entity';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

const STRIPE_STATUS_MAP: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
  active: SubscriptionStatus.ACTIVE,
  trialing: SubscriptionStatus.TRIALING,
  past_due: SubscriptionStatus.PAST_DUE,
  canceled: SubscriptionStatus.CANCELED,
  incomplete: SubscriptionStatus.INCOMPLETE,
  incomplete_expired: SubscriptionStatus.INCOMPLETE_EXPIRED,
  unpaid: SubscriptionStatus.UNPAID,
  paused: SubscriptionStatus.CANCELED,
};

export interface SubscriptionStatusResult {
  isPro: boolean;
  plan: SubscriptionPlan | null;
  status: SubscriptionStatus | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe;
  private readonly priceIds: Record<SubscriptionPlan, string>;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {
    this.stripe = new Stripe(
      this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
    );
    this.priceIds = {
      [SubscriptionPlan.MONTHLY]: this.configService.getOrThrow<string>(
        'STRIPE_PRICE_MONTHLY',
      ),
      [SubscriptionPlan.YEARLY]: this.configService.getOrThrow<string>(
        'STRIPE_PRICE_YEARLY',
      ),
    };
  }

  private get frontendUrl(): string {
    return this.configService.get<string>('FRONTEND_URL') || 'https://pbgearbag.com';
  }

  private async getOrCreateStripeCustomer(user: User): Promise<string> {
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    const customer = await this.stripe.customers.create({
      email: user.email,
      name: user.displayName || user.username,
      metadata: { userId: user.id },
    });

    await this.usersService.updateStripeCustomerId(user.id, customer.id);
    return customer.id;
  }

  async createCheckoutSession(
    user: User,
    plan: SubscriptionPlan,
  ): Promise<string> {
    const priceId = this.priceIds[plan];
    if (!priceId) {
      throw new BadRequestException(`Unknown plan: ${plan}`);
    }

    const customerId = await this.getOrCreateStripeCustomer(user);

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.frontendUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.frontendUrl}/billing/cancel`,
      client_reference_id: user.id,
      metadata: { userId: user.id, plan },
      subscription_data: { metadata: { userId: user.id, plan } },
    });

    if (!session.url) {
      throw new BadRequestException('Failed to create checkout session');
    }

    return session.url;
  }

  async createPortalSession(user: User): Promise<string> {
    if (!user.stripeCustomerId) {
      throw new BadRequestException('No billing account found for this user');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${this.frontendUrl}/profile`,
    });

    return session.url;
  }

  async getStatus(userId: string): Promise<SubscriptionStatusResult> {
    // The platform's own super admin gets Pro for free, permanently — no
    // real subscription row needed, so there's nothing to expire, get out
    // of sync with Stripe, or accidentally cancel.
    const superAdminEmail = (
      this.configService.get('SUPER_ADMIN_EMAIL') || 'andrew@arandmedia.com'
    ).toLowerCase();
    const user = await this.usersService.findById(userId);
    if (user?.email?.toLowerCase() === superAdminEmail) {
      return {
        isPro: true,
        plan: SubscriptionPlan.YEARLY,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });

    if (!subscription) {
      return {
        isPro: false,
        plan: null,
        status: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
    }

    const isPro =
      subscription.status === SubscriptionStatus.ACTIVE ||
      subscription.status === SubscriptionStatus.TRIALING;

    return {
      isPro,
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.getOrThrow<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  }

  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          await this.syncSubscription(
            session.subscription as string,
            session.metadata?.userId,
          );
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await this.syncSubscription(sub.id, sub.metadata?.userId);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.subscriptionRepository.update(
          { stripeSubscriptionId: sub.id },
          { status: SubscriptionStatus.CANCELED },
        );
        break;
      }
      default:
        this.logger.debug(`Unhandled Stripe event type: ${event.type}`);
    }
  }

  private async syncSubscription(
    stripeSubscriptionId: string,
    userIdHint?: string,
  ): Promise<void> {
    const stripeSub = await this.stripe.subscriptions.retrieve(
      stripeSubscriptionId,
    );
    const userId = userIdHint || stripeSub.metadata?.userId;

    if (!userId) {
      this.logger.warn(
        `Subscription ${stripeSubscriptionId} has no userId metadata; skipping sync`,
      );
      return;
    }

    const priceId = stripeSub.items.data[0]?.price.id;
    const plan =
      priceId === this.priceIds[SubscriptionPlan.YEARLY]
        ? SubscriptionPlan.YEARLY
        : SubscriptionPlan.MONTHLY;
    const status = STRIPE_STATUS_MAP[stripeSub.status] || SubscriptionStatus.INCOMPLETE;
    const currentPeriodEnd = new Date(stripeSub.current_period_end * 1000);

    const existing = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId },
    });

    if (existing) {
      await this.subscriptionRepository.update(existing.id, {
        status,
        plan,
        stripePriceId: priceId,
        currentPeriodEnd,
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      });
    } else {
      await this.subscriptionRepository.save(
        this.subscriptionRepository.create({
          userId,
          stripeCustomerId: stripeSub.customer as string,
          stripeSubscriptionId,
          stripePriceId: priceId,
          plan,
          status,
          currentPeriodEnd,
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        }),
      );
    }
  }
}
