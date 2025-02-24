// components/MetricsCard.tsx

interface MetricsCardProps {
  title: string;
  value: string;
  unit: string;
  confidence: string;
}

export default function MetricsCard({
  title,
  value,
  unit,
  confidence,
}: MetricsCardProps) {
  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-2xl font-bold">
        {value > 0 ? value : '--'} {unit}
      </p>
      <p>Confidence: {confidence.toFixed(1)}%</p>
    </div>
  );
}
