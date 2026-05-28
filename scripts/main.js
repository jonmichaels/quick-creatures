import { initQuickCreatures } from "./app/quick-creatures-app.js";
import "../scss/module.scss";

Hooks.once("init", () => {
    initQuickCreatures();
});
