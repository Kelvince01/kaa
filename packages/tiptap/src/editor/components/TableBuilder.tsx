import { PopoverClose } from "@radix-ui/react-popover";
import clsx from "clsx";
import { useMemo, useState } from "react";

const COLUMNS = 7;
const ROWS = 5;

type GridSize = { cols: number; rows: number };

type TableBuilderProps = {
  onCreate?: (value: GridSize) => void;
};

const TableBuilder = ({ onCreate }: TableBuilderProps) => {
  const [gridSize, setGridSize] = useState<GridSize>({ cols: 1, rows: 1 });

  const isActiveCell = (rowIndex: number, colIndex: number) =>
    rowIndex < gridSize.rows && colIndex < gridSize.cols;

  // biome-ignore lint/correctness/useExhaustiveDependencies: false positive
  const grid = useMemo(
    () =>
      Array.from({ length: ROWS }, (_, rowIndex) => (
        <div className="rte-tb__row" key={`row-${rowIndex.toString()}`}>
          {Array.from({ length: COLUMNS }, (_, colIndex) => (
            // biome-ignore lint/a11y/noNoninteractiveElementInteractions: false positive
            // biome-ignore lint/a11y/noStaticElementInteractions: false positive
            // biome-ignore lint/a11y/useKeyWithClickEvents: false positive
            <div
              className={clsx(
                "rte-tb__cell",
                isActiveCell(rowIndex, colIndex) && "rte-tb__cell--active"
              )}
              key={`col-${colIndex.toString()}`}
              onClick={() => onCreate?.(gridSize)}
              onMouseMove={() =>
                setGridSize({ cols: colIndex + 1, rows: rowIndex + 1 })
              }
            />
          ))}
        </div>
      )),
    [gridSize]
  );

  return (
    <div className="rte-tb__builder">
      <PopoverClose asChild>
        <div className="rte-tb__grid">{grid}</div>
      </PopoverClose>
      <div style={{ textAlign: "center", marginBlock: 3 }}>
        {gridSize.rows} x {gridSize.cols}
      </div>
    </div>
  );
};

export default TableBuilder;
