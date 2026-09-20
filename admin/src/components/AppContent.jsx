import React from 'react';

const AppContent = ({ children }) => {
  return (
    <div className="main-content fade-in">
      {children}
    </div>
  );
};

export default React.memo(AppContent);