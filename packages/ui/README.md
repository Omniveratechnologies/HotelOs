# @hotelos/ui

Shared UI component library, layouts, feedback screens, and brand icons for HotelOS.

- Package name: `@hotelos/ui`
- Peer dependencies: `react`, `react-router`, `@hotelos/styles`, `@hotelos/utils`

---

## Exports

Consumed via subpath imports defined in `package.json`:

| Import Path                 | Component           | Description                                                            |
| --------------------------- | ------------------- | ---------------------------------------------------------------------- |
| `@hotelos/ui/Header`        | `<Header />`        | Standard page header with title, subtitle, actions, and sidebar toggle |
| `@hotelos/ui/Sidebar`       | `<Sidebar />`       | Responsive dashboard navigation sidebar with mobile drawer support     |
| `@hotelos/ui/LoadingScreen` | `<LoadingScreen />` | Centered loading spinner screen with branded styling                   |
| `@hotelos/ui/ErrorScreen`   | `<ErrorScreen />`   | Fallback error boundary screen displaying error context                |
| `@hotelos/ui/NotFound`      | `<NotFound />`      | Standard 404 screen                                                    |
| `@hotelos/ui/icons`         | Icons               | Curated SVG icon set                                                   |

---

## Example Usage

```jsx
import { Header } from "@hotelos/ui/Header";

export function RoomsPage() {
  return (
    <div className="p-6">
      <Header
        title="Rooms & Suites"
        subtitle="Manage inventory, room types, and live cleaning status"
        actions={<button className="btn-primary">Add Room</button>}
      />
      {/* Content */}
    </div>
  );
}
```
