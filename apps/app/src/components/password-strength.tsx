import { useEffect, useState } from "react";
import zxcvbn from "zxcvbn";

type PasswordStrengthProps = {
  className?: string;
  password: string;
  userInputs?: string[];
  barColors?: string[];
  minLength?: number;
};

const PasswordStrength = ({
  password,
  userInputs = [],
  barColors = ["#cccccc30", "#ef4836", "#f6b44d", "#2b90ef", "#25c281"],
  minLength = 4,
}: PasswordStrengthProps) => {
  const [score, setScore] = useState(0);

  useEffect(() => {
    const result = zxcvbn(password, userInputs);
    setScore(result.score);
  }, [password, userInputs]);

  return (
    <div
      className="-mt-[calc(0.25rem+0.05rem)] absolute flex w-full gap-[.05rem] px-[.05rem] data-[min-length=false]:opacity-50"
      data-min-length={password.length > minLength}
    >
      {[1, 2, 3, 4].map((el) => (
        <div
          className="h-1 w-full bg-primary/25"
          key={`password-strength-bar-item-${el}`}
          style={{
            borderBottomLeftRadius: el === 1 ? "0.5rem" : 0,
            borderBottomRightRadius: el === 4 ? "0.5rem" : 0,
            backgroundColor: score >= el ? barColors[score] : barColors[0],
          }}
        />
      ))}
    </div>
  );
};

export default PasswordStrength;
