import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class ProfileModel extends Model {
  static table = 'profiles';

  // No WatermelonDB associations needed: cluster lives in its own table but
  // profiles only store a plain cluster_id string (no @relation required here
  // because ClusterModel is looked up separately via the clusters collection).

  @field('user_id') userId!: string;
  @field('phone') phone!: string;
  @field('full_name') fullName!: string;
  @field('role') role!: string;
  @field('cluster_id') clusterId!: string | null;
  @field('is_verified') isVerified!: boolean;
  @field('kyc_status') kycStatus!: string;
  @field('preferred_language') preferredLanguage!: string | null;
  @field('employee_id') employeeId!: string | null;
  @date('last_active_at') lastActiveAt!: Date | null;
  @date('server_updated_at') serverUpdatedAt!: Date | null;
}
