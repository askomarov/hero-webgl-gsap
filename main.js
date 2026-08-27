import "./style.css";
import Sketch from "./three";
import { initDescriptionPop } from "./gsap.js";

document.addEventListener(
  "DOMContentLoaded",
  () => {
    const sketch = new Sketch("canvas");
    window.addEventListener("load", () => {
      initDescriptionPop();
    });
  },
  true,
);
