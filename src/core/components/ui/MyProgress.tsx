"use client";


interface CircularProgressProps {
  value: number; // 0–100
  size?: number; // diameter in px
  strokeWidth?: number; // thickness of the circle
  color?: string; // stroke color
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 10,
  color = "#22c55e", // Tailwind green-500
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          stroke="#e5e7eb" // Tailwind gray-200
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span className="absolute text-lg font-bold text-gray-700">
        {Math.round(value)}%
      </span>
    </div>
  );
}
