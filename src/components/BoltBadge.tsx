import React from 'react';

export const BoltBadge: React.FC = () => {
  return (
    <a
      href="https://bolt.new"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center hover:opacity-80 transition-all duration-200 group"
      title="Built with Bolt.new"
    >
      <img
        src="/black_circle_360x360.png"
        alt="Bolt.new"
        className="w-16 h-16 rounded-full group-hover:scale-105 transition-transform"
      />
    </a>
  );
};