# @hotelos/stores

Lightweight client-side UI state stores for HotelOS, powered by **Zustand**.

This package manages transient UI state (such as navigation drawers, modal visibility, and sidebar collapse) without polluting server cache or triggering full component tree re-renders.

- Package name: `@hotelos/stores`
- Dependency: `zustand` `^5`

---

## Server State vs UI State

| State Type       | Handled By        | Examples                                                       |
| ---------------- | ----------------- | -------------------------------------------------------------- |
| **Server State** | `@hotelos/query`  | Rooms, guests, orders, rates, hotels, live inventory           |
| **UI State**     | `@hotelos/stores` | Sidebar collapsed/expanded, mobile drawer, active modal dialog |

---

## Exports

| Export            | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| `useSidebarStore` | Hook & store for desktop sidebar toggle and mobile drawer open/close |
| `useModalStore`   | Hook & store for managing active modal name and modal payload props  |
| `create`          | Re-exported from `zustand` to create app-specific UI stores          |

---

## Usage Examples

### Sidebar Control

```jsx
import { useSidebarStore } from "@hotelos/stores";

export function TopBar() {
  const toggleMobileOpen = useSidebarStore((s) => s.toggleMobileOpen);

  return <button onClick={toggleMobileOpen}>Menu</button>;
}
```

### Modal Control

```jsx
import { useModalStore } from "@hotelos/stores";

export function OpenGuestButton({ room }) {
  const openModal = useModalStore((s) => s.openModal);

  return (
    <button onClick={() => openModal("ADD_GUEST", { roomId: room.id })}>
      Assign Guest
    </button>
  );
}
```
