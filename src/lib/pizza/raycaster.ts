import * as THREE from 'three';
import type { PizzaWorld, InteractiveHitbox } from './world';
import type { PizzaCamera } from './camera';

export class PizzaRaycaster {
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private canvas: HTMLCanvasElement;
  private camera: PizzaCamera;
  private world: PizzaWorld;
  private hoveredHitbox: InteractiveHitbox | null = null;
  private isPointerDown = false;
  private downCoords = { x: 0, y: 0 };
  private hitboxMeshes: THREE.Mesh[] = [];
  private meshToHitbox = new Map<THREE.Object3D, InteractiveHitbox>();
  private canvasRect: DOMRect | null = null;
  private rafPending = false;
  private latestMouse = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement, camera: PizzaCamera, world: PizzaWorld) {
    this.canvas = canvas;
    this.camera = camera;
    this.world = world;

    for (const h of this.world.hitboxes) {
      this.hitboxMeshes.push(h.mesh);
      this.meshToHitbox.set(h.mesh, h);
    }

    this.bindEvents();
  }

  private bindEvents() {
    window.addEventListener('mousemove', (e) => this.onMouseMove(e), { passive: true });
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('click', (e) => this.onClick(e));
    this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: true });
    this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
    this.canvas.addEventListener('mouseleave', () => this.clearHover());
    document.addEventListener('mouseleave', () => this.clearHover());

    window.addEventListener('resize', () => {
      this.canvasRect = null;
    }, { passive: true });
    window.addEventListener('blur', () => this.clearHover());
    window.addEventListener('station-transition-start', () => this.clearHover());
    window.addEventListener('pizza-station-select', () => this.clearHover());
    window.addEventListener('pizza-open-modal', () => this.clearHover());
    window.addEventListener('pizza-go-station', () => this.clearHover());
    window.addEventListener('pizza-go-overview', () => this.clearHover());
  }

  private updatePointerCoords(clientX: number, clientY: number) {
    if (!this.canvasRect || this.canvasRect.width === 0) {
      this.canvasRect = this.canvas.getBoundingClientRect();
    }
    const rect = this.canvasRect;
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onMouseMove(e: MouseEvent) {
    // Skip hover raycasting while orbiting or when locked inside a station view
    if (this.isPointerDown || this.camera.isTransitioning || this.camera.currentStation !== 'default') {
      if (this.hoveredHitbox) {
        this.clearHover();
      }
      return;
    }

    const target = e.target as HTMLElement | null;
    if (target && target.closest('button, a, input, textarea, select, [role="button"], .station-modal, #pizza-preloader')) {
      if (this.hoveredHitbox) {
        this.clearHover();
      }
      return;
    }

    this.latestMouse.x = e.clientX;
    this.latestMouse.y = e.clientY;

    if (!this.rafPending) {
      this.rafPending = true;
      requestAnimationFrame(() => {
        this.rafPending = false;
        if (this.isPointerDown || this.camera.isTransitioning || this.camera.currentStation !== 'default') {
          return;
        }
        this.updatePointerCoords(this.latestMouse.x, this.latestMouse.y);
        this.checkIntersections(this.latestMouse.x, this.latestMouse.y);
      });
    }
  }

  private onMouseDown(e: MouseEvent) {
    this.isPointerDown = true;
    this.downCoords = { x: e.clientX, y: e.clientY };
    this.clearHover();
  }

  private onClick(e: MouseEvent) {
    this.updatePointerCoords(e.clientX, e.clientY);
    this.checkIntersections(e.clientX, e.clientY);
    if (this.hoveredHitbox && !this.camera.isTransitioning) {
      const targetHitbox = this.hoveredHitbox;
      this.clearHover();
      if (targetHitbox.url) {
        window.location.href = targetHitbox.url;
        return;
      }
      if (targetHitbox.station && targetHitbox.station !== 'secret') {
        this.selectStation(targetHitbox.station);
      }
    }
  }

  private onMouseUp(e: MouseEvent) {
    this.isPointerDown = false;
    // Check if it was a quick click vs a drag orbit
    const dist = Math.hypot(e.clientX - this.downCoords.x, e.clientY - this.downCoords.y);
    if (dist < 15 && this.hoveredHitbox && !this.camera.isTransitioning) {
      const targetHitbox = this.hoveredHitbox;
      this.clearHover();
      if (targetHitbox.url) {
        window.location.href = targetHitbox.url;
        return;
      }
      if (targetHitbox.station && targetHitbox.station !== 'secret') {
        this.selectStation(targetHitbox.station);
      }
    }
  }

  private onTouchStart(e: TouchEvent) {
    if (e.touches.length > 0) {
      this.clearHover();
      this.downCoords = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      this.updatePointerCoords(e.touches[0].clientX, e.touches[0].clientY);
      this.checkIntersections(e.touches[0].clientX, e.touches[0].clientY);
    }
  }

  private onTouchEnd(e: TouchEvent) {
    if (e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const dist = Math.hypot(touch.clientX - this.downCoords.x, touch.clientY - this.downCoords.y);
      if (dist < 10 && this.hoveredHitbox && !this.camera.isTransitioning) {
        const targetHitbox = this.hoveredHitbox;
        this.clearHover();
        if (targetHitbox.url) {
          window.location.href = targetHitbox.url;
          return;
        }
        if (targetHitbox.station && targetHitbox.station !== 'secret') {
          this.selectStation(targetHitbox.station);
        }
      }
    }
  }

  private checkIntersections(screenX: number, screenY: number) {
    if (this.camera.isTransitioning) {
      if (this.hoveredHitbox) {
        this.clearHover();
      }
      return;
    }

    this.raycaster.setFromCamera(this.pointer, this.camera.camera);
    const intersects = this.raycaster.intersectObjects(this.hitboxMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const hitbox = this.meshToHitbox.get(hit.object);

      if (hitbox && hitbox !== this.hoveredHitbox) {
        this.setHoveredHitbox(hitbox, screenX, screenY);
      } else if (hitbox && hitbox === this.hoveredHitbox) {
        window.dispatchEvent(
          new CustomEvent('pizza-station-hover-move', {
            detail: { x: screenX, y: screenY }
          })
        );
      }
    } else {
      if (this.hoveredHitbox) {
        this.clearHover();
      }
    }
  }

  private setHoveredHitbox(hitbox: InteractiveHitbox, screenX: number, screenY: number) {
    this.hoveredHitbox = hitbox;
    this.canvas.style.cursor = 'pointer';

    // Highlight the station indicator if it has one
    if (hitbox.station && hitbox.station !== 'secret') {
      this.updateHighlightMesh(hitbox.station, true);
    }

    window.dispatchEvent(
      new CustomEvent('pizza-station-hover', {
        detail: {
          station: hitbox.station,
          title: hitbox.title,
          subtitle: hitbox.subtitle,
          color: hitbox.color,
          x: screenX,
          y: screenY
        }
      })
    );
  }

  private clearHover() {
    if (this.hoveredHitbox) {
      if (this.hoveredHitbox.station && this.hoveredHitbox.station !== 'secret') {
        this.updateHighlightMesh(this.hoveredHitbox.station, false);
      }
      this.hoveredHitbox = null;
    }
    this.canvas.style.cursor = 'default';

    window.dispatchEvent(new CustomEvent('pizza-station-unhover'));
  }

  private updateHighlightMesh(station?: string, active?: boolean) {
    // Station outlines and floor rings are permanently hidden per design
    return;
  }

  public selectStation(station: any) {
    this.clearHover();
    if (this.camera.currentStation === station) {
      window.dispatchEvent(
        new CustomEvent('pizza-open-modal', {
          detail: { station }
        })
      );
      return;
    }
    this.camera.transitionTo(station);
    window.dispatchEvent(
      new CustomEvent('pizza-station-select', {
        detail: { station }
      })
    );
  }
}
