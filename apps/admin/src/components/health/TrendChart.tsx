'use client';

interface TrendChartProps {
  data: Array<{ date: string; averageScore: number; averageGrade: string }>;
}

export function TrendChart({ data }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        No historical data available. Run health checks regularly to build trend history.
      </div>
    );
  }

  const maxScore = 100;
  const minScore = 0;
  const chartHeight = 200;
  const chartWidth = 600;
  const padding = 40;

  // Calculate points for the line chart
  const points = data.map((point, index) => {
    const x = padding + (index / (data.length - 1)) * (chartWidth - padding * 2);
    const y =
      padding +
      ((maxScore - point.averageScore) / (maxScore - minScore)) * (chartHeight - padding * 2);
    return { x, y, ...point };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Calculate trend
  const firstScore = data[0].averageScore;
  const lastScore = data[data.length - 1].averageScore;
  const trend =
    lastScore > firstScore ? 'improving' : lastScore < firstScore ? 'declining' : 'stable';
  const changePercent = firstScore > 0 ? ((lastScore - firstScore) / firstScore) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full"
          style={{ maxHeight: '300px' }}
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((score) => {
            const y =
              padding + ((maxScore - score) / (maxScore - minScore)) * (chartHeight - padding * 2);
            return (
              <g key={score}>
                <line
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  className="text-white/10"
                />
                <text
                  x={padding - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-muted-foreground"
                >
                  {score}
                </text>
              </g>
            );
          })}

          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Gradient */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={trend === 'declining' ? '#EF4444' : '#10B981'} />
              <stop offset="100%" stopColor={trend === 'improving' ? '#10B981' : '#EF4444'} />
            </linearGradient>
          </defs>

          {/* Data points */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="currentColor"
                className={
                  point.averageScore >= 90
                    ? 'text-emerald-400'
                    : point.averageScore >= 70
                      ? 'text-blue-400'
                      : 'text-amber-400'
                }
              />
              {/* Show date on hover */}
              <title>
                {point.date}: {point.averageScore}% (Grade {point.averageGrade})
              </title>
            </g>
          ))}
        </svg>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="text-muted-foreground">First: </span>
          <span className="font-medium text-foreground">{firstScore}%</span>
          <span className="text-muted-foreground ml-2">({data[0].date})</span>
        </div>
        <div className="text-center">
          <span
            className={
              trend === 'improving'
                ? 'text-emerald-400'
                : trend === 'declining'
                  ? 'text-red-400'
                  : 'text-muted-foreground'
            }
          >
            {changePercent > 0 ? '+' : ''}
            {changePercent.toFixed(1)}%
          </span>
          <span className="text-muted-foreground ml-2">
            ({trend === 'improving' ? '↗' : trend === 'declining' ? '↘' : '→'})
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Latest: </span>
          <span className="font-medium text-foreground">{lastScore}%</span>
          <span className="text-muted-foreground ml-2">({data[data.length - 1].date})</span>
        </div>
      </div>
    </div>
  );
}
