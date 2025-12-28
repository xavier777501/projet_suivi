import React from 'react';
import './SemiCircularChart.css';

const SemiCircularChart = ({ 
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
  const circumference = Math.PI * radius; // Demi-cercle
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  return (
    <div className={`semi-circular-chart ${className}`}>
      <div className="chart-container" style={{ width: size, height: size / 2 + 20 }}>
        <svg width={size} height={size / 2 + 20} className="semi-circular-svg">
          {/* Background arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={0}
            strokeLinecap="round"
            className="progress-arc"
          />
        </svg>
        {/* Center text */}
        <div className="chart-center-text">
          <div className="chart-value">
            {showPercentage ? `${Math.round(percentage)}%` : value}
          </div>
          {label && <div className="chart-label-inline">{label}</div>}
        </div>
      </div>
    </div>
  );
};

export default SemiCircularChart;