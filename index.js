import { registerRootComponent } from "expo";
import App from "./App";

if (typeof document !== "undefined") {
  document.documentElement.style.userSelect = "none";
  document.documentElement.style.webkitUserSelect = "none";
  document.body.style.userSelect = "none";
  document.body.style.webkitUserSelect = "none";
}

registerRootComponent(App);
