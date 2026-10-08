import { globalEvents } from './EventBus.js';

/**
 * StorageAdapter
 * Provides unified save/load/delete abstraction.
 * Currently uses LocalStorage; architected with clean hooks for Clerk Auth + Supabase DB.
 */
export class StorageAdapter {
  constructor(storageKey = 'realm_of_lords_frontier_save_v1') {
    this.storageKey = storageKey;
    this.cloudProvider = null; // 'supabase' in the future
    this.authClient = null;    // Clerk in the future
  }

  // Check if local save exists
  hasSave() {
    try {
      return !!localStorage.getItem(this.storageKey);
    } catch (e) {
      console.warn('StorageAdapter: LocalStorage unavailable', e);
      return false;
    }
  }

  // Get metadata summary of existing save
  getSaveMetadata() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return {
        timestamp: data.timestamp || Date.now(),
        dateString: new Date(data.timestamp || Date.now()).toLocaleString(),
        rank: data.rank?.title || '小队长',
        population: data.population || 8,
        season: data.season?.name || '春季',
        dayTime: data.dayTime || '10:00'
      };
    } catch (e) {
      return null;
    }
  }

  // Save game snapshot (supports slot-based or default storage)
  async saveGame(slotOrSnapshot, maybeSnapshot = null) {
    try {
      let key = this.storageKey;
      let gameSnapshot = slotOrSnapshot;

      if (maybeSnapshot !== null) {
        key = `${this.storageKey}_${slotOrSnapshot}`;
        gameSnapshot = maybeSnapshot;
      }

      const payload = {
        version: '1.2.0',
        timestamp: Date.now(),
        ...gameSnapshot
      };

      const serialized = JSON.stringify(payload);
      localStorage.setItem(key, serialized);

      // Future Cloud Sync Hook (Clerk + Supabase)
      if (this.cloudProvider === 'supabase' && this.authClient?.isSignedIn) {
        await this.syncToSupabase(payload);
      }

      globalEvents.emit('saveCompleted', { success: true, timestamp: payload.timestamp });
      return true;
    } catch (err) {
      console.error('StorageAdapter save error:', err);
      globalEvents.emit('saveCompleted', { success: false, error: err });
      return false;
    }
  }

  // Load game snapshot (supports slot-based or default storage)
  async loadGame(slot = null) {
    try {
      const key = slot ? `${this.storageKey}_${slot}` : this.storageKey;

      // Future Cloud Sync Hook (Supabase)
      if (this.cloudProvider === 'supabase' && this.authClient?.isSignedIn) {
        const cloudData = await this.fetchFromSupabase();
        if (cloudData) return cloudData;
      }

      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const data = JSON.parse(raw);
      globalEvents.emit('loadCompleted', { success: true });
      return data;
    } catch (err) {
      console.error('StorageAdapter load error:', err);
      globalEvents.emit('loadCompleted', { success: false, error: err });
      return null;
    }
  }

  // Delete saved game
  async deleteSave(slot = null) {
    try {
      const key = slot ? `${this.storageKey}_${slot}` : this.storageKey;
      localStorage.removeItem(key);

      // Future Cloud Sync Hook (Supabase)
      if (this.cloudProvider === 'supabase' && this.authClient?.isSignedIn) {
        await this.deleteFromSupabase();
      }

      globalEvents.emit('saveDeleted', { success: true });
      return true;
    } catch (err) {
      console.error('StorageAdapter delete error:', err);
      return false;
    }
  }

  /* =========================================================================
   * FUTURE CLOUD INTEGRATION STUBS (Clerk Auth + Supabase Postgres DB)
   * ========================================================================= */

  /**
   * Configure Clerk and Supabase credentials
   * @param {Object} clerkInstance - Clerk JS SDK instance
   * @param {Object} supabaseInstance - Supabase Client instance
   */
  configureCloudBackend(clerkInstance, supabaseInstance) {
    this.authClient = clerkInstance;
    this.cloudProvider = 'supabase';
    this.supabaseClient = supabaseInstance;
  }

  async syncToSupabase(payload) {
    if (!this.supabaseClient || !this.authClient?.user) return;
    const userId = this.authClient.user.id;
    // Example table: 'user_saves' (id, user_id, save_data, updated_at)
    const { error } = await this.supabaseClient
      .from('user_saves')
      .upsert({ user_id: userId, save_data: payload, updated_at: new Date() });
    if (error) console.warn('Supabase sync error:', error);
  }

  async fetchFromSupabase() {
    if (!this.supabaseClient || !this.authClient?.user) return null;
    const userId = this.authClient.user.id;
    const { data, error } = await this.supabaseClient
      .from('user_saves')
      .select('save_data')
      .eq('user_id', userId)
      .single();
    if (error || !data) return null;
    return data.save_data;
  }

  async deleteFromSupabase() {
    if (!this.supabaseClient || !this.authClient?.user) return;
    const userId = this.authClient.user.id;
    await this.supabaseClient.from('user_saves').delete().eq('user_id', userId);
  }
}

export const storage = new StorageAdapter();
