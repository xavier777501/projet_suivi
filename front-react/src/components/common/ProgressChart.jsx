import React from 'react';
import './ProgressChart.css';

const ProgressChart = ({ 
  value, 
  maxValue, 
  height = 60,
  width = 60,
  color = '#3b82f6',
  backgroundColor = 'rgba(255, 255, 255, 0.2)',
  showValue = true,
  label = '',
  className = '',
  icon = null
}) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div className={`progress-chart ${className}`}>
      <div className="progress-container" style={{ width: `${width}px`, height: `${height}px` }}>
        {/* Background circle */}
        <div 
          className="progress-background"
          style={{ 
            width: `${width}px`, 
            height: `${height}px`,
            backgroundColor: backgroundColor,
            borderRadius: '50%'
          }}
        />
        
        {/* Progress ring */}
        <svg 
          className="progress-ring" 
          width={width} 
          height={height}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <circle
            cx={width / 2}
            cy={height / 2}
            r={(width - 8) / 2}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${(percentage / 100) * (2 * Math.PI * ((width - 8) / 2))} ${2 * Math.PI * ((width - 8) / 2)}`}
            strokeDashoffset={0}
            transform={`rotate(-90 ${width / 2} ${height / 2})`}
            className="progress-stroke"
          />
        </svg>

        {/* Center content */}
        <div className="progress-content">
          {icon && <div className="progress-icon">{icon}</div>}
          {showValue && (
            <div className="progress-value" style={{ color }}>
              {value}
            </div>
          )}
        </div>
      </div>
      
      {label && (
        <div className="progress-label">
          {label}
        </div>
      )}
    </div>
  );
};

export default ProgressChart;