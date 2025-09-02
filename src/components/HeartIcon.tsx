import React from 'react';

interface HeartIconProps {
    isSaved?: boolean;
    onClick?: () => void;
    size?: number;
    className?: string;
}

const HeartIcon: React.FC<HeartIconProps> = ({ 
    isSaved = false, 
    onClick, 
    size = 20, 
    className = "" 
}) => {
    return (
        <button
            onClick={onClick}
            className={`transform transition-all duration-200 hover:scale-110 active:scale-95 ${className}`}
            aria-label={isSaved ? "Remove from gallery" : "Save to gallery"}
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill={isSaved ? "#ef4444" : "none"}
                stroke={isSaved ? "#ef4444" : "white"}
                strokeWidth="2"
                className="drop-shadow-sm"
            >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
        </button>
    );
};

export default HeartIcon;
