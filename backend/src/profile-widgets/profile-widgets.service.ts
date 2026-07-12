import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BillingService } from '../billing/billing.service';
import { ProfileWidget } from './entities/profile-widget.entity';
import { WIDGET_DEFINITIONS, WIDGET_KEYS } from './widget-registry';

@Injectable()
export class ProfileWidgetsService {
  constructor(
    @InjectRepository(ProfileWidget) private widgets: Repository<ProfileWidget>,
    private billing: BillingService,
  ) {}

  catalog() {
    return WIDGET_DEFINITIONS;
  }

  mine(userId: string) {
    return this.widgets.find({ where: { userId }, order: { position: 'ASC' } });
  }

  async forUser(userId: string) {
    return this.widgets.find({
      where: { userId, isVisible: true },
      order: { position: 'ASC' },
    });
  }

  async add(userId: string, widgetKey: string, config: Record<string, any> = {}) {
    if (!WIDGET_KEYS.has(widgetKey)) {
      throw new BadRequestException(`Unknown widget type: ${widgetKey}`);
    }
    // Widget customization is a Pro perk. Existing widgets on a lapsed
    // subscription keep working (update/remove/reorder stay open below),
    // but adding new ones requires an active plan.
    const { isPro } = await this.billing.getStatus(userId);
    if (!isPro) {
      throw new ForbiddenException('Upgrade to PBG Pro to add custom profile widgets.');
    }
    const count = await this.widgets.count({ where: { userId } });
    return this.widgets.save(
      this.widgets.create({ userId, widgetKey, config, position: count }),
    );
  }

  async update(
    userId: string,
    id: string,
    data: { config?: Record<string, any>; isVisible?: boolean },
  ) {
    const widget = await this.owned(userId, id);
    Object.assign(widget, data);
    return this.widgets.save(widget);
  }

  async remove(userId: string, id: string) {
    await this.owned(userId, id);
    await this.widgets.delete(id);
  }

  async reorder(userId: string, orderedIds: string[]) {
    const rows = await this.widgets.find({ where: { id: In(orderedIds), userId } });
    if (rows.length !== orderedIds.length) {
      throw new BadRequestException('Reorder list includes widgets you do not own');
    }
    await Promise.all(
      orderedIds.map((id, position) => this.widgets.update({ id, userId }, { position })),
    );
    return this.mine(userId);
  }

  private async owned(userId: string, id: string) {
    const widget = await this.widgets.findOneBy({ id });
    if (!widget) throw new NotFoundException('Widget not found');
    if (widget.userId !== userId) throw new ForbiddenException('You do not own this widget');
    return widget;
  }
}
