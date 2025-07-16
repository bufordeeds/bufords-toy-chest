import { initFirebase } from '../services/firebase.js';
import { initDatabase, dbAll } from '../services/database.js';
import { firebaseDb } from '../services/firebaseDatabase.js';

async function migrateData() {
  try {
    console.log('Starting migration from SQLite to Firebase...');
    
    // Initialize both databases
    await initFirebase();
    await initDatabase();
    
    // Migrate leaderboard data
    console.log('Migrating leaderboard data...');
    const leaderboardEntries = await dbAll('SELECT * FROM leaderboard');
    
    for (const entry of leaderboardEntries) {
      await firebaseDb.addLeaderboardEntry({
        gameId: entry.gameId,
        playerName: entry.playerName,
        score: entry.score,
        achievedAt: entry.achievedAt
      });
      console.log(`Migrated leaderboard entry: ${entry.playerName} - ${entry.score} in ${entry.gameId}`);
    }
    
    // Migrate nominations
    console.log('Migrating nominations...');
    const nominations = await dbAll('SELECT * FROM nominations');
    
    for (const nomination of nominations) {
      await firebaseDb.addNomination({
        name: nomination.name,
        description: nomination.description,
        category: nomination.category,
        difficulty: nomination.difficulty,
        estimatedComplexity: nomination.estimatedComplexity,
        submittedAt: nomination.submittedAt
      });
      // Update votes separately
      await firebaseDb.updateNominationVotes(nomination.id, nomination.votes);
      console.log(`Migrated nomination: ${nomination.name}`);
    }
    
    // Migrate votes
    console.log('Migrating votes...');
    const votes = await dbAll('SELECT * FROM votes');
    
    for (const vote of votes) {
      await firebaseDb.addVote({
        nominationId: vote.nominationId,
        voterIp: vote.voterIp,
        votedAt: vote.votedAt
      });
      console.log(`Migrated vote: ${vote.id}`);
    }
    
    // Migrate game votes
    console.log('Migrating game votes...');
    const gameVotes = await dbAll('SELECT * FROM game_votes');
    
    for (const gameVote of gameVotes) {
      await firebaseDb.addGameVote({
        gameId: gameVote.gameId,
        voterIp: gameVote.voterIp,
        votedAt: gameVote.votedAt
      });
      console.log(`Migrated game vote: ${gameVote.gameId}`);
    }
    
    console.log('Migration completed successfully!');
    console.log(`Migrated ${leaderboardEntries.length} leaderboard entries`);
    console.log(`Migrated ${nominations.length} nominations`);
    console.log(`Migrated ${votes.length} votes`);
    console.log(`Migrated ${gameVotes.length} game votes`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateData();
}