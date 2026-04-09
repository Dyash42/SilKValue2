import { Model, Relation } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import ReelerModel from './ReelerModel';
import RouteModel from './RouteModel';

export default class CollectionTicketModel extends Model {
  static table = 'collection_tickets';

  static associations = {
    reelers: { type: 'belongs_to' as const, key: 'reeler_id' },
    routes: { type: 'belongs_to' as const, key: 'route_id' },
  };

  @field('ticket_number') ticketNumber!: string;
  @field('route_stop_id') routeStopId!: string | null;
  @field('collector_id') collectorId!: string;
  @field('reeler_id') reelerId!: string;
  @field('route_id') routeId!: string | null;
  @field('gross_weight_kg') grossWeightKg!: number;
  @field('tare_weight_kg') tareWeightKg!: number;
  @field('net_weight_kg') netWeightKg!: number;
  @field('quality_grade') qualityGrade!: string;
  @field('moisture_percent') moisturePercent!: number | null;
  @field('visual_notes') visualNotes!: string | null;
  @field('crate_count') crateCount!: number;
  @field('price_list_id') priceListId!: string | null;
  @field('price_per_kg') pricePerKg!: number;
  @field('total_amount') totalAmount!: number;
  @field('pricing_snapshot') pricingSnapshot!: string;
  @date('collection_timestamp') collectionTimestamp!: Date;
  @field('gps_latitude') gpsLatitude!: number | null;
  @field('gps_longitude') gpsLongitude!: number | null;
  @field('gps_accuracy_meters') gpsAccuracyMeters!: number | null;
  @field('device_id') deviceId!: string | null;
  @field('network_status') networkStatus!: string | null;
  @field('sync_status') syncStatus!: string;
  @field('status') status!: string;
  @field('idempotency_key') idempotencyKey!: string;
  @field('photos') photos!: string | null;
  @date('server_updated_at') serverUpdatedAt!: Date | null;

  @relation('reelers', 'reeler_id') reeler!: Relation<ReelerModel>;
  @relation('routes', 'route_id') route!: Relation<RouteModel>;

  /**
   * Returns the parsed pricing snapshot object.
   * Falls back to an empty object if the stored value is absent or malformed.
   */
  get parsedPricingSnapshot(): Record<string, unknown> {
    try {
      return JSON.parse(this.pricingSnapshot ?? '{}') as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  /**
   * Returns the parsed photos array.
   * Falls back to an empty array if the stored value is absent or malformed.
   */
  get parsedPhotos(): string[] {
    try {
      const parsed = JSON.parse(this.photos ?? '[]');
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  }
}
