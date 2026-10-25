import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';

export type StationName = 'default' | 'oven' | 'menu' | 'arcade' | 'register';

export interface CameraCoords {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

export class PizzaCamera {
  public camera: THREE.PerspectiveCamera;
  public controls: OrbitControls;
  public canvas: HTMLCanvasElement;
  public currentStation: StationName = 'default';
  public isTransitioning = false;

  private presets: Record<StationName, CameraCoords> = {
    // 1. Cozy Interior Dining Room Standing View
    default: {
      position: new THREE.Vector3(0.0, 3.6, 6.7),
      target: new THREE.Vector3(0.0, 2.9, -0.4)
    },
    // 2. Wood-Fired Brick Pizza Oven (Projects) - Full view of firewood arch, mouth, fire, peel & chimney
    oven: {
      position: new THREE.Vector3(-1.8, 2.7, -1.8),
      target: new THREE.Vector3(-5.5, 2.3, -5.5)
    },
    // 3. Chalkboard Specials Menu (Resume)
    menu: {
      position: new THREE.Vector3(1.5, 5.2, -3.2),
      target: new THREE.Vector3(1.5, 5.2, -7.76)
    },
    // 4. Walk-In Fridge & Homelab Ops Checklist
    arcade: {
      position: new THREE.Vector3(3.5, 2.75, -2.8),
      target: new THREE.Vector3(5.1, 2.65, -4.3)
    },
    // 5. Cash Register & Takeout Desk (Contact)
    register: {
      position: new THREE.Vector3(-1.8, 3.2, 4.0),
      target: new THREE.Vector3(-3.65, 2.7, 2.15)
    }
  };

  private keys: Record<string, boolean> = {};
  public moveSpeed = 4.2; // walking speed in m/s
  private _forward = new THREE.Vector3();
  private _right = new THREE.Vector3();
  private _move = new THREE.Vector3();
  private onKeyDown: (e: KeyboardEvent) => void;
  private onKeyUp: (e: KeyboardEvent) => void;
  private onBlur: () => void;

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.canvas = canvas;

    // Perspective Camera with responsive aspect-ratio adaptive FOV
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 80);
    this.adjustFov(width, height);
    // Initial starting point (entering through storefront door)
    this.camera.position.set(0.0, 3.6, 7.2);

    // Orbit Controls configured strictly for interior room exploration
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enablePan = true;
    this.controls.panSpeed = 0.55;
    this.controls.rotateSpeed = 0.65;
    this.controls.zoomSpeed = 0.65;
    this.controls.minDistance = 0.6;
    this.controls.maxDistance = 14.0;
    this.controls.minPolarAngle = Math.PI * 0.15; // Allow looking up at rafters/ceiling
    this.controls.maxPolarAngle = Math.PI * 0.52; // Allow looking horizontal and slightly down, prevent flipping below floor

    this.controls.target.copy(this.presets.default.target);
    this.controls.update();

