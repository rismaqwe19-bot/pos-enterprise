/**
 * Offline Sync Manager
 * Queue transactions offline dan sync ke server saat online
 */

class OfflineSync {
  constructor() {
    this.queue = JSON.parse(localStorage.getItem('syncQueue')) || [];
    this.syncInProgress = false;
    this.checkOnlineStatus();
  }

  /**
   * Add transaction ke queue
   */
  addToQueue(transaction) {
    const item = {
      id: Date.now(),
      type: 'transaction',
      data: transaction,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    this.queue.push(item);
    this.saveQueue();
    console.log('Transaction queued:', item);
    return item.id;
  }

  /**
   * Add product ke queue
   */
  addProduct(product) {
    const item = {
      id: Date.now(),
      type: 'product',
      data: product,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    this.queue.push(item);
    this.saveQueue();
    return item.id;
  }

  /**
   * Save queue ke localStorage
   */
  saveQueue() {
    localStorage.setItem('syncQueue', JSON.stringify(this.queue));
  }

  /**
   * Get queue size
   */
  getQueueSize() {
    return this.queue.filter(item => item.status === 'pending').length;
  }

  /**
   * Check online status dan sync jika perlu
   */
  checkOnlineStatus() {
    // Check every 10 seconds
    setInterval(async () => {
      if (navigator.onLine && this.getQueueSize() > 0 && !this.syncInProgress) {
        console.log('Online detected, syncing...');
        await this.syncQueue();
      }
    }, 10000);

    // Listen to online/offline events
    window.addEventListener('online', async () => {
      console.log('Device online');
      if (this.getQueueSize() > 0) {
        await this.syncQueue();
      }
    });

    window.addEventListener('offline', () => {
      console.log('Device offline - transactions will be synced when online');
    });
  }

  /**
   * Sync queue dengan server
   */
  async syncQueue() {
    if (this.syncInProgress || this.queue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    let synced = 0;
    let failed = 0;

    console.log(`Starting sync with ${this.getQueueSize()} pending items...`);

    for (let i = 0; i < this.queue.length; i++) {
      const item = this.queue[i];

      if (item.status !== 'pending') continue;

      try {
        const result = await this.syncItem(item);

        if (result.success) {
          this.queue[i].status = 'synced';
          this.queue[i].syncedAt = new Date().toISOString();
          synced++;
          console.log(`Synced: ${item.type} #${item.id}`);
        } else {
          console.error(`Failed to sync ${item.type}:`, result.message);
          failed++;
        }
      } catch (error) {
        console.error('Sync error:', error);
        failed++;
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Log sync event
    if (api.isAuthenticated()) {
      await api.logSyncEvent(
        this.getDeviceId(),
        synced > 0 ? 'success' : 'partial',
        'automatic',
        synced
      );
    }

    this.saveQueue();
    this.syncInProgress = false;

    console.log(`Sync complete: ${synced} synced, ${failed} failed`);

    // Notify UI
    if (synced > 0) {
      showMessage(`${synced} item(s) synced successfully`, 'success');
    }
    if (failed > 0) {
      showMessage(`${failed} item(s) failed to sync (will retry)`, 'warning');
    }
  }

  /**
   * Sync individual item
   */
  async syncItem(item) {
    try {
      if (item.type === 'transaction') {
        return await api.createTransaction(
          item.data.items,
          item.data.paymentMethod,
          item.data.discountAmount,
          item.data.taxAmount,
          item.data.notes
        );
      } else if (item.type === 'product') {
        if (item.data.id) {
          return await api.updateProduct(item.data.id, item.data);
        } else {
          return await api.createProduct(
            item.data.name,
            item.data.barcode,
            item.data.category,
            item.data.price,
            item.data.cost,
            item.data.stock,
            item.data.unit
          );
        }
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get device ID (unique identifier)
   */
  getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'POS_' + Math.random().toString(36).substr(2, 9).toUpperCase();
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  /**
   * Get queue info
   */
  getQueueInfo() {
    return {
      total: this.queue.length,
      pending: this.getQueueSize(),
      synced: this.queue.filter(item => item.status === 'synced').length,
      queue: this.queue
    };
  }

  /**
   * Clear synced items (cleanup)
   */
  clearSynced() {
    this.queue = this.queue.filter(item => item.status !== 'synced');
    this.saveQueue();
  }

  /**
   * Retry failed items
   */
  retryFailed() {
    // Mark semua item sebagai pending untuk di-sync lagi
    for (let item of this.queue) {
      if (item.status === 'failed') {
        item.status = 'pending';
      }
    }
    this.saveQueue();
    return this.syncQueue();
  }

  /**
   * Remove item dari queue
   */
  removeItem(id) {
    this.queue = this.queue.filter(item => item.id !== id);
    this.saveQueue();
  }

  /**
   * Clear entire queue
   */
  clearQueue() {
    if (confirm('Yakin ingin menghapus semua item di queue?')) {
      this.queue = [];
      this.saveQueue();
      console.log('Queue cleared');
      return true;
    }
    return false;
  }
}

// Initialize sync manager
const sync = new OfflineSync();

/**
 * Override createTransaction untuk support offline
 */
const originalCreateTransaction = async function(items, paymentMethod, discountAmount, taxAmount, notes) {
  try {
    // Try to sync online
    const result = await api.createTransaction(items, paymentMethod, discountAmount, taxAmount, notes);
    return result;
  } catch (error) {
    // If offline, add to queue
    if (!navigator.onLine) {
      console.log('Offline mode: queuing transaction');
      sync.addToQueue({
        items,
        paymentMethod,
        discountAmount,
        taxAmount,
        notes
      });
      return {
        success: true,
        message: 'Transaksi disimpan offline. Akan tersinkronisasi saat online.',
        offline: true
      };
    } else {
      throw error;
    }
  }
};

/**
 * Helper function untuk menampilkan sync status di UI
 */
function showSyncStatus() {
  const info = sync.getQueueInfo();
  if (info.pending > 0) {
    console.log(`Offline Queue: ${info.pending} pending items`);
    return `${info.pending} pending, ${info.synced} synced`;
  }
  return 'Synced';
}

/**
 * Export untuk digunakan di window global
 */
window.sync = sync;
window.showSyncStatus = showSyncStatus;