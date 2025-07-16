import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

export const Header: React.FC = () => {
	const location = useLocation();

	return (
		<header className='header'>
			<div className='container'>
				<div className='header-content'>
					<Link to='/' className='header-logo'>
						<img src='/favicon.ico' alt='Daily Games' className='logo-icon' />
						<h1 className='logo-text'>Daily Games</h1>
					</Link>

					<nav className='header-nav'>
						<Link
							to='/'
							className={`nav-link ${
								location.pathname === '/' ? 'active' : ''
							}`}
						>
							Games
						</Link>
						<Link
							to='/vote'
							className={`nav-link ${
								location.pathname === '/vote' ? 'active' : ''
							}`}
						>
							What's Next?
						</Link>
						<Link
							to='/about'
							className={`nav-link ${
								location.pathname === '/about' ? 'active' : ''
							}`}
						>
							About
						</Link>
					</nav>
				</div>
			</div>
		</header>
	);
};
