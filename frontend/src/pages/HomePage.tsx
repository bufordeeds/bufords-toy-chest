import React, { useEffect, useState } from 'react';
import { GameCard } from '../components/common/GameCard';
import { games } from '../data/games';
import { useStore } from '../store/useStore';
import {
	leaderboardService,
	type LeaderboardEntry
} from '../services/leaderboardService';
import { votingService } from '../services/votingService';
import './HomePage.css';

export const HomePage: React.FC = () => {
	const { gameScores, gameVotes, setGameVotes } = useStore();
	const [leaderboardData, setLeaderboardData] = useState<
		Record<string, LeaderboardEntry | null>
	>({});

	useEffect(() => {
		const fetchData = async () => {
			const leaderboardEntries: Record<string, LeaderboardEntry | null> =
				{};

			for (const game of games) {
				if (game.type === 'single' && game.status === 'available') {
					try {
						const leaderboard =
							await leaderboardService.getLeaderboard(game.id, 1);
						leaderboardEntries[game.id] = leaderboard[0] || null;
					} catch (error) {
						console.error(
							`Failed to fetch leaderboard for ${game.id}:`,
							error
						);
						leaderboardEntries[game.id] = null;
					}
				}
			}

			setLeaderboardData(leaderboardEntries);

			const votes = await votingService.getVotes();
			setGameVotes(votes);
		};

		fetchData();
	}, [setGameVotes]);

	const getHighScore = (gameId: string) => {
		const score = gameScores.find((s) => s.gameId === gameId);
		return score?.highScore;
	};

	const getGameVotes = (gameId: string) => {
		return gameVotes.find((v) => v.gameId === gameId);
	};

	const singlePlayerGames = games.filter((game) => game.type === 'single');
	const multiplayerGames = games.filter(
		(game) => game.type === 'multiplayer'
	);

	return (
		<div className='home-page'>
			<div className='container'>
				<section className='hero-section'>
					<h1 className='hero-title'>
						Daily Games
					</h1>
					<p className='hero-subtitle'>
						Your daily dose of puzzle and strategy games. Take a break, challenge yourself, and beat your high score.
					</p>
				</section>

				<section className='daily-section'>
					<h2 className='section-title'>Today's Daily Puzzles</h2>
					<p className='section-description'>
						Fresh puzzles every day - solve them once and come back tomorrow for more!
					</p>
					<div className='daily-grid'>
						<div className='daily-card coming-soon'>
							<h3>Daily Word Challenge</h3>
							<p>Coming Soon</p>
						</div>
						<div className='daily-card coming-soon'>
							<h3>Daily Logic Puzzle</h3>
							<p>Coming Soon</p>
						</div>
						<div className='daily-card coming-soon'>
							<h3>Daily Brain Teaser</h3>
							<p>Coming Soon</p>
						</div>
					</div>
				</section>

				<section className='games-section'>
					<h2 className='section-title'>Challenge Yourself</h2>
					<p className='section-description'>
						Quick games perfect for a mental break. Can you beat your personal best?
					</p>
					<div className='games-grid'>
						{singlePlayerGames.map((game) => (
							<GameCard
								key={game.id}
								game={game}
								highScore={getHighScore(game.id)}
								leaderboardEntry={leaderboardData[game.id]}
								votes={getGameVotes(game.id)}
							/>
						))}
					</div>
				</section>

				<section className='games-section'>
					<h2 className='section-title'>Play with Friends</h2>
					<p className='section-description'>
						Quick multiplayer games for when you want to challenge friends during your break!
					</p>
					<div className='games-grid'>
						{multiplayerGames.map((game) => (
							<GameCard
								key={game.id}
								game={game}
								votes={getGameVotes(game.id)}
							/>
						))}
					</div>
				</section>
			</div>
		</div>
	);
};
