import React from 'react';
import './ExerciseItem.css';

const ExerciseItem = ({ name, sets, reps, rest_time, description }) => {
  return (
    <div className="exercise-item">
      <div className="exercise-header">
        <h4 className="exercise-name">{name}</h4>
        <span className="exercise-meta">
          {sets} × {reps}
        </span>
      </div>
      
      {description && (
        <p className="exercise-desc">{description}</p>
      )}

      <div className="exercise-footer">
        <span className="rest-badge">
          ⏱ Отдых: {rest_time}
        </span>
      </div>
    </div>
  );
};

export default ExerciseItem;