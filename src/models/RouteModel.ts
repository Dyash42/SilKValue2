import { Model, Query } from '@nozbe/watermelondb';
import { field, date, children } from '@nozbe/watermelondb/decorators';
import RouteStopModel from './RouteStopModel';

export default class RouteModel extends Model {
  static table = 'routes';

  static associations = {
    route_stops: { type: 'has_many' as const, foreignKey: 'route_id' },
  };

  @field('name') name!: string;
  @date('date') date!: Date;
  @field('cluster_id') clusterId!: string;
  @field('vehicle_id') vehicleId!: string | null;
  @field('collector_id') collectorId!: string;
  @field('supervisor_id') supervisorId!: string | null;
  @field('status') status!: string;
  @field('total_stops') totalStops!: number;
  @field('completed_stops') completedStops!: number;
  @field('expected_total_weight_kg') expectedTotalWeightKg!: number | null;
  @field('actual_total_weight_kg') actualTotalWeightKg!: number | null;
  @date('server_updated_at') serverUpdatedAt!: Date | null;

  @children('route_stops') stops!: Query<RouteStopModel>;
}
