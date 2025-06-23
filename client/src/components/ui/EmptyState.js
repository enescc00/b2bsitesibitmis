import React from 'react';
import { Link } from 'react-router-dom';
import './EmptyState.css';

const EmptyState = ({ message, link, linkText }) => {
    return (
        <div className="empty-state-container">
            <div className="empty-state-icon">
                <i className="fas fa-box-open"></i>
            </div>
            <p>{message}</p>
            {link && linkText && (
                <Link to={link} className="empty-state-link">{linkText}</Link>
            )}
        </div>
    );
};

export default EmptyState;