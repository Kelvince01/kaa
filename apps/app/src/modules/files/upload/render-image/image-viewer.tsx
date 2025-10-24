import * as React from "react";

export type ImageDragData = {
  x: number;
  y: number;
  dx: number;
  dy: number;
};

export type ImageViewerStateType = {
  dragging: boolean;
  mouseDown: boolean;
  comesFromDragging: boolean;
  dragData: ImageDragData;
  matrixData: number[];
};

export type ImageViewerProps = {
  height?: string;
  width?: string;
  className?: string;
  enablePan?: boolean;
  reset?: () => void;
  zoom?: number;
  pandx?: number;
  pandy?: number;
  rotation?: number;
  onPan?: (x: number, y: number) => void;
  setZoom: (z: number) => void;
  onReset?: (dx: number, dy: number, zoom: number) => void;
  onClick?: (e: React.MouseEvent<any>) => void;
  children?: React.ReactNode;
};

// biome-ignore lint/nursery/useReactFunctionComponents: by author
export default class ImageViewer extends React.PureComponent<
  ImageViewerProps,
  ImageViewerStateType
> {
  private panWrapper: HTMLElement | null = null;
  private panContainer: HTMLElement | null = null;

  static defaultProps: Partial<ImageViewerProps> = {
    enablePan: true,
    // biome-ignore lint/suspicious/noEmptyBlockStatements: by author
    onPan: () => {},
    // biome-ignore lint/suspicious/noEmptyBlockStatements: by author
    onReset: () => {},
    pandx: 0,
    pandy: 0,
    zoom: 0,
    rotation: 0,
  };

  private getInitialState = (): ImageViewerStateType => {
    const { pandx, pandy, zoom } = this.props;

    const defaultDragData: ImageDragData = {
      dx: pandx || 0,
      dy: pandy || 0,
      x: 0,
      y: 0,
    };

    return {
      comesFromDragging: false,
      dragData: defaultDragData,
      dragging: false,
      matrixData: [zoom || 1, 0, 0, zoom || 1, pandx || 0, pandy || 0],
      mouseDown: false,
    };
  };

  state = this.getInitialState();

  componentDidUpdate(prevProps: ImageViewerProps) {
    const { zoom } = this.props;
    if (prevProps.zoom !== zoom) {
      const newMatrixData = [...this.state.matrixData];
      newMatrixData[0] = zoom || newMatrixData[0] || 0;
      newMatrixData[3] = zoom || newMatrixData[3] || 0;
      this.setState({ matrixData: newMatrixData });
    }
  }

  reset = () => {
    const matrixData = [0.4, 0, 0, 0.4, 0, 0];
    this.setState({ matrixData });
    if (this.props.onReset) {
      this.props.onReset(0, 0, 1);
    }
  };

  onClick = (e: React.MouseEvent<EventTarget>) => {
    if (this.state.comesFromDragging) {
      return;
    }

    if (this.props.onClick) {
      this.props.onClick(e);
    }
  };

  onTouchStart = (e: React.TouchEvent<EventTarget>) => {
    const { pageX, pageY } = e.touches[0] || { pageX: 0, pageY: 0 };
    this.panStart(pageX, pageY, e);
  };

  onTouchEnd = () => {
    this.onMouseUp();
  };

  onTouchMove = (e: React.TouchEvent<EventTarget>) => {
    this.updateMousePosition(
      e.touches[0]?.pageX || 0,
      e.touches[0]?.pageY || 0
    );
  };

  render() {
    return (
      <div
        className={`pan-container ${this.props.className || ""}`}
        onClick={this.onClick}
        onMouseDown={this.onMouseDown}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
        onMouseMove={this.onMouseMove}
        onMouseUp={this.onMouseUp}
        onTouchEnd={this.onTouchEnd}
        onTouchMove={this.onTouchMove}
        onTouchStart={this.onTouchStart}
        onWheel={this.onWheel}
        ref={(ref: HTMLDivElement | null): void => {
          this.panWrapper = ref;
        }}
        style={{
          height: this.props.height,
          userSelect: "none",
          width: this.props.width,
        }}
      >
        <div
          ref={(ref: HTMLDivElement | null): void => {
            this.panContainer = ref;
          }}
          style={{
            transform: `matrix(${this.state.matrixData.join(",")})`,
          }}
        >
          {this.props.children}
        </div>
      </div>
    );
  }

  private onMouseDown = (e: React.MouseEvent<EventTarget>) => {
    this.panStart(e.pageX, e.pageY, e);
  };

  private panStart = (
    pageX: number,
    pageY: number,
    event: React.MouseEvent<EventTarget> | React.TouchEvent<EventTarget>
  ) => {
    if (!this.props.enablePan) {
      return;
    }

    const { matrixData } = this.state;
    const offsetX = matrixData[4];
    const offsetY = matrixData[5];
    const newDragData: ImageDragData = {
      dx: offsetX || 0,
      dy: offsetY || 0,
      x: pageX,
      y: pageY,
    };
    this.setState({
      dragData: newDragData,
      mouseDown: true,
    });
    if (this.panWrapper) {
      this.panWrapper.style.cursor = "move";
    }
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
    event.preventDefault();
  };

  private onMouseUp = () => {
    this.panEnd();
  };

  private panEnd = () => {
    this.setState({
      comesFromDragging: this.state.dragging,
      dragging: false,
      mouseDown: false,
    });
    if (this.panWrapper) {
      this.panWrapper.style.cursor = "";
    }
    if (this.props.onPan) {
      this.props.onPan(
        this.state.matrixData[4] || 0,
        this.state.matrixData[5] || 0
      );
    }
  };

  preventDefault(e: Event) {
    const event = e || window.event;
    if (event.preventDefault) {
      event.preventDefault();
    }
    event.returnValue = false;
  }

  private onMouseMove = (e: React.MouseEvent<EventTarget>) => {
    this.updateMousePosition(e.pageX, e.pageY);
  };

  private onWheel = (e: React.WheelEvent<EventTarget>) => {
    // biome-ignore lint/nursery/noUnusedExpressions: ignore
    Math.sign(e.deltaY) < 0
      ? this.props.setZoom((this.props.zoom || 0) + 0.1)
      : (this.props.zoom || 0) > 1 &&
        this.props.setZoom((this.props.zoom || 0) - 0.1);
  };

  private onMouseEnter = () => {
    document.addEventListener("wheel", this.preventDefault, {
      passive: false,
    });
  };

  private onMouseLeave = () => {
    document.removeEventListener("wheel", this.preventDefault, false);
  };

  // Change visibility from private to public
  componentWillUnmount() {
    document.removeEventListener("wheel", this.preventDefault, false);
  }

  private updateMousePosition = (pageX: number, pageY: number) => {
    if (!this.state.mouseDown) return;

    const matrixData = this.getNewMatrixData(pageX, pageY);
    this.setState({
      dragging: true,
      matrixData,
    });
    if (this.panContainer) {
      this.panContainer.style.transform = `matrix(${this.state.matrixData.join(",")})`;
    }
  };

  private getNewMatrixData = (x: number, y: number): number[] => {
    const { dragData, matrixData } = this.state;
    const deltaX = dragData.x - x;
    const deltaY = dragData.y - y;
    matrixData[4] = dragData.dx - deltaX;
    matrixData[5] = dragData.dy - deltaY;
    return matrixData;
  };
}
