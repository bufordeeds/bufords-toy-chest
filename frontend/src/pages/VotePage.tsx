import React, { useEffect } from 'react';
import { GameCard } from '../components/common/GameCard';
import { games } from '../data/games';
import { useStore } from '../store/useStore';
import { votingService } from '../services/votingService';
import './VotePage.css';

export const VotePage: React.FC = () => {
	const { gameVotes, setGameVotes } = useStore();

	useEffect(() => {
		const fetchVotes = async () => {
			const votes = await votingService.getVotes();
			setGameVotes(votes);
		};

		fetchVotes();
	}, [setGameVotes]);

	const getGameVotes = (gameId: string) => {
		return gameVotes.find((v) => v.gameId === gameId);
	};

	const comingSoonGames = games.filter(
		(game) => game.status === 'coming-soon'
	);
	const sortedGames = [...comingSoonGames].sort((a, b) => {
		const votesA = getGameVotes(a.id)?.votes || 0;
		const votesB = getGameVotes(b.id)?.votes || 0;
		return votesB - votesA;
	});

	const leadingGame = sortedGames[0];
	const leadingVotes = getGameVotes(leadingGame?.id)?.votes || 0;

	return (
		<div className='vote-page'>
			<div className='container'>
				<section className='hero-section'>
					<h1 className='hero-title'>What's Next?</h1>
					<p className='hero-subtitle'>
						Help shape the future of Daily Games by voting for the
						games you want to play!
					</p>
				</section>

				<section className='voting-info'>
					<div className='info-card'>
						<h2>How It Works</h2>
						<ul>
							<li>
								Vote for the games you'd like to see added next
							</li>
							<li>
								The game with the most votes gets priority
								development
							</li>
							<li>You can change your vote anytime</li>
							<li>
								New games are added regularly based on community
								feedback
							</li>
						</ul>
					</div>

					{leadingGame && leadingVotes > 0 && (
						<div className='leader-card'>
							<h3>Currently Leading</h3>
							<div className='leader-info'>
								<span className='leader-icon'>
									{leadingGame.icon}
								</span>
								<div className='leader-details'>
									<span className='leader-name'>
										{leadingGame.name}
									</span>
									<span className='leader-votes'>
										{leadingVotes} votes
									</span>
								</div>
							</div>
						</div>
					)}
				</section>

				<section className='games-section'>
					<h2 className='section-title'>Vote for Upcoming Games</h2>
					<div className='games-grid'>
						{sortedGames.map((game) => (
							<GameCard
								key={game.id}
								game={game}
								votes={getGameVotes(game.id)}
							/>
						))}
					</div>

					{sortedGames.length === 0 && (
						<div className='empty-state'>
							<p>No upcoming games to vote on right now.</p>
							<p>Check back soon for new games to vote on!</p>
						</div>
					)}
				</section>

				<section className='feedback-section'>
					<div className='feedback-card'>
						<h2>Have a Game Idea?</h2>
						<p>
							Don't see a game you'd like to play? We'd love to
							hear your suggestions!
						</p>
						<a
							href='https://github.com/bufordeeds/bufords-toy-chest/issues/new'
							target='_blank'
							rel='noopener noreferrer'
							className='feedback-button'
						>
							Suggest a Game
						</a>
					</div>
				</section>
			</div>
		</div>
	);
};
