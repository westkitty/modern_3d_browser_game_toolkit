import { startLauncher } from "./launcher/app";

const root = document.getElementById("app");
if (!root) {
  throw new Error("Launcher root #app is missing.");
}
startLauncher(root);
