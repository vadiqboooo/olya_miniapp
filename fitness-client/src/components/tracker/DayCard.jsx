import React from 'react';
import './DayCard.css';

const DayCard = ({ dayNumber, title, isCompleted, isActive, onClick }) => {
  // Определяем иконку статуса
  const statusIcon = isCompleted ? '✅' : '⭕';

  return (
    <div
      className={`day-card ${isActive ? 'day-card-active' : ''} ${isCompleted ? 'day-card-completed' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="day-header">
        <span className="day-number">День {dayNumber}</span>
        <span className="day-status-icon">{statusIcon}</span>
      </div>
      
      <div className="day-title">
        {title || 'Отдых' }
      </div>
    </div>
  );
};

export default DayCard;