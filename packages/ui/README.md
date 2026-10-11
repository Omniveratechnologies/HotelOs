# @hotelos/ui

Shared UI component library, layouts, feedback screens, and brand icons for HotelOS.

- Package name: `@hotelos/ui`
- Peer dependencies: `react`, `react-router`, `@hotelos/styles`, `@hotelos/utils`, `@hotelos/stores`, `@hotelos/api`, `@hotelos/query`

---

## Exports

Consumed via subpath imports:

| Import Path                                  | Components / Exports                                                                    | Description                                                            |
| -------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `@hotelos/ui/components`                     | `Header`, `Sidebar`, `LoadingScreen`, `Modal`, `Button`, `Input`, `NewReservationModal` | Shared UI components index                                             |
| `@hotelos/ui/components/Modal`               | `<Modal />`                                                                             | Accessible modal popup with backdrop, Esc key, and scroll locking      |
| `@hotelos/ui/components/Button`              | `<Button />`                                                                            | Branded button with loading state, size variants, and icon support     |
| `@hotelos/ui/components/Input`               | `<Input />`                                                                             | Self-closing form field input with label, error, and hint support      |
| `@hotelos/ui/components/NewReservationModal` | `<NewReservationModal />`                                                               | Shared guest booking & walk-in check-in modal with credentials output  |
| `@hotelos/ui/components/Header`              | `<Header />`                                                                            | Standard page header with title, subtitle, actions, and sidebar toggle |
| `@hotelos/ui/components/Sidebar`             | `<Sidebar />`                                                                           | Responsive dashboard navigation sidebar with mobile drawer support     |
| `@hotelos/ui/components/LoadingScreen`       | `<LoadingScreen />`                                                                     | Centered loading spinner screen with branded styling                   |
| `@hotelos/ui/ErrorScreen`                    | `<ErrorScreen />`                                                                       | Fallback error boundary screen displaying error context                |
| `@hotelos/ui/pages/NotFound`                 | `<NotFound />`                                                                          | Standard 404 screen                                                    |
| `@hotelos/ui/icons`                          | Icons                                                                                   | Curated SVG icon set                                                   |

---

## Example Usage

```jsx
import {
  Header,
  Button,
  Modal,
  Input,
  NewReservationModal,
} from "@hotelos/ui/components";

export function RoomsPage() {
  return (
    <div className="p-6">
      <Header
        pageTitle="Rooms & Suites"
        pageDescription="Manage inventory, room types, and live cleaning status"
      >
        <Button variant="primary">Add Room</Button>
      </Header>
    </div>
  );
}
```
