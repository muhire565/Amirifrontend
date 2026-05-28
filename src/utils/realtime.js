import { supabase } from '../config/supabase';

// All known broadcast event names used across the POS system
const BROADCAST_EVENTS = [
  'new_order',
  'order_updated',
  'order_ready',
  'order_paid',
  'void_request',
  'void_reviewed',
  'payment_received',
  'low_stock_alert',
  'table_updated',
];

// Global registry to share channel subscriptions across components
const channelRegistry = {};

export const subscribeToChannel = (channelName, eventHandler, statusHandler) => {
  if (!supabase) return () => {};
  
  // If the channel doesn't exist, create and subscribe
  if (!channelRegistry[channelName]) {
    console.log(`[Realtime] Creating subscription for: ${channelName}`);
    
    const listeners = new Set();
    const statusListeners = new Set();
    let currentStatus = 'connecting';

    let channel = supabase.channel(channelName);

    // Register a listener for each known broadcast event
    BROADCAST_EVENTS.forEach((eventName) => {
      channel = channel.on('broadcast', { event: eventName }, (payload) => {
        console.log(`[Realtime] ${channelName} ← ${eventName}`);
        listeners.forEach(fn => fn({ ...payload, event: eventName }));
      });
    });

    channel.subscribe((status) => {
      console.log(`[Realtime] ${channelName} status: ${status}`);
      currentStatus = status;
      statusListeners.forEach(fn => fn(status));

      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error(`[Realtime] ${channelName} failed (${status}), retrying in 3s…`);
        setTimeout(() => {
          if (channelRegistry[channelName]) {
            supabase.removeChannel(channel);
            delete channelRegistry[channelName];
            // Re-subscribe with current listeners
            const fns = [...listeners];
            const sfns = [...statusListeners];
            listeners.clear();
            statusListeners.clear();
            fns.forEach(fn => subscribeToChannel(channelName, fn, null));
            sfns.forEach(fn => {
              if (channelRegistry[channelName]) {
                channelRegistry[channelName].statusListeners.add(fn);
              }
            });
          }
        }, 3000);
      }
    });

    channelRegistry[channelName] = {
      channel,
      listeners,
      statusListeners,
      getStatus: () => currentStatus
    };
  } else {
    console.log(`[Realtime] Reusing subscription for: ${channelName}`);
    // Immediately notify of current status
    if (statusHandler) statusHandler(channelRegistry[channelName].getStatus());
  }

  // Add this specific listener to the registry
  const registry = channelRegistry[channelName];
  registry.listeners.add(eventHandler);
  if (statusHandler) registry.statusListeners.add(statusHandler);

  return () => {
    registry.listeners.delete(eventHandler);
    if (statusHandler) registry.statusListeners.delete(statusHandler);

    // If no more listeners, fully remove the channel
    if (registry.listeners.size === 0) {
      console.log(`[Realtime] Removing channel: ${channelName}`);
      supabase.removeChannel(registry.channel);
      delete channelRegistry[channelName];
    }
  };
};
