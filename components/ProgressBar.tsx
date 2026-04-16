import { progressPercent } from "@/lib/utils";

interface Props {
  count: number;
  goal: number;
  showLabel?: boolean;
}

export default function ProgressBar({ count, goal, showLabel = true }: Props) {
  const pct = progressPercent(count, goal);
  const reached = pct >= 100;

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            입대의 제안 가능 기준{" "}
            <span className="font-semibold text-gray-700">{goal}명</span>
          </span>
          <span
            className={`font-bold tabular-nums ${
              reached ? "text-success-500" : "text-primary-600"
            }`}
          >
            {pct}%
          </span>
        </div>
      )}

      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`progress-bar h-full rounded-full ${
            reached
              ? "bg-success-500"
              : "bg-gradient-to-r from-primary-500 to-primary-600"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {reached && (
        <p className="text-xs font-medium text-success-600">
          목표 달성! 입대의에 제안할 수 있어요.
        </p>
      )}
    </div>
  );
}
