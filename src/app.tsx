import { XRCanvas } from "@coconut-xr/natuerlich/defaults";
import { inputCanvasProps } from "@coconut-xr/input";

export default function Index() {
  return (
    <XRCanvas
      {...inputCanvasProps}
      style={{
        touchAction: "none",
        overscrollBehavior: "none",
        userSelect: "none",
        position: "absolute",
        inset: 0,
      }}
    >
        
    </XRCanvas>
  );
}
