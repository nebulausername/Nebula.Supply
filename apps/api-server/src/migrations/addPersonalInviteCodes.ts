import { databaseService } from '../services/database';
import { ensurePersonalInviteCode } from '../services/personalInviteCodeService';
import { logger } from '../utils/logger';

/**
 * Migration: Add personal invite codes to all verified users
 * This script generates invite codes for all verified bot users who don't have one yet
 */
export async function migratePersonalInviteCodes(): Promise<{
  total: number;
  processed: number;
  success: number;
  failed: number;
  errors: Array<{ telegramId: number; error: string }>;
}> {
  const batchSize = 100;
  const results = {
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
    errors: [] as Array<{ telegramId: number; error: string }>
  };

  try {
    logger.info('[Migration] Starting personal invite code migration...');

    // Get all verified users without personal invite code
    const pool = databaseService.getPool();
    
    if (!pool) {
      logger.warn('[Migration] No database pool available, using in-memory fallback');
      // Fallback: iterate through in-memory storage
      const storage = (databaseService as any).storage;
      if (storage?.botUsers) {
        const users = Array.from(storage.botUsers.values());
        results.total = users.length;
        
        for (const user of users) {
          if (user.verified_at && !user.personal_invite_code) {
            try {
              await ensurePersonalInviteCode(user.telegram_id);
              results.success++;
            } catch (error) {
              results.failed++;
              results.errors.push({
                telegramId: user.telegram_id,
                error: error instanceof Error ? error.message : String(error)
              });
            }
            results.processed++;
          }
        }
      }
      
      logger.info('[Migration] Personal invite code migration completed', results);
      return results;
    }

    // Get total count of verified users without codes
    const countResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM bot_users
      WHERE verified_at IS NOT NULL
      AND (personal_invite_code IS NULL OR personal_invite_code = '')
    `);
    
    results.total = parseInt(countResult.rows[0]?.total || '0', 10);
    
    if (results.total === 0) {
      logger.info('[Migration] No users need personal invite codes');
      return results;
    }

    logger.info(`[Migration] Found ${results.total} users needing personal invite codes`);

    // Process in batches
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const batchResult = await pool.query(`
        SELECT telegram_id, first_name, username
        FROM bot_users
        WHERE verified_at IS NOT NULL
        AND (personal_invite_code IS NULL OR personal_invite_code = '')
        ORDER BY created_at ASC
        LIMIT $1 OFFSET $2
      `, [batchSize, offset]);

      const batch = batchResult.rows;

      if (batch.length === 0) {
        hasMore = false;
        break;
      }

      logger.info(`[Migration] Processing batch ${Math.floor(offset / batchSize) + 1}: ${batch.length} users`);

      // Process batch in parallel
      await Promise.all(
        batch.map(async (user: any) => {
          try {
            await ensurePersonalInviteCode(user.telegram_id);
            results.success++;
            logger.debug(`[Migration] Generated code for user ${user.telegram_id}`);
          } catch (error) {
            results.failed++;
            const errorMessage = error instanceof Error ? error.message : String(error);
            results.errors.push({
              telegramId: user.telegram_id,
              error: errorMessage
            });
            logger.error(`[Migration] Failed to generate code for user ${user.telegram_id}:`, errorMessage);
          }
          results.processed++;
        })
      );

      offset += batchSize;
      
      // Small delay between batches to avoid overwhelming the database
      if (hasMore && batch.length === batchSize) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    logger.info('[Migration] Personal invite code migration completed', {
      total: results.total,
      processed: results.processed,
      success: results.success,
      failed: results.failed,
      errorCount: results.errors.length
    });

    if (results.errors.length > 0) {
      logger.warn('[Migration] Some users failed to get codes:', {
        errorCount: results.errors.length,
        sampleErrors: results.errors.slice(0, 5)
      });
    }

    return results;
  } catch (error) {
    logger.error('[Migration] Migration failed:', error);
    throw error;
  }
}

/**
 * Run migration manually (for CLI usage)
 */
if (require.main === module) {
  (async () => {
    try {
      await databaseService.init();
      const results = await migratePersonalInviteCodes();
      console.log('\n✅ Migration completed!');
      console.log(`Total users: ${results.total}`);
      console.log(`Processed: ${results.processed}`);
      console.log(`Success: ${results.success}`);
      console.log(`Failed: ${results.failed}`);
      
      if (results.errors.length > 0) {
        console.log(`\n⚠️  Errors (first 10):`);
        results.errors.slice(0, 10).forEach((err, i) => {
          console.log(`  ${i + 1}. User ${err.telegramId}: ${err.error}`);
        });
      }
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  })();
}

























































