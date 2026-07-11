import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { BillingService } from './billing.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { User } from '../users/entities/user.entity';
import { SubscriptionPlan } from './entities/subscription.entity';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('checkout-session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createCheckoutSession(
    @CurrentUser() user: User,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    const url = await this.billingService.createCheckoutSession(
      user,
      dto.plan as SubscriptionPlan,
    );
    return { url };
  }

  @Post('portal-session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createPortalSession(@CurrentUser() user: User) {
    const url = await this.billingService.createPortalSession(user);
    return { url };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getStatus(@CurrentUser() user: User) {
    return this.billingService.getStatus(user.id);
  }

  @Post('webhook')
  @Public()
  @HttpCode(200)
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    const event = this.billingService.constructWebhookEvent(
      req.body as Buffer,
      signature,
    );
    await this.billingService.handleWebhookEvent(event);
    return { received: true };
  }
}
