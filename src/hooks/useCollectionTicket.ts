import { useState, useEffect } from 'react';
import { Q } from '@nozbe/watermelondb';
import type { Subscription } from 'rxjs';

import { database } from '@/lib/watermelon/database';
import CollectionTicketModel from '@/models/CollectionTicketModel';
import * as CollectionService from '@/services/collection.service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Parameters required to create a new collection ticket. */
export type CreateTicketParams = Parameters<typeof CollectionService.createTicket>[0];

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCollectionTicket() {
  const [pendingTickets, setPendingTickets] = useState<CollectionTicketModel[]>([]);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Live query: tickets that are not yet synced (pending / failed / queued)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const ticketsCollection = database.get<CollectionTicketModel>('collection_tickets');

    const subscription: Subscription = ticketsCollection
      .query(Q.where('sync_status', Q.notEq('synced')))
      .observe()
      .subscribe({
        next: (tickets: CollectionTicketModel[]) => setPendingTickets(tickets),
        error: (err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          console.error('[useCollectionTicket] Pending tickets query error:', msg);
          setError(msg);
        },
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // -------------------------------------------------------------------------
  // createTicket
  // -------------------------------------------------------------------------
  const createTicket = async (
    params: CreateTicketParams,
  ): Promise<CollectionTicketModel> => {
    setIsCreating(true);
    setError(null);
    try {
      const ticket = await CollectionService.createTicket(params);
      return ticket;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  // -------------------------------------------------------------------------
  // submitTicket — marks a locally-created ticket as ready to sync
  // -------------------------------------------------------------------------
  const submitTicket = async (localId: string): Promise<CollectionTicketModel> => {
    setError(null);
    try {
      const ticket = await CollectionService.submitTicket(localId);
      return ticket;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    }
  };

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------
  return {
    createTicket,
    submitTicket,
    pendingTickets,
    isCreating,
    error,
  } as const;
}
