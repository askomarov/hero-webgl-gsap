import * as THREE from "three";
import vertexShader from "./shaders/vertexShader.glsl?raw";
import fragmentShader from "./shaders/fragmentShader.glsl?raw";
import GUI from "lil-gui";

const COLOR_VARS = ["--color-glow-0", "--color-glow-1", "--color-glow-2"];

function cssColor(name, fallback) {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

function setCssColor(name, hex) {
  document.documentElement.style.setProperty(name, hex);
}

class Sketch {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.renderer = this.createRenderer();
    this.clock = new THREE.Clock();
    this.mousePos = new THREE.Vector2(0, 0);
    this.targetMouse = new THREE.Vector2(0, 0);

    this.material = this.createMaterial();
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.scene.add(this.mesh);
    this.gui = new GUI();
    this.addEventListeners();
    this.createGUI();
    this.gui.close();
    this.animate();
  }

  createGUI() {
    const u = this.material.uniforms;
    const stops = u.uColorStops.value;

    this.gui.add(u.uBlobScale, "value", 0, 1, 0.01).name("blob scale");
    this.gui.add(u.uSoftness, "value", 0, 1, 0.01).name("softness");
    this.gui.add(u.uNoiseAmp, "value", 0, 1, 0.01).name("noise amp");

    this.colorParams = {
      stop0: cssColor(COLOR_VARS[0], "#0a3d5c"),
      stop1: cssColor(COLOR_VARS[1], "#11a8db"),
      stop2: cssColor(COLOR_VARS[2], "#7cf0ff"),
      border: cssColor("--color-border", "#ffffff"),
    };

    const colors = this.gui.addFolder("colors");
    colors
      .addColor(this.colorParams, "stop0")
      .name("glow 0")
      .onChange((v) => this.setStop(0, v));
    colors
      .addColor(this.colorParams, "stop1")
      .name("glow 1 (text)")
      .onChange((v) => this.setStop(1, v));
    colors
      .addColor(this.colorParams, "stop2")
      .name("glow 2 (shadow)")
      .onChange((v) => this.setStop(2, v));
    colors
      .addColor(this.colorParams, "border")
      .name("border")
      .onChange((v) => setCssColor("--color-border", v));
  }

  setStop(i, hex) {
    this.material.uniforms.uColorStops.value[i].set(hex);
    setCssColor(COLOR_VARS[i], hex);
  }

  createRenderer() {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      premultipliedAlpha: true,
    });
    renderer.setSize(this.width, this.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(renderer.domElement);
    return renderer;
  }

  createMaterial() {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(this.width, this.height) },
        uColorStops: {
          value: COLOR_VARS.map(
            (name, i) =>
              new THREE.Color(
                cssColor(name, ["#0a3d5c", "#11a8db", "#7cf0ff"][i]),
              ),
          ),
        },
        uBlobScale: { value: 0.6 },
        uSoftness: { value: 0.6 },
        uNoiseAmp: { value: 0.1 },
        uMouse: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader,
      fragmentShader,
    });
  }

  onWindowResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    this.renderer.setSize(this.width, this.height);
    this.material.uniforms.uResolution.value.set(this.width, this.height);
  }

  onMouseMove(evt) {
    this.targetMouse.x = (evt.clientX / this.width) * 2 - 1;
    this.targetMouse.y = -((evt.clientY / this.height) * 2 - 1);
  }

  addEventListeners() {
    window.addEventListener("resize", this.onWindowResize.bind(this));
    // window.addEventListener("mousemove", this.onMouseMove.bind(this), false);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const t = this.clock.getElapsedTime();
    this.material.uniforms.uTime.value = t;

    this.mousePos.lerp(this.targetMouse, 0.05);
    this.material.uniforms.uMouse.value.copy(this.mousePos);

    this.renderer.render(this.scene, this.camera);
  }
}

export default Sketch;
