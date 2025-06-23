import React from 'react';
import './SkeletonCard.css';

const SkeletonCard = () => {
    return (
        <div className="skeleton-card">
            <div className="skeleton-image"></div>
            <div className="skeleton-body">
                <div className="skeleton-line short"></div>
                <div className="skeleton-line long"></div>
                <div className="skeleton-line medium"></div>
                <div className="skeleton-footer">
                    <div className="skeleton-line price"></div>
                    <div className="skeleton-button"></div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonCard;