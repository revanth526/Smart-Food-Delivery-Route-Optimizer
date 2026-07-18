const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey && supabaseUrl !== 'your_supabase_url_here' && supabaseKey !== 'your_supabase_anon_key_here') {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('🔌 Connected to Supabase real-time broadcast client.');
  } catch (err) {
    console.warn('❌ Failed to initialize Supabase client:', err.message);
  }
} else {
  console.warn('⚠️ Supabase credentials not found in env variables. Running in standard REST polling fallback mode.');
}

/**
 * Broadcasts an order status and rider location change to clients listening via web-sockets
 * @param {string} orderId 
 * @param {object} payload { orderStatus, deliveryCoordinates }
 */
const broadcastOrderUpdate = async (orderId, payload) => {
  if (!supabase) return;
  try {
    const channel = supabase.channel(`order-tracker:${orderId}`);
    
    // Send event broadcast
    await channel.send({
      type: 'broadcast',
      event: 'status-update',
      payload: {
        orderId,
        ...payload,
        updatedAt: new Date().toISOString()
      }
    });
    console.log(`📡 Broadcasted live update for Order #${orderId}: ${payload.orderStatus || 'Location Update'}`);
  } catch (err) {
    console.error(`❌ Supabase broadcast failed for Order #${orderId}:`, err.message);
  }
};

module.exports = {
  broadcastOrderUpdate
};
