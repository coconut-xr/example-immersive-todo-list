import {
  Glass,
  IconButton,
  List,
  ListItem,
  Checkbox,
  TextInput,
} from "@coconut-xr/apfel-kruemel";
import { Container, RootContainer, Text } from "@coconut-xr/koestlich";
import { Trash, Plus } from "@coconut-xr/lucide-koestlich";
import { create } from "zustand";
import { combine } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import { Controllers, Hands, XRCanvas } from "@coconut-xr/natuerlich/defaults";
import {
  ImmersiveSessionOrigin,
  NonImmersiveCamera,
  SessionModeGuard,
  SessionSupportedGuard,
  useEnterXR,
} from "@coconut-xr/natuerlich/react";
import { inputCanvasProps } from "@coconut-xr/input";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Event, Group, Mesh, Vector3 } from "three";
import { isXIntersection } from "@coconut-xr/xinteraction";
import { ThreeEvent } from "@react-three/fiber";

type State = {
  list: Array<ListItemProps>;
};

const initialState: State = {
  list: [
    {
      id: uuid(),
      value: "Buy Apples",
      checked: false,
    },
  ],
};

const useStore = create(
  combine(initialState, (set, get) => ({
    addItem(value: string) {
      if (value.length === 0) {
        return;
      }
      const { list } = get();
      set({
        list: [
          ...list,
          {
            id: uuid(),
            checked: false,
            value,
          },
        ],
      });
    },
    deleteItem(id: string) {
      console.log(id);
      const { list } = get();
      const index = list.findIndex((item) => item.id === id);
      if (index === -1) {
        return;
      }
      set({ list: [...list.slice(0, index), ...list.slice(index + 1)] });
    },
    toggleChecked(id: string) {
      const { list } = get();
      const index = list.findIndex((item) => item.id === id);
      if (index === -1) {
        return;
      }
      const entry = list[index];
      if (entry == null) {
        return;
      }
      set({
        list: [
          ...list.slice(0, index),
          {
            ...entry,
            checked: !entry.checked,
          },
          ...list.slice(index + 1),
        ],
      });
    },
  }))
);

const sessionOptions: XRSessionInit = {
  requiredFeatures: ["local-floor", "hand-tracking"],
};

export default function Index() {
  const list = useStore((state) => state.list);
  const enterAR = useEnterXR("immersive-ar", sessionOptions);
  const ref = useRef<Group>(null);
  const downState = useRef<{
    pointerId: number;
    pointToObjectOffset: Vector3;
  }>();
  return (
    <>
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
        <SessionModeGuard deny="immersive-ar">
          <color args={[0]} attach="background" />
          <gridHelper args={[100, 100]}>
            <meshBasicMaterial color="#333" />
          </gridHelper>
        </SessionModeGuard>
        <directionalLight position={[1, 1, 2]} />
        <NonImmersiveCamera position={[0, 1.5, -0.1]} />
        <ImmersiveSessionOrigin>
          <Controllers type="pointer" />
        </ImmersiveSessionOrigin>
        <group ref={ref}>
          <RootContainer
            dragThreshold={32}
            position={[0, 1.5, -0.5]}
            pixelSize={0.001}
          >
            <Glass minWidth={420} padding={10} borderRadius={20}>
              {list.map((listItem, index) => (
                <ListEntry {...listItem} index={index} key={listItem.id} />
              ))}
              <Input />
            </Glass>
            <Container
              onPointerDown={(e: ThreeEvent<Event>) => {
                if (
                  ref.current != null &&
                  downState.current == null &&
                  isXIntersection(e)
                ) {
                  e.stopPropagation();
                  (e.target as HTMLElement).setPointerCapture(e.pointerId);
                  downState.current = {
                    pointerId: e.pointerId,
                    pointToObjectOffset: ref.current.position
                      .clone()
                      .sub(e.point),
                  };
                }
              }}
              onPointerUp={(e: ThreeEvent<Event>) => {
                if (downState.current?.pointerId != e.pointerId) {
                  return;
                }
                downState.current = undefined;
              }}
              onPointerMove={(e: ThreeEvent<Event>) => {
                if (
                  ref.current == null ||
                  downState.current == null ||
                  e.pointerId != downState.current.pointerId ||
                  !isXIntersection(e)
                ) {
                  return;
                }
                ref.current.position
                  .copy(downState.current.pointToObjectOffset)
                  .add(e.point);
              }}
              padding={20}
            >
              <Container
                borderRadius={5}
                padding={5}
                marginX="auto"
                width="80%"
                backgroundOpacity={0.5}
                backgroundColor="white"
              />
            </Container>
          </RootContainer>
        </group>
      </XRCanvas>
      <SessionSupportedGuard mode="immersive-ar">
        <div
          style={{
            position: "absolute",
            bottom: "1rem",
            left: "50%",
            transform: "translate(-50%, 0)",
            fontFamily: "Arial",
            padding: "0.5rem 1rem",
            borderRadius: "0.3rem",
            background: "#333",
            color: "#ddd",
          }}
          onClick={enterAR}
        >
          Enter AR
        </div>
      </SessionSupportedGuard>
    </>
  );
}

type ListItemProps = {
  id: string;
  value: string;
  checked: boolean;
};

const { toggleChecked, deleteItem } = useStore.getState();

function ListEntry({
  checked,
  id,
  index,
  value,
}: ListItemProps & { index: number }) {
  return (
    <List id={id} index={index} type="plain" width={400}>
      <ListItem
        flexBasis={0}
        minWidth={0}
        onClick={() => toggleChecked(id)}
        leadingAccessory={<Checkbox selected={checked} />}
        trailingAccessory={
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              deleteItem(id);
            }}
            size="md"
            platter
          >
            <Trash height={18} width={18} />
          </IconButton>
        }
      >
        <Text>{value}</Text>
      </ListItem>
    </List>
  );
}

const { addItem } = useStore.getState();

function Input() {
  const [value, setValue] = useState("");
  const ref = useRef(value);
  ref.current = value;
  const submit = useCallback(() => {
    setValue("");
    addItem(ref.current);
  }, []);
  useEffect(() => {
    const onKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        submit();
      }
    };
    window.addEventListener("keypress", onKeyPress);
    return () => window.removeEventListener("keypress", onKeyPress);
  }, []);
  return (
    <Container padding={20} index={Infinity} flexDirection="row" gapColumn={32}>
      <TextInput
        onValueChange={setValue}
        value={value}
        style="pill"
        flexBasis={0}
        flexGrow={1}
        placeholder="Enter Item"
      />

      <IconButton
        disabled={value.length === 0}
        onClick={submit}
        size="md"
        platter
      >
        <Plus height={18} width={18} />
      </IconButton>
    </Container>
  );
}
