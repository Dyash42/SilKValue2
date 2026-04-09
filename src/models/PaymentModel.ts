import { Model, Relation } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import CollectionTicketModel from './CollectionTicketModel';

export default class PaymentModel extends Model {
  static table = 'payments';

  static associations = {
    collection_tickets: { type: 'belongs_to' as const, key: 'collection_ticket_id' },
  };

  @field('collection_ticket_id') collectionTicketId!: string | null;
  @field('reeler_id') reelerId!: string;
  @field('amount') amount!: number;
  @field('payment_mode') paymentMode!: string;
  @field('payment_status') paymentStatus!: string;
  @field('gateway_provider') gatewayProvider!: string | null;
  @field('transaction_reference') transactionReference!: string | null;
  @date('initiated_at') initiatedAt!: Date;
  @date('server_updated_at') serverUpdatedAt!: Date | null;

  @relation('collection_tickets', 'collection_ticket_id') ticket!: Relation<CollectionTicketModel>;
}
