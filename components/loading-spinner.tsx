interface LoadingSpinnerProps {
  className?: string;
}

export function LoadingSpinner({ className = "" }: LoadingSpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
    >
      {/* Rotating Avatar with SVG wrapper */}
      <div className="relative">
        <svg
          className="w-20 h-20 animate-spin"
          viewBox="0 0 80 80"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <clipPath id="circle-clip">
              <circle cx="40" cy="40" r="40" />
            </clipPath>
          </defs>
          <image
            href="/donermd.svg"
            x="0"
            y="0"
            width="80"
            height="80"
            clipPath="url(#circle-clip)"
            preserveAspectRatio="xMidYMid slice"
          />
        </svg>
      </div>

      {/* Progress Bar */}
      <div className="w-48 h-1 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-secondary animate-pulse color-primary"
          style={{
            width: "100%",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}
