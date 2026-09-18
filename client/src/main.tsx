import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

function App() {
  return <main aria-label="小可个人 AI">小可正在准备中</main>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
