import React from "react";

export default function Loader({ size = "default", text = "Loading..." }) {
  const sizeClasses = {
    small: "w-6 h-6",
    default: "w-10 h-10",
    large: "w-16 h-16",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      {/* Animated spinner */}
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-4 border-indigo-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
      </div>
      {text && (
        <p className="text-gray-600 text-sm font-medium animate-pulse">{text}</p>
      )}
    </div>
  );
}

// Full page loader
export function PageLoader({ text = "Loading..." }) {
  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        {/* Logo animation */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center animate-bounce">
            <img src="/logo.png" alt="Heed" className="w-14 h-14 object-contain" />
          </div>
          <div className="absolute -inset-2 bg-indigo-400/30 rounded-2xl animate-ping"></div>
        </div>
        {/* Loading dots */}
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
        <p className="text-gray-600 font-medium">{text}</p>
      </div>
    </div>
  );
}

// Skeleton loader for content
export function SkeletonLoader({ rows = 3 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded-md" style={{ width: `${100 - i * 15}%` }}></div>
      ))}
    </div>
  );
}

// Card skeleton
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  );
}
