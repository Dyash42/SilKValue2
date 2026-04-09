import { Q } from '@nozbe/watermelondb';
import { v4 as uuidv4 } from 'uuid';

import { database } from '@/lib/watermelon/database';
import { supabase } from '@/lib/supabase/client';
import CollectionTicketModel from '@/models/CollectionTicketModel';
import type { PricingSnapshot } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateTicketParams {
  reelerId: string;
  collectorId: string;
  routeId: string | null;
  routeStopId: string | null;
  grossWeightKg: number;
  tareWeightKg: number;
  qualityGrade: string;
  moisturePercent: number | null;
  crateCount: number;
  pricePerKg: number;
  pricingSnapshot: PricingSnapshot;
  photos: string[];
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  gpsAccuracyMeters: number | null;
  deviceId: string | null;
  networkStatus: string;
}

// ---------------------------------------------------------------------------
// createTicket
// ---------------------------------------------------------------------------

/**
 * Creates a new collection ticket locally in WatermelonDB with `sync_status =
 * 'pending'` and `status = 'draft'`. All derived values (net weight, total
 * amount, ticket number, idempotency key) are computed here.
 */
export async function createTicket(
  params: CreateTicketParams,
): Promise<CollectionTicketModel> {
  const {
    reelerId,
    collectorId,
    routeId,
    routeStopId,
    grossWeightKg,
    tareWeightKg,
    qualityGrade,
    moisturePercent,
    crateCount,
    pricePerKg,
    pricingSnapshot,
    photos,
    gpsLatitude,
    gpsLongitude,
    gpsAccuracyMeters,
    deviceId,
    networkStatus,
  } = params;

  const netWeightKg = grossWeightKg - tareWeightKg;
  const totalAmount = netWeightKg * pricePerKg;
  const ticketNumber = `TKT-${Date.now()}`;
  const idempotencyKey = uuidv4();

  const ticket = await database.write(async () => {
    return database
      .get<CollectionTicketModel>('collection_tickets')
      .create((record) => {
        record.ticketNumber = ticketNumber;
        record.reelerId = reelerId;
        record.collectorId = collectorId;
        record.routeId = routeId;
        record.routeStopId = routeStopId;
        record.grossWeightKg = grossWeightKg;
        record.tareWeightKg = tareWeightKg;
        record.netWeightKg = netWeightKg;
        record.qualityGrade = qualityGrade;
        record.moisturePercent = moisturePercent;
        record.crateCount = crateCount;
        record.pricePerKg = pricePerKg;
        record.totalAmount = totalAmount;
        record.pricingSnapshot = JSON.stringify(pricingSnapshot);
        record.photos = JSON.stringify(photos);
        record.collectionTimestamp = new Date();
        record.gpsLatitude = gpsLatitude;
        record.gpsLongitude = gpsLongitude;
        record.gpsAccuracyMeters = gpsAccuracyMeters;
        record.deviceId = deviceId;
        record.networkStatus = networkStatus;
        record.syncStatus = 'pending';
        record.status = 'draft';
        record.idempotencyKey = idempotencyKey;
      });
  });

  return ticket;
}

// ---------------------------------------------------------------------------
// submitTicket
// ---------------------------------------------------------------------------

/**
 * Transitions a ticket from `draft` to `submitted` in WatermelonDB.
 * The sync engine is responsible for pushing this change to Supabase.
 */
export async function submitTicket(localId: string): Promise<CollectionTicketModel> {
  const ticket = await database
    .get<CollectionTicketModel>('collection_tickets')
    .find(localId);

  if (!ticket) {
    throw new Error(`submitTicket: ticket with local id "${localId}" not found.`);
  }

  await database.write(async () => {
    await ticket.update((record) => {
      record.status = 'submitted';
      record.syncStatus = 'pending';
    });
  });

  return ticket;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns all tickets belonging to a given reeler, ordered by collection
 * timestamp descending (newest first).
 */
export async function getTicketsByReeler(
  reelerId: string,
): Promise<CollectionTicketModel[]> {
  return database
    .get<CollectionTicketModel>('collection_tickets')
    .query(
      Q.where('reeler_id', reelerId),
      Q.sortBy('collection_timestamp', Q.desc),
    )
    .fetch();
}

/**
 * Returns all tickets collected by a given collector, newest first.
 */
export async function getTicketsByCollector(
  collectorId: string,
): Promise<CollectionTicketModel[]> {
  return database
    .get<CollectionTicketModel>('collection_tickets')
    .query(
      Q.where('collector_id', collectorId),
      Q.sortBy('collection_timestamp', Q.desc),
    )
    .fetch();
}

/**
 * Returns all tickets whose `sync_status` is `'pending'` — these are queued
 * to be uploaded on the next sync cycle.
 */
export async function getPendingTickets(): Promise<CollectionTicketModel[]> {
  return database
    .get<CollectionTicketModel>('collection_tickets')
    .query(Q.where('sync_status', 'pending'))
    .fetch();
}

// ---------------------------------------------------------------------------
// Price list
// ---------------------------------------------------------------------------

/**
 * Fetches the currently active price for a given quality grade from Supabase.
 *
 * The `price_lists` table stores a `grade_prices` JSON column (object mapping
 * grade → price_per_kg). This function finds the most-recently-effective active
 * price list and extracts the price for the requested grade.
 *
 * Returns `{ pricePerKg, priceListId }` or null when no active entry exists.
 */
export async function fetchCurrentPriceList(
  grade: string,
): Promise<{ pricePerKg: number; priceListId: string } | null> {
  const { data, error } = await supabase
    .from('price_lists')
    .select('id, grade_prices, effective_from')
    .eq('is_active', true)
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`fetchCurrentPriceList failed for grade "${grade}": ${error.message}`);
  }

  if (!data) {
    return null;
  }

  // grade_prices is a JSON object: { "A": 500, "B": 400, ... }
  const gradePrices = data.grade_prices as Record<string, number> | null;

  if (!gradePrices || typeof gradePrices[grade] !== 'number') {
    return null;
  }

  return {
    pricePerKg: gradePrices[grade],
    priceListId: data.id,
  };
}
