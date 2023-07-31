# Immersive Todo List - Tutorial :beginner:

_using the Coconut-XR Ecosystem_

# TBD: insert immersive and non-immersive gif of the final result

_If you encounter problems during the tutorial, please visit our [Discord](https://discord.com/invite/NCYM8ujndE) for help._

This tutorial goes over the basics for the individual libraries of the Coconut-XR Ecosystem. If you are interested in one library specifically, please check out the documentations for the [User Interface Library - Koestlich](https://coconut-xr.github.io/koestlich/#/) and the [WebXR Interaction Library - Natuerlich](https://coconut-xr.github.io/natuerlich/#/).

## Setting up the development environment :computer:

For the basic development setup, please fork and clone this repository, and us `npm install` to install all dependencies.

This will install a set of libraries that simplify building our application.
We will use `@coconut-xr/koestlich` for building the user interface, `@coconut-xr/apfel-kruemel` for a set of pre-designed components, such as Lists, `@coconut-xr/lucide-koestlich` for icons, `@coconut-xr/natuerlich` for interactivity, `zustand` for state management, and `@react-three/fiber` and `three` for handling the rendering. This template uses `vite` to build the application.

## Development

Using the command `npm run dev` we can start the development server, and access the page in the browser to see the applicationing containg a empty canvas, for now.

To start filling the canvas with 3D content we will modify the `app.tsx` file. The `app.tsx` currently contains the `XRCanvas` imported from `@coconut-xr/natuerlich/defaults`. The canvas is configured to fill the whole screen using `position: "absolute" and inset: 0` and the `touchAction: "none", overscrollBehavior: "none", and userSelect: "none"` disable unwanted interactions with the canvas element. Lastly, the `inputCanvasProps` disable unwanted focus changes necassary for working with input fields inside the 3D scene.

```tsx
import { XRCanvas } from "@coconut-xr/natuerlich/defaults";
import { inputCanvasProps } from "@coconut-xr/input";

export default function Index() {
  return (
    <XRCanvas
      style={{
        position: "absolute",
        inset: 0,
        touchAction: "none",
        overscrollBehavior: "none",
        userSelect: "none",
      }}
      {...inputCanvasProps}
    ></XRCanvas>
  );
}
```

## Adding a grid visualization and placing camera and immersive origin

With the basic setup out of the way, we are ready to add some 3D elements.

First, we set the background color to black using the `color` component. Next, we add a `gridHelper` to visualize the floor with a basic material in dark-gray (`#333`). We also add a directional light at position (1,1,2) pointing at the origin (0,0,0) by default. To position the camera, when not in VR or AR, we use the `NonImmersiveCamera` component. Lastly, we position the origin of the VR and AR sessions at (0,0,0).

The following codes shows the required changes. The screenshot illustrates the expected result of the changes.

![Screenshot]()

```tsx
import {
  ImmersiveSessionOrigin,
  NonImmersiveCamera
} from "@coconut-xr/natuerlich/react";
...

export default function Index() {
  return (
    <XRCanvas
      ...
    >
      <color args={[0]} attach="background" />
      <gridHelper args={[100, 100]}>
        <meshBasicMaterial color="#333" />
      </gridHelper>
      <directionalLight position={[1, 1, 2]} />
      <NonImmersiveCamera position={[0, 1.5, 0.4]} />
      <ImmersiveSessionOrigin position={[0, 0, 0]} />
    </XRCanvas>
  );
}
```

## Adding a draggable glass panel

After adding some basic 3D elements we will continue building the user interface for the todo list. For building the user interface, we will use the `@coconut-xr/koestlich` library. Building a user interface with `koestlich` always starts with a root element. In this case, we add a `RootContainer` and put a pre-designed glass panel from `@coconut-xr/apfel-kruemel` inside of it. The root container is placed inside a group, which we will later use to transform the position of user interface. By setting the `minWidth` of the glass panel to `420` and assigning the `pixelSize` of `0.001` to the root element, the todo list will have a minimal width of `420 px * 0.001 m/px = 0.42m` in a AR / VR session.

```tsx
import { RootContainer } from "@coconut-xr/koestlich";
import { Glass } from "@coconut-xr/apfel-kruemel";
...

export default function Index() {
  return (
    <XRCanvas
      ...
    >
      ...


      <group>
        <RootContainer
          dragThreshold={32}
          position={[0, 1.5, -0.5]}
          pixelSize={0.001}
        >
          <Glass minWidth={420} padding={10} borderRadius={20}>
          </Glass>
        </RootContainer>
      </group>

    </XRCanvas>
  );
}
```

Next, we will allow the user to position the panel via grabbing (dragging) a white bar placed at the bottom of the user interface. We can achieve this using basic `pointer` listeners from R3F.

The `onPointerDown` listener is called whenever a pointer is pressed while entering the object. Similarly, the `onPointerUp` listener is called as the pointer is released. The `onPointerMove` event is called when the pointer has entered the object and is moved.

We will achieve the dragging interaction by capturing the pointer using `setPointerCapture`. For more information on pointer captures (event captures) and interactions in general, visit the [natuerlich documentation](https://coconut-xr.github.io/natuerlich/#/./object-interaction).

The drag interaction is created by captuing the pointer `onPointerDown` and storing the offset between the object and the pointer into the `downState`. When the `onPointerMove` listener is executed and the `downState` is available, the new position is calculated by adding the current pointer position to the initially captured offset. The `downState` is cleared once the `onPointerUp` is called.

The following code shows the changes necassary to achieve this interaction. The screenshot illustrates the final interaction. The interaction can now be used using a mouse, as well as touch controls.

![Screenshot]()

```tsx
import { RootContainer } from "@coconut-xr/koestlich";
import { Glass } from "@coconut-xr/apfel-kruemel";
...


export default function Index() {
  const ref = useRef<Group>(null);
  const downState = useRef<{
    pointerId: number;
    pointToObjectOffset: Vector3;
  }>();

  return (
    <XRCanvas
      ...
    >
      ...

      <group ref={ref}>
        <RootContainer
          ...
        >
          ...

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
  );
}
```

## Adding a AR button, hands and controllers

In addition to mouse and touch controls, a immersive todo list should also be usable using hands and controllers when using a VR / AR device.


# TODO: transition

After adding 3D content to the scene, we can add AR support to the scene using `useEnterXR` hook. The hook takes the `sessionOptions` and the session mode and returns a function to enter the specified session. In this case, we are creating a `immersive-ar` session and requesting the `local-floor` and `hand-tracking` features.

With the `enterAR` function, we can add a simple button to the center of the end of the page, allowing users to enter the Canvas in Augmented Reality.

_For a enterVR button just change the mode to "immersive-vr". You can use as many useEnterXR hooks as you want._

```tsx
import {
  ...,
  SessionModeGuard,
  SessionSupportedGuard,
  useEnterXR,
} from "@coconut-xr/natuerlich/react";
...

+const sessionOptions: XRSessionInit = {
+  requiredFeatures: ["local-floor", "hand-tracking"],
+};

export default function Index() {
+  const enterAR = useEnterXR("immersive-ar", sessionOptions);

  return (
    <>
      <XRCanvas
        ...
      >
        ...
      </XRCanvas>

+     <SessionSupportedGuard mode="immersive-ar">
+       <div
+         style={{
+           position: "absolute",
+           bottom: "1rem",
+           left: "50%",
+           transform: "translate(-50%, 0)",
+           fontFamily: "Arial",
+           padding: "0.5rem 1rem",
+           borderRadius: "0.3rem",
+           background: "#333",
+           color: "#ddd",
+         }}
+         onClick={enterAR}
+       >
+         Enter AR
+       </div>
+     </SessionSupportedGuard>
    </>
  );
}
```

For a `immersive-ar` session the black background is problematic since we want to see the real world in the background. In addition the grid on the floor might be distracting. Therefore, we can sorround the grid and the background color with a `SessionModeGuard`, which only display its content when the session mode is not `immersive-ar`.

We are also adding `Hands` and `Controllers` to the scene. It is important that both components are inside the `ImmersiveSessionOrigin`, in case you want to move the `ImmersiveSessionOrigin` to a different position. Using the `type` we can specify the interaction the hands and controllers have. In this case, the hand and the controllers should use pointing interactions. Alternatively, the types `grab` and `teleport` are available for the hands and controllers, while the `touch` type is only available for the hands. For more customization and information on interactions visit the [natuerlich documentation](https://coconut-xr.github.io/natuerlich/).

```tsx
import {
  ...,
  SessionModeGuard,
  SessionSupportedGuard,
  useEnterXR,
} from "@coconut-xr/natuerlich/react";
...

export default function Index() {
  ...
  return (
    <>
      <XRCanvas
        ...
      >
       <SessionModeGuard deny="immersive-ar">
          <color args={[0]} attach="background" />
          <gridHelper args={[100, 100]}>
            <meshBasicMaterial color="#333" />
          </gridHelper>
       </SessionModeGuard>

        ...

        <ImmersiveSessionOrigin position={[0,0,0]}>
         <Hands type="pointer" />
         <Controllers type="pointer" />
        </ImmersiveSessionOrigin>
      </XRCanvas>
      ...
    </>
  );
}
```

## Filling the glass panel with content

First, we define the type of our data, which is a list of todo list items, where each item contains a `id`, `value`, and a flag for whether the item is `completed`.

Using the state type, we define a initial state that can be used to display some initial static data. We use `uuid` to generate a universal unique identifier for the todo list item.

```ts
import { v4 as uuid } from "uuid";

type ListItemProps = {
  id: string;
  value: string;
  completed: boolean;
};

type State = {
  list: Array<ListItemProps>;
};

const initialState: State = {
  list: [
    {
      id: uuid(),
      value: "Buy Apples",
      completed: false,
    },
  ],
};
```

The next step is to render a user interface that display the `initialState`.

We will build our user interface using `koestlich`. First, we add a `RootContainer` and position it in front of the camera at a height of `1.5m`. The `pixelSize` on the `RootContainer` specifies how large one pixel inside the user interface is in meters. In this case, we set one pixel to be `1mm`. Additionally, we specifiy the `dragThreshold` declaring that a `click` event can only occur on the user interface if the user has moved less then `32px` (or `32mm`) between the `pointerdown` and `pointerup` events.

Inside the `RootContainer` we add a `Glass` container with a minal width of `420px`, a padding of `10px`, and a borderRadius of `20px`. The `Glass` container comes from `@coconut-xr/apfel-kruemel` and is pre-designed to look like a rounded glass element.

```tsx
import { RootContainer } from "@coconut-xr/koestlich";
import { Glass } from "@coconut-xr/apfel-kruemel";

export default function Index() {
  return (
    <>
      <XRCanvas
        ...
      >
        ...
        <RootContainer dragThreshold={32} position={[0, 1.5, -0.5]} pixelSize={0.001}>
          <Glass minWidth={420} padding={10} borderRadius={20}>
          </Glass>
        </RootContainer>
      </XRCanvas>
      ...
    </>
  );
}
```

```tsx
import {
  List,
  ListItem,
  Checkbox,
  IconButton,
} from "@coconut-xr/apfel-kruemel";
import { Text } from "@coconut-xr/koestlich";
import { Trash } from "@coconut-xr/lucide-koestlich";

export default function Index() {
  return (
    <>
      ...
      <Glass minWidth={420} padding={10} borderRadius={20}>
        {initialState.list.map((listItem, index) => (
          <ListEntry key={listItem.id} index={index} {...listItem} />
        ))}
      </Glass>
      ...
    </>
  );
}

function ListEntry({
  completed,
  id,
  index,
  value,
}: ListItemProps & { index: number }) {
  return (
    <List id={id} index={index} type="plain" width={400}>
      <ListItem
        flexBasis={0}
        minWidth={0}
        leadingAccessory={<Checkbox selected={completed} />}
        trailingAccessory={
          <IconButton size="md" platter>
            <Trash height={18} width={18} />
          </IconButton>
        }
      >
        <Text>{value}</Text>
      </ListItem>
    </List>
  );
}
```

## Adding the input form

```tsx
import { Container, TextInput } from "";
import { Plus } from "";

export default function Index() {
  return (
    <>
      ...
      <Glass minWidth={420} padding={10} borderRadius={20}>
        ...
        <Input />
      </Glass>
      ...
    </>
  );
}

function Input() {
  const [value, setValue] = useState("");
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

      <IconButton disabled={value.length === 0} size="md" platter>
        <Plus height={18} width={18} />
      </IconButton>
    </Container>
  );
}
```

## Adding dynamic state

Our app seems really simple but it has no dynamic data yet. The hard part comes, when we need a state management library. In this case we take `zustand` but everything else also works fine with the Ecosystem.

We will re-use the `initialState` previously defined and combine it with actions for adding(`addItem`), deleting (`deleteItem`), and toggling (`toggleCompleted`) a todo list item. As a result, we get a `useStore` hook that can get used to invoke the actions and listen to state changes.

```ts
import { create } from "zustand";
import { combine } from "zustand/middleware";

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
            completed: false,
            value,
          },
        ],
      });
    },
    deleteItem(id: string) {
      const { list } = get();
      const index = list.findIndex((item) => item.id === id);
      if (index === -1) {
        return;
      }
      set({ list: [...list.slice(0, index), ...list.slice(index + 1)] });
    },
    toggleCompleted(id: string) {
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
            completed: !entry.completed,
          },
          ...list.slice(index + 1),
        ],
      });
    },
  }))
);
```

Using the `useStore` hook we can exchange the static data displayed inside the `RootContainer` with the dynamic `list`.

```tsx
export default function Index() {
  const list = useStore((state) => state.list);
  ...
  return (
    <>
      ...
      <Glass minWidth={420} padding={10} borderRadius={20}>
        {list.map((listItem, index) => (
          ...
        ))}
      </Glass>
    </>
  )
}
```

Interactions with the todo items.

```tsx
const { toggleCompleted, deleteItem } = useStore.getState();

function ListEntry(...) {
  return (
    <List>
      <ListItem
        ...
        onClick={() => toggleCompleted(id)}
        trailingAccessory={
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              deleteItem(id);
            }}
            ...
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
```

```tsx
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
```