    // WASD and Arrow key navigation (active strictly in default free walking mode)
    this.onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      // When focused on a station (like Menu chalkboard), walking is disabled and keys navigate content
      if (this.currentStation !== 'default') {
        return;
      }
      if (e.code) this.keys[e.code] = true;
      if (e.key) this.keys[e.key] = true;
    };

    this.onKeyUp = (e: KeyboardEvent) => {
      if (e.code) this.keys[e.code] = false;
      if (e.key) this.keys[e.key] = false;
    };

    this.onBlur = () => {
      this.keys = {};
    };

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  // Smooth cinematic GSAP transition
  public async transitionTo(station: StationName, duration = 1.3): Promise<void> {
    const coords = this.presets[station];
    if (!coords) return;

    this.isTransitioning = true;
    this.currentStation = station;
    this.keys = {}; // Clear any active walking momentum

    // Disable user orbit dragging during flight
    this.controls.enableRotate = false;
    this.controls.enablePan = false;
    this.controls.enableZoom = false;

    // Dispatch event so UI knows which station is focused
    window.dispatchEvent(new CustomEvent('station-transition-start', { detail: { station } }));

    return new Promise((resolve) => {
      const tl = gsap.timeline({
        onUpdate: () => {
          // Continuously orient camera towards the animated target throughout flight
          this.camera.lookAt(this.controls.target);
        },
        onComplete: () => {
          this.camera.position.copy(coords.position);
          this.controls.target.copy(coords.target);
          this.camera.lookAt(coords.target);
          this.isTransitioning = false;

          if (station === 'default') {
            // Free mode: restore full user orbit, pan, and zoom
            this.controls.enabled = true;
            this.controls.enableRotate = true;
            this.controls.enablePan = true;
            this.controls.enableZoom = true;
            this.controls.update();
          } else {
            // Station mode: completely lock camera in place facing station, disable orbit controls
            this.controls.enabled = false;
          }

          window.dispatchEvent(new CustomEvent('station-transition-end', { detail: { station } }));
          resolve();
        }
      });

      tl.to(this.camera.position, {
        duration,
        ease: 'power2.inOut',
        x: coords.position.x,
        y: coords.position.y,
        z: coords.position.z
      }, 0);

      tl.to(this.controls.target, {
        duration,
        ease: 'power2.inOut',
        x: coords.target.x,
        y: coords.target.y,
        z: coords.target.z
      }, 0);
    });
  }

  // Initial cinematic fly-in when pressing START/ENTER
  public async introFlyIn(): Promise<void> {
    await this.transitionTo('default', 1.8);
  }

  public adjustFov(width: number, height: number) {
    const aspect = width / height;
    this.camera.aspect = aspect;

    // Responsive FOV: ensure the room's interior width remains visible on narrow/portrait monitors
    const baseFov = 65; // degrees for 16:9 widescreen
    const baseAspect = 16 / 9;

    if (aspect < baseAspect) {
      // Calculate needed vertical FOV to maintain horizontal room framing
      const hFovHalf = Math.atan(Math.tan((baseFov * Math.PI) / 360) * baseAspect);
      const vFovRad = 2 * Math.atan(Math.tan(hFovHalf) / aspect);
      this.camera.fov = Math.min(105, Math.max(55, (vFovRad * 180) / Math.PI));
    } else {
      this.camera.fov = baseFov;
    }

    this.camera.updateProjectionMatrix();
  }

  public resize(width: number, height: number) {
    this.adjustFov(width, height);
  }

  private isForward(): boolean {
    return !!(this.keys['KeyW'] || this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']);
  }
  private isBackward(): boolean {
    return !!(this.keys['KeyS'] || this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']);
  }
  private isLeft(): boolean {
    return !!(this.keys['KeyA'] || this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']);
  }
  private isRight(): boolean {
    return !!(this.keys['KeyD'] || this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']);
  }

  public update(delta: number = 0.016) {
    if (!this.isTransitioning) {
      if (this.currentStation === 'default') {
        // WASD / Arrow Key Walking Vector (confined to horizontal plane strictly in default overview)
        this._move.set(0, 0, 0);
        const fwd = this.isForward();
        const bwd = this.isBackward();
        const rgt = this.isRight();
        const lft = this.isLeft();

        if (fwd || bwd || rgt || lft) {
          this.camera.getWorldDirection(this._forward);
          this._forward.y = 0;
          this._forward.normalize();

          this._right.crossVectors(this._forward, this.camera.up).normalize();

          if (fwd) this._move.add(this._forward);
          if (bwd) this._move.sub(this._forward);
          if (rgt) this._move.add(this._right);
          if (lft) this._move.sub(this._right);

          if (this._move.lengthSq() > 0) {
            const safeDelta = Math.min(delta, 0.1);
            this._move.normalize().multiplyScalar(this.moveSpeed * safeDelta);
            this.camera.position.add(this._move);
            this.controls.target.add(this._move);
          }
        }

        // Safety clamp: keep camera comfortably inside interior walls and above floor
        this.camera.position.x = Math.max(-6.8, Math.min(6.8, this.camera.position.x));
        this.camera.position.y = Math.max(1.2, Math.min(8.0, this.camera.position.y));
        this.camera.position.z = Math.max(-6.8, Math.min(6.8, this.camera.position.z));

        this.controls.target.x = Math.max(-7.2, Math.min(7.2, this.controls.target.x));
        this.controls.target.z = Math.max(-7.2, Math.min(7.2, this.controls.target.z));

        this.controls.update();
      }
    }
  }

  public destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.controls.dispose();
  }
}
