import React from 'react';
import './CircularChart.css';

const CircularChart = ({ 
  value, 
  maxValue, 
  size = 80, 
  strokeWidth = 8, 
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  showPercentage = false,
  label = '',
  className = ''
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  return (
    <div className={`circular-chart ${className}`}>
      <svg width={size} height={size} className="circular-chart-svg">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="progress-circle"
        />
        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="chart-text"
          fontSize={size * 0.2}
          fill="#374151"
          fontWeight="600"
        >
          {showPercentage ? `${Math.round(percentage)}%` : value}
        </text>
      </svg>
      {label && (
        <div className="chart-label">
          {label}
        </div>
      )}
    </div>
  );
};

export default CircularChart;