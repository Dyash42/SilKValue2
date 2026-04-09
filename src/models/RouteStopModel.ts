import { Model, Relation } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import RouteModel from './RouteModel';
import ReelerModel from './ReelerModel';

export default class RouteStopModel extends Model {
  static table = 'route_stops';

  static associations = {
    routes: { type: 'belongs_to' as const, key: 'route_id' },
    reelers: { type: 'belongs_to' as const, key: 'reeler_id' },
  };

  @field('route_id') routeId!: string;
  @field('reeler_id') reelerId!: string;
  @field('stop_order') stopOrder!: number;
  @field('status') status!: string;
  @field('expected_weight_kg') expectedWeightKg!: number | null;
  @date('actual_arrival_time') actualArrivalTime!: Date | null;
  @field('collection_ticket_id') collectionTicketId!: string | null;
  @field('skip_reason') skipReason!: string | null;
  @field('collector_notes') collectorNotes!: string | null;
  @date('server_updated_at') serverUpdatedAt!: Date | null;

  @relation('routes', 'route_id') route!: Relation<RouteModel>;
  @relation('reelers', 'reeler_id') reeler!: Relation<ReelerModel>;
}
