import { Model, Relation } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import ProfileModel from './ProfileModel';

export default class ReelerModel extends Model {
  static table = 'reelers';

  static associations = {
    profiles: { type: 'belongs_to' as const, key: 'profile_id' },
  };

  @field('profile_id') profileId!: string;
  @field('phone') phone!: string;
  @field('full_name') fullName!: string;
  @field('cluster_id') clusterId!: string | null;
  @field('bank_account_masked') bankAccountMasked!: string | null;
  @field('ifsc_code') ifscCode!: string | null;
  @field('upi_id') upiId!: string | null;
  @field('payment_preference') paymentPreference!: string;
  @field('total_collections') totalCollections!: number;
  @field('total_earnings_inr') totalEarningsInr!: number;
  @field('qr_code_hash') qrCodeHash!: string | null;
  @date('consent_captured_at') consentCapturedAt!: Date | null;
  @field('farm_area_hectares') farmAreaHectares!: number | null;
  @date('server_updated_at') serverUpdatedAt!: Date | null;

  @relation('profiles', 'profile_id') profile!: Relation<ProfileModel>;
}
