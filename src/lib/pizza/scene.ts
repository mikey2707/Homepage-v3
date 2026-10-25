import * as THREE from 'three';
import { PizzaWorld } from './world';
import { PizzaCamera, type StationName } from './camera';
import { PizzaRaycaster } from './raycaster';

export class PizzaExperience {
  public canvas: HTMLCanvasElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public cameraManager: PizzaCamera;
  public world: PizzaWorld;
  public raycaster: PizzaRaycaster;
  public clock = new THREE.Clock();
  public isRunning = false;
  private animationFrameId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x120c0a); // Warm dark ambient

    // 2. Renderer
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height, true);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 3. Camera Manager
    this.cameraManager = new PizzaCamera(this.canvas, width, height);

    // 4. World
    this.world = new PizzaWorld(this.scene);

    // 5. Raycaster
    this.raycaster = new PizzaRaycaster(this.canvas, this.cameraManager, this.world);

    // 6. Window Resize & Multi-Monitor Display Resolution Changes
    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('orientationchange', this.onResize);

    // 7. Start render loop
    this.isRunning = true;
    this.tick = this.tick.bind(this);
    this.tick();
  }

  private onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.cameraManager.resize(width, height);
    this.renderer.setSize(width, height, true);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }

  private tick() {
    if (!this.isRunning) return;

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    this.world.update(elapsedTime, delta);
    this.cameraManager.update(delta);
    this.renderer.render(this.scene, this.cameraManager.camera);

    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  public async startIntro(): Promise<void> {
    await this.cameraManager.introFlyIn();
  }

  public goToStation(station: StationName): Promise<void> {
    return this.cameraManager.transitionTo(station);
  }

  public setDarkMode(isDark: boolean) {
    this.renderer.toneMappingExposure = isDark ? 0.76 : 0.92;
    this.scene.background = new THREE.Color(isDark ? 0x080609 : 0x120c0a);
    this.world.setDarkMode(isDark);
  }

  public destroy() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('orientationchange', this.onResize);
    this.cameraManager.destroy();
    this.renderer.dispose();
  }
}
