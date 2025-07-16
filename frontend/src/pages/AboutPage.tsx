import React from 'react';
import './AboutPage.css';

export const AboutPage: React.FC = () => {
	return (
		<div className='about-page'>
			<div className='container'>
				<section className='hero-section'>
					<h1 className='hero-title'>About Daily Games</h1>
					<p className='hero-subtitle'>
						Your daily destination for quick, engaging puzzle and strategy games
					</p>
				</section>

				<section className='content-section'>
					<div className='about-content'>
						<div className='about-card'>
							<h2 className='section-title'>A Daily Break for Your Mind</h2>
							<p className='about-text'>
								Daily Games is designed around a simple philosophy: games should be a 
								refreshing mental break, not a time sink. I believe in the power of 
								quick, engaging puzzles that challenge your mind without consuming your day.
							</p>
							<p className='about-text'>
								Whether you're looking for a 5-minute brain teaser during your coffee break 
								or want to challenge yourself to beat yesterday's score, this is your 
								daily destination for quality puzzle and strategy games.
							</p>
						</div>

						<div className='about-card'>
							<h2 className='section-title'>Daily Puzzles, Daily Joy</h2>
							<p className='about-text'>
								Soon, you'll find fresh daily puzzles inspired by the best of what 
								publications like The New York Times have done with games like Wordle. 
								Each day brings new challenges designed to be solved once and leave you 
								looking forward to tomorrow's puzzle.
							</p>
							<p className='about-text'>
								The goal is simple: visit once a day, enjoy a mental challenge, 
								and return tomorrow for more. No endless scrolling, no addiction mechanics 
								– just pure, satisfying puzzle-solving.
							</p>
						</div>

						<div className='about-card'>
							<h2 className='section-title'>Built by a Solo Developer</h2>
							<p className='about-text'>
								Hi, I'm Buford! As a solo developer with a passion for puzzle and strategy games, 
								I created Daily Games to share that love with others. Every game here is 
								crafted with care, focusing on clean mechanics and that satisfying moment 
								when everything clicks.
							</p>
							<p className='about-text'>
								I'm constantly working on new daily puzzles and refining existing games. 
								Have feedback or suggestions? I'd love to hear from you – the best games 
								come from understanding what players truly enjoy.
							</p>
						</div>

						<div className='about-card support-card'>
							<h2 className='section-title'>Support Daily Games</h2>
							<p className='about-text'>
								If you enjoy Daily Games and would like to support its development, 
								consider buying me a coffee! Your support helps keep the site running 
								and motivates me to create more engaging puzzles and games.
							</p>
							<a 
								href='https://coff.ee/bufordeeds' 
								target='_blank' 
								rel='noopener noreferrer'
								className='coffee-button'
							>
								Buy Me a Coffee
							</a>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
};