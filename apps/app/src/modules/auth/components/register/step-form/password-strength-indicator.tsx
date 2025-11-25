"use client";

type PasswordStrengthIndicatorProps = {
  password: string;
};

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const calculateStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    // biome-ignore lint/performance/useTopLevelRegex: ignore
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    // biome-ignore lint/performance/useTopLevelRegex: ignore
    if (/\d/.test(pwd)) strength++;
    // biome-ignore lint/performance/useTopLevelRegex: ignore
    if (/[^a-zA-Z\d]/.test(pwd)) strength++;
    return Math.min(strength, 4);
  };

  const strength = calculateStrength(password);

  const strengthConfig = [
    { label: "Very Weak", color: "bg-red-500" },
    { label: "Weak", color: "bg-orange-500" },
    { label: "Fair", color: "bg-yellow-500" },
    { label: "Good", color: "bg-blue-500" },
    { label: "Strong", color: "bg-emerald-500" },
  ];

  const config = strengthConfig[strength];

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[...new Array(5)].map((_, i) => (
          <div
            className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? config?.color : "bg-slate-200"}`}
            key={i.toString()}
          />
        ))}
      </div>
      {password && (
        <p className="text-slate-600 text-xs">
          Password strength:{" "}
          <span className="font-medium">{config?.label}</span>
        </p>
      )}
    </div>
  );
}
