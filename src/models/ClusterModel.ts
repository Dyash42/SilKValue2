import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class ClusterModel extends Model {
  static table = 'clusters';

  @field('name') name!: string;
  @field('code') code!: string | null;
  @field('district') district!: string | null;
  @field('region') region!: string | null;
  @field('state') state!: string;
  @field('country') country!: string | null;
  @field('is_active') isActive!: boolean;
  @field('variance_tolerance_percent') varianceTolerancePct!: number | null;
  @date('server_updated_at') serverUpdatedAt!: Date | null;
}
