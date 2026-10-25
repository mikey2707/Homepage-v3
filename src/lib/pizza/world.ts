import * as THREE from 'three';
import {
  createCheckeredFloorTexture,
  createBrickWallTexture,
  createChalkboardManager,
  type ChalkboardManager,
  createOvenFireMaterial,
  createFridgeLedTexture,
  createFridgeTodoListTexture,
  createPizzaTexture,
  createPizzaBoxTexture,
  createOvenDomeMosaicTexture,
  createMarbleCounterTexture,
  createFirewoodLogTexture,
  createMargheritaPizzaTexture,
  createRegisterScreenTexture,
  createReceiptPaperTexture,
  createStorefrontWindowTexture,
  createCeilingWoodTexture,
  createWallArtBlueprintTexture,
  createWallArtCertificateTexture,
  createWallArtPopArtTexture,
  createBiscottoFloorTexture,
  createFirebrickArchTexture,
  createSecretCodexTexture
} from './materials';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface InteractiveHitbox {
  mesh: THREE.Mesh;
  station?: 'oven' | 'menu' | 'arcade' | 'register' | 'secret';
  title: string;
  subtitle: string;
  color: string;
  url?: string;
}

export class PizzaWorld {
  public scene: THREE.Scene;
  public hitboxes: InteractiveHitbox[] = [];
  public animatedUpdaters: ((time: number, delta: number) => void)[] = [];
  private gltfLoader = new GLTFLoader();
  private pizzaModelPromise: Promise<THREE.Group> | null = null;

  private loadPizzaModel(): Promise<THREE.Group> {
    if (!this.pizzaModelPromise) {
      this.pizzaModelPromise = new Promise((resolve, reject) => {
        this.gltfLoader.load(
          '/models/pizza.glb',
          (gltf) => {
            gltf.scene.traverse((c) => {
              if ((c as THREE.Mesh).isMesh) {
                c.castShadow = true;
                c.receiveShadow = true;
              }
            });
            resolve(gltf.scene);
          },
          undefined,
          (err) => reject(err)
        );
      });
    }
    return this.pizzaModelPromise.then((baseScene) => baseScene.clone(true));
  }

  // Meshes that can highlight on hover
  public ovenHighlightMesh!: THREE.Mesh;
  public menuHighlightMesh!: THREE.Mesh;
  public arcadeHighlightMesh!: THREE.Mesh;
  public registerHighlightMesh!: THREE.Mesh;
  public chalkboardManager!: ChalkboardManager;
  public fridgeLedMaterial!: THREE.MeshStandardMaterial;

  // Environment lighting references for Cozy / Dark Mode control
  public ambientLight!: THREE.AmbientLight;
  public dirLight!: THREE.DirectionalLight;
  public pendantLights: THREE.PointLight[] = [];
  public fridgeLight!: THREE.PointLight;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.buildRoom();
    this.buildOvenStation();
    this.buildChalkboardStation();
    this.buildArcadeStation();
    this.buildCounterAndRegisterStation();
    this.buildSecretCodexItem();
    this.buildAmbianceAndLights();
  }

  private buildRoom() {
    // 1. Floor (Checkered tiles with gloss)
    const floorGeo = new THREE.PlaneGeometry(16, 16);
    const floorTex = createCheckeredFloorTexture();
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.25,
      metalness: 0.08
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 2. Walls Material (Rustic Red Brick)
    const brickTex = createBrickWallTexture();
    const wallMat = new THREE.MeshStandardMaterial({
      map: brickTex,
      roughness: 0.85,
      metalness: 0.05
    });

    // 2a. Back Wall (z = -8)
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), wallMat);
    backWall.position.set(0, 5, -8);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    // 2b. Left Wall (x = -8)
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-8, 5, 0);
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);

    // 2c. Right Wall (x = 8) - Fully Enclosed
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(8, 5, 0);
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);

    // Right Wall Wainscot paneling
    const wainscotMat = new THREE.MeshStandardMaterial({ color: 0x2b1810, roughness: 0.6 });
    const rightWainscot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.2, 16), wainscotMat);
    rightWainscot.position.set(7.94, 1.6, 0);
    this.scene.add(rightWainscot);

    // Framed Artwork / Architecture Prints on Right Wall
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1a120b, roughness: 0.4 });
    const goldFilletMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.3 });
    const artPositions = [-3.8, -1.2, 1.4];
    const artTextures = [
      createWallArtBlueprintTexture(),
      createWallArtCertificateTexture(),
      createWallArtPopArtTexture()
    ];

    artPositions.forEach((az, idx) => {
      // Dark Walnut Outer Frame
      const artFrame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.3, 1.7), frameMat);
      artFrame.position.set(7.9, 5.6, az);
      this.scene.add(artFrame);

      // Gold Beveled Fillet Matting
      const goldFillet = new THREE.Mesh(new THREE.BoxGeometry(0.13, 2.14, 1.54), goldFilletMat);
      goldFillet.position.set(7.9, 5.6, az);
      this.scene.add(goldFillet);

      // Canvas with Custom Picture Texture
      const tex = artTextures[idx];
      const artCanvas = new THREE.Mesh(
        new THREE.PlaneGeometry(1.46, 2.06),
        new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 0.5,
          metalness: 0.05,
          emissive: new THREE.Color(0xffffff),
          emissiveMap: tex,
          emissiveIntensity: 0.28
        })
      );
      artCanvas.rotation.y = -Math.PI / 2;
      artCanvas.position.set(7.83, 5.6, az);
      this.scene.add(artCanvas);

      // Warm Brass Wall Sconce above artwork
      const sconceArm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3), new THREE.MeshStandardMaterial({ color: 0xc8a452, metalness: 0.8 }));
      sconceArm.rotation.z = Math.PI / 2;
      sconceArm.position.set(7.75, 7.0, az);
      this.scene.add(sconceArm);

      const sconceBulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), new THREE.MeshStandardMaterial({ color: 0xffe6b0, emissive: 0xffa500, emissiveIntensity: 1.2 }));
      sconceBulb.position.set(7.62, 7.0, az);
      this.scene.add(sconceBulb);

      const sconceLight = new THREE.PointLight(0xffb84d, 1.2, 4.5, 1.5);
      sconceLight.position.set(7.5, 6.9, az);
      this.scene.add(sconceLight);
    });

    // 2d. Front Wall (z = 8) - Storefront Windows & Entrance Doors
    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), wallMat);
    frontWall.rotation.y = Math.PI;
    frontWall.position.set(0, 5, 8);
    frontWall.receiveShadow = true;
    this.scene.add(frontWall);

    // Large Commercial Black Steel Storefront Window Frames
    const storefrontFrameMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.3 });
    const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(11.2, 6.2, 0.15), storefrontFrameMat);
    windowFrame.position.set(0, 4.6, 7.92);
    this.scene.add(windowFrame);

    // Storefront Window Glass with Gold Leaf Lettering
    const windowTex = createStorefrontWindowTexture();
    const windowMat = new THREE.MeshStandardMaterial({
      map: windowTex,
      transparent: true,
      roughness: 0.1,
      metalness: 0.1
    });
    const windowGlass = new THREE.Mesh(new THREE.PlaneGeometry(10.8, 5.8), windowMat);
    windowGlass.rotation.y = Math.PI;
    windowGlass.position.set(0, 4.6, 7.84);
    this.scene.add(windowGlass);

    // Outer City Night Ambience Backdrop behind glass
    const nightSkyMat = new THREE.MeshBasicMaterial({ color: 0x050811 });
    const nightBackdrop = new THREE.Mesh(new THREE.PlaneGeometry(24, 12), nightSkyMat);
    nightBackdrop.position.set(0, 6, 8.8);
    this.scene.add(nightBackdrop);

    // Baseboards along all 4 perimeter walls
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x2b1810, roughness: 0.6 });
    const baseboards = [
      { geo: new THREE.BoxGeometry(16, 0.4, 0.12), pos: [0, 0.2, -7.94] },
      { geo: new THREE.BoxGeometry(0.12, 0.4, 16), pos: [-7.94, 0.2, 0] },
      { geo: new THREE.BoxGeometry(0.12, 0.4, 16), pos: [7.94, 0.2, 0] },
      { geo: new THREE.BoxGeometry(16, 0.4, 0.12), pos: [0, 0.2, 7.94] }
    ];
    baseboards.forEach(({ geo, pos }) => {
      const b = new THREE.Mesh(geo, baseboardMat);
      b.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(b);
    });

    // 3. Solid Wood Coffered Ceiling (Complete Room Roof)
    const ceilingTex = createCeilingWoodTexture();
    const ceilingMat = new THREE.MeshStandardMaterial({
      map: ceilingTex,
      roughness: 0.8
    });
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 10, 0);
    this.scene.add(ceiling);

    // Dark Wood Ceiling Beams
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.7 });
    for (let z = -7; z <= 7; z += 3.5) {
      const rafter = new THREE.Mesh(new THREE.BoxGeometry(16, 0.35, 0.35), woodMat);
      rafter.position.set(0, 9.8, z);
      this.scene.add(rafter);
    }
    for (let x = -7; x <= 7; x += 3.5) {
      const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 16), woodMat);
      crossBeam.position.set(x, 9.8, 0);
      this.scene.add(crossBeam);
    }

    // Italian Flag Pennant Bunting Banner strung across ceiling rafters
    const buntingGroup = new THREE.Group();
    buntingGroup.position.set(0, 9.1, 0);
    const bannerColors = [0x009246, 0xffffff, 0xce2b37]; // Green, White, Red
    const pennantGeo = new THREE.ConeGeometry(0.20, 0.40, 3);
    for (let x = -6.5; x <= 6.5; x += 0.55) {
      const color = bannerColors[Math.abs(Math.round(x * 2)) % 3];
      const pennant = new THREE.Mesh(pennantGeo, new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
      pennant.position.set(x, Math.sin((x / 6.5) * Math.PI) * 0.25, -2.5);
      pennant.rotation.z = Math.PI;
      pennant.rotation.y = 0.15;
      buntingGroup.add(pennant);
    }
    this.scene.add(buntingGroup);

    // Hanging Garlic Braid and Red Chili String from rafters
    const garlicGroup = new THREE.Group();
    garlicGroup.position.set(-4.0, 8.8, -4.5);
    const garlicBulbGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const garlicMat = new THREE.MeshStandardMaterial({ color: 0xf5f3eb, roughness: 0.7 });
    for (let i = 0; i < 7; i++) {
      const bulb = new THREE.Mesh(garlicBulbGeo, garlicMat);
      bulb.position.set((Math.random() - 0.5) * 0.08, -i * 0.14, (Math.random() - 0.5) * 0.08);
      bulb.scale.set(1.1, 0.9, 1.1);
      garlicGroup.add(bulb);
    }
    this.scene.add(garlicGroup);

    const chiliGroup = new THREE.Group();
    chiliGroup.position.set(-3.7, 8.8, -4.5);
    const chiliGeo = new THREE.ConeGeometry(0.04, 0.22, 6);
    const chiliMat = new THREE.MeshStandardMaterial({ color: 0xcc1100, roughness: 0.3 });
    for (let i = 0; i < 8; i++) {
      const chili = new THREE.Mesh(chiliGeo, chiliMat);
      chili.position.set((Math.random() - 0.5) * 0.08, -i * 0.12, (Math.random() - 0.5) * 0.08);
      chili.rotation.z = (Math.random() - 0.5) * 0.5;
      chiliGroup.add(chili);
    }
    this.scene.add(chiliGroup);

    // 4. Ceiling Fan (High near ceiling, castShadow disabled to prevent rotating shadow blocks)
    const fanGroup = new THREE.Group();
    fanGroup.position.set(0, 9.4, 0);

    const fanRod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
    fanRod.position.y = 0.4;
    fanGroup.add(fanRod);

    const fanMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.2, 16), new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6, roughness: 0.4 }));
    fanGroup.add(fanMotor);

    const bladesGroup = new THREE.Group();
    const bladeGeo = new THREE.BoxGeometry(2.2, 0.03, 0.32);
    bladeGeo.translate(1.1, 0, 0); // Anchor blade origin at motor hub
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x4a2a18, roughness: 0.5 });
    for (let i = 0; i < 4; i++) {
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.rotation.y = (i * Math.PI) / 2;
      bladesGroup.add(blade);
    }
    fanGroup.add(bladesGroup);
    this.scene.add(fanGroup);

    this.animatedUpdaters.push((_time, delta) => {
      bladesGroup.rotation.y += delta * 2.0;
    });
  }

  private buildOvenStation() {
    const ovenGroup = new THREE.Group();
    ovenGroup.position.set(-5.5, 0, -5.5);
    // Align +Z local axis directly facing the center of the pizzeria dining room (45° angle)
    ovenGroup.rotation.y = Math.PI / 4;

    // 1. Authentic Rounded Cylindrical Masonry Pedestal Base
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x3d352e,
      roughness: 0.85
    });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.2, 2.2, 32), baseMat);
    base.position.y = 1.1;
    base.castShadow = true;
    base.receiveShadow = true;
    ovenGroup.add(base);

    // Architectural Arched Firewood Niche (Legnaia) cleanly recessed in the front of the base
    const nicheFrameMat = new THREE.MeshStandardMaterial({ color: 0x8a725f, roughness: 0.6 });
    const nicheInnerMat = new THREE.MeshStandardMaterial({ color: 0x221a14, roughness: 0.9 });

    // Recessed interior box
    const nicheCavity = new THREE.Mesh(new THREE.BoxGeometry(1.50, 1.25, 1.10), nicheInnerMat);
    nicheCavity.position.set(0, 0.68, 1.55);
    ovenGroup.add(nicheCavity);

    // Stone portal framing the firewood niche opening - positioned proud at z = 2.15
    const nicheJambGeo = new THREE.BoxGeometry(0.22, 1.15, 0.26);
    const leftJamb = new THREE.Mesh(nicheJambGeo, nicheFrameMat);
    leftJamb.position.set(-0.76, 0.60, 2.15);
    const rightJamb = new THREE.Mesh(nicheJambGeo, nicheFrameMat);
    rightJamb.position.set(0.76, 0.60, 2.15);
    ovenGroup.add(leftJamb, rightJamb);

    const nicheArch = new THREE.Mesh(
      new THREE.TorusGeometry(0.76, 0.13, 12, 28, Math.PI),
      nicheFrameMat
    );
    nicheArch.position.set(0, 1.17, 2.15);
    ovenGroup.add(nicheArch);

    const nicheKeystone = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.22, 0.28),
      new THREE.MeshStandardMaterial({ color: 0xaa9480, roughness: 0.5 })
    );
    nicheKeystone.position.set(0, 1.95, 2.20);
    ovenGroup.add(nicheKeystone);

    // Neatly stacked Split Oak Firewood Logs inside the legnaia (4 full tiers, clearly visible)
    const logEndTex = createFirewoodLogTexture();
    const logEndMat = new THREE.MeshStandardMaterial({ map: logEndTex, roughness: 0.7 });
    const logBarkMat = new THREE.MeshStandardMaterial({ color: 0x4a3222, roughness: 0.85 });
    const logGeo = new THREE.CylinderGeometry(0.115, 0.115, 0.95, 16);

    const logPositions: [number, number, number][] = [
      // Tier 1 (bottom row, 5 logs on floor)
      [-0.50, 0.16, 1.70],
      [-0.25, 0.16, 1.72],
      [0.00, 0.16, 1.71],
      [0.25, 0.16, 1.72],
      [0.50, 0.16, 1.70],
      // Tier 2 (4 logs nestled between bottom row)
      [-0.38, 0.38, 1.71],
      [-0.13, 0.38, 1.73],
      [0.13, 0.38, 1.73],
      [0.38, 0.38, 1.71],
      // Tier 3 (3 logs)
      [-0.25, 0.60, 1.73],
      [0.00, 0.60, 1.74],
      [0.25, 0.60, 1.73],
      // Tier 4 (top row, 2 logs)
      [-0.13, 0.82, 1.74],
      [0.13, 0.82, 1.74]
    ];

    logPositions.forEach(([lx, ly, lz], idx) => {
      const log = new THREE.Mesh(logGeo, [logBarkMat, logEndMat, logEndMat]);
      log.rotation.x = Math.PI / 2 + (idx % 2 === 0 ? 0.02 : -0.02);
      log.rotation.z = (Math.random() - 0.5) * 0.04;
      log.position.set(lx, ly, lz);
      log.castShadow = true;
      ovenGroup.add(log);
    });

    // Warm Accent Spotlight illuminating the firewood niche from the floor
    const nicheLight = new THREE.PointLight(0xffecd0, 1.5, 4.2, 1.4);
    nicheLight.position.set(0, 0.85, 2.6);
    ovenGroup.add(nicheLight);

    // 2. Thick Circular Carrara Granite Hearth Ledge & Forward Staging Landing
    const hearthMat = new THREE.MeshStandardMaterial({
      color: 0x5a524a,
      roughness: 0.4,
      metalness: 0.15
    });
    const hearth = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.35, 0.22, 32), hearthMat);
    hearth.position.y = 2.31;
    hearth.castShadow = true;
    ovenGroup.add(hearth);

    // Bullnose trim on hearth edge
    const hearthLip = new THREE.Mesh(
      new THREE.TorusGeometry(2.35, 0.045, 8, 32),
      new THREE.MeshStandardMaterial({ color: 0x221c18, metalness: 0.7, roughness: 0.3 })
    );
    hearthLip.rotation.x = Math.PI / 2;
    hearthLip.position.y = 2.40;
    ovenGroup.add(hearthLip);

    // Biscotto Stone Landing Shelf projecting forward under the oven mouth
    const landingShelf = new THREE.Mesh(
      new THREE.BoxGeometry(1.68, 0.18, 0.65),
      new THREE.MeshStandardMaterial({ color: 0x734832, roughness: 0.6 })
    );
    landingShelf.position.set(0, 2.31, 2.05);
    landingShelf.castShadow = true;
    ovenGroup.add(landingShelf);

    // 3. Open Neapolitan Brick Oven Drum Collar (Front Mouth Opening)
    const mouthAngle = 0.95; // ~54.5 degree mouth centered at front (+Z)
    // Cylinder wall with opening at front (+Z)
    const drumGeo = new THREE.CylinderGeometry(
      1.95,
      1.95,
      0.68,
      32,
      1,
      true, // openEnded = true
      mouthAngle / 2,
      Math.PI * 2 - mouthAngle
    );
    const drumMat = new THREE.MeshStandardMaterial({
      color: 0x612316,
      roughness: 0.8
    });
    const drum = new THREE.Mesh(drumGeo, drumMat);
    drum.position.y = 2.76;
    drum.castShadow = true;
    ovenGroup.add(drum);

    // 4. Artisanal Mosaic Brick Dome - 100% Solid Closed 360° Hemisphere
    // Fully sealed across the entire top, zero gaps or cutouts to the chimney
    const domeGeo = new THREE.SphereGeometry(
      1.95,
      36,
      20,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    );
    const mosaicTex = createOvenDomeMosaicTexture();
    const domeMat = new THREE.MeshStandardMaterial({
      map: mosaicTex,
      roughness: 0.7,
      bumpScale: 0.04
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 3.10;
    dome.scale.set(1.0, 0.85, 1.0);
    dome.castShadow = true;
    ovenGroup.add(dome);

    // 5. Cavernous Glowing Interior (Biscotto Clay Floor & Radiant Vault Ceiling)
    const floorTex = createBiscottoFloorTexture();
    const cavernFloorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.85
    });
    const cavernFloor = new THREE.Mesh(new THREE.CylinderGeometry(1.88, 1.88, 0.06, 32), cavernFloorMat);
    cavernFloor.position.set(0, 2.42, 0);
    cavernFloor.receiveShadow = true;
    ovenGroup.add(cavernFloor);

    // Inner dome lining with warm ember heat radiation - curved vault starting at floor level
    const innerDomeMat = new THREE.MeshStandardMaterial({
      color: 0x3a1e12,
      emissive: 0x5a1e06,
      emissiveIntensity: 0.65,
      roughness: 0.85,
      side: THREE.BackSide
    });
    const innerDome = new THREE.Mesh(
      new THREE.SphereGeometry(1.86, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      innerDomeMat
    );
    innerDome.position.set(0, 2.42, 0);
    innerDome.scale.set(1.0, 0.85, 1.0);
    ovenGroup.add(innerDome);

    // 6. Refractory Firebrick Arch Tunnel framing the Oven Mouth (Deep masonry enclosure, zero open aspects)
    const archTex = createFirebrickArchTexture();
    const firebrickMat = new THREE.MeshStandardMaterial({
      map: archTex,
      roughness: 0.7,
      side: THREE.DoubleSide
    });

    // Deep Left & Right Arch Jamb Pillars extending from front (z = 1.90) back into drum (z = 1.34)
    // Full height masonry jambs from floor (y = 2.42) up to arch apex springline (y = 3.88)
    const mouthJambGeo = new THREE.BoxGeometry(0.32, 1.46, 0.58);
    const mouthLeftJamb = new THREE.Mesh(mouthJambGeo, firebrickMat);
    mouthLeftJamb.position.set(-0.78, 3.15, 1.62);
    mouthLeftJamb.castShadow = true;

    const mouthRightJamb = new THREE.Mesh(mouthJambGeo, firebrickMat);
    mouthRightJamb.position.set(0.78, 3.15, 1.62);
    mouthRightJamb.castShadow = true;
    ovenGroup.add(mouthLeftJamb, mouthRightJamb);

    // Deep Semicircular Barrel Vault Tunnel Ceiling connecting front arch all the way back into the drum
    // In Three.js CylinderGeometry rotated around X by PI/2, theta from PI/2 to 3*PI/2 generates the upper arch (Y > 0)
    const vaultGeo = new THREE.CylinderGeometry(0.66, 0.66, 0.58, 32, 1, true, Math.PI * 0.5, Math.PI);
    const archVault = new THREE.Mesh(vaultGeo, firebrickMat);
    archVault.rotation.x = Math.PI / 2;
    archVault.position.set(0, 3.10, 1.62);
    ovenGroup.add(archVault);

    // Front Voussoir Torus Arch
    const archLintel = new THREE.Mesh(
      new THREE.TorusGeometry(0.78, 0.14, 16, 32, Math.PI),
      firebrickMat
    );
    archLintel.position.set(0, 3.10, 1.88);
    archLintel.castShadow = true;
    ovenGroup.add(archLintel);

    // Sculpted Keystone at apex of arch
    const archKeystone = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.26, 0.34),
      new THREE.MeshStandardMaterial({ color: 0xaa9480, roughness: 0.5 })
    );
    archKeystone.position.set(0, 3.88, 1.90);
    ovenGroup.add(archKeystone);

    // Solid Top Arch Masonry Forehead Pediment (bridges top of arch tunnel directly into front of dome with zero gaps)
    const archHood = new THREE.Mesh(
      new THREE.BoxGeometry(1.88, 0.26, 0.58),
      firebrickMat
    );
    archHood.position.set(0, 3.96, 1.62);
    ovenGroup.add(archHood);

    // 7. Live Burning Oak Wood Fire & Embers - Centered in the Middle of the Oven Hearth
    const fireLogGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.75, 12);
    const fireLogMat = new THREE.MeshStandardMaterial({ color: 0x22130a, roughness: 0.9 });
    const log1 = new THREE.Mesh(fireLogGeo, fireLogMat);
    log1.position.set(-0.25, 2.48, 0.05);
    log1.rotation.set(0.1, 0.25, 0.3);

    const log2 = new THREE.Mesh(fireLogGeo, fireLogMat);
    log2.position.set(0.25, 2.48, 0.05);
    log2.rotation.set(-0.15, -0.25, -0.3);

    const log3 = new THREE.Mesh(fireLogGeo, fireLogMat);
    log3.position.set(0.00, 2.62, 0.05);
    log3.rotation.set(0.05, 0.0, 0.05);
    ovenGroup.add(log1, log2, log3);

    // Glowing Red Charcoal Ember Bed beneath logs in the center
    const emberMat = new THREE.MeshStandardMaterial({
      color: 0xff3700,
      emissive: 0xff2200,
      emissiveIntensity: 1.4,
      roughness: 0.9
    });
    const emberBed = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.75), emberMat);
    emberBed.position.set(0.00, 2.45, 0.05);
    ovenGroup.add(emberBed);

    // Animated Live Flame Planes centered in the middle of the oven
    const fireMat = createOvenFireMaterial();
    const firePlane1 = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.90, 16, 16), fireMat);
    firePlane1.position.set(0.00, 2.90, 0.05);
    firePlane1.rotation.y = 0.0;

    const firePlane2 = new THREE.Mesh(new THREE.PlaneGeometry(0.90, 0.85, 16, 16), fireMat);
    firePlane2.position.set(0.00, 2.90, 0.05);
    firePlane2.rotation.y = Math.PI / 2;
    ovenGroup.add(firePlane1, firePlane2);

    this.animatedUpdaters.push((time) => {
      fireMat.uniforms.uTime.value = time;
    });

    // Flickering Fire Light centered in the middle of the oven
    const fireLight = new THREE.PointLight(0xff5a00, 3.4, 8, 1.4);
    fireLight.position.set(0.00, 2.95, 0.05);
    ovenGroup.add(fireLight);

    this.animatedUpdaters.push((time) => {
      fireLight.intensity = 3.0 + Math.sin(time * 14.0) * 0.5 + Math.cos(time * 8.5) * 0.4;
      emberMat.emissiveIntensity = 1.2 + Math.sin(time * 6.0) * 0.3;
    });

    // 8. Handcrafted Pizza Peel & Pizza sliding directly into the Oven Opening
    const peelGroup = new THREE.Group();

    // Aluminum peel blade resting on the stone landing and entering the mouth
    const paddleMat = new THREE.MeshStandardMaterial({
      color: 0xd8d8d8,
      metalness: 0.88,
      roughness: 0.22
    });
    const paddle = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.02, 0.92), paddleMat);
    paddle.position.set(0, 2.44, 1.55);
    peelGroup.add(paddle);

    // Turned ash-wood peel handle resting cleanly across the Biscotto landing shelf
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xc49662, roughness: 0.55 });
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 1.30), handleMat);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0, 2.43, 2.22);
    peelGroup.add(handle);

    // Fresh 3D Artisanal Pizza from Poly Pizza loaded onto the peel
    this.loadPizzaModel()
      .then((pizza) => {
        // Bounding box is ~5.33 wide, scale to radius ~0.44
        pizza.scale.set(0.165, 0.165, 0.165);
        pizza.position.set(0, 2.47, 1.55);
        peelGroup.add(pizza);
      })
      .catch((err) => {
        console.warn('Fallback to procedural pizza on peel:', err);
        const pizzaGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.035, 32);
        const pizzaTex = createPizzaTexture();
        const pizzaTopMat = new THREE.MeshStandardMaterial({ map: pizzaTex, roughness: 0.6 });
        const pizzaSideMat = new THREE.MeshStandardMaterial({ color: 0xa86c32, roughness: 0.8 });
        const fallbackPizza = new THREE.Mesh(pizzaGeo, [pizzaSideMat, pizzaTopMat, pizzaSideMat]);
        fallbackPizza.position.set(0, 2.47, 1.55);
        peelGroup.add(fallbackPizza);
      });

    ovenGroup.add(peelGroup);

    // 9. Burnished Copper Flue Collar & Exhaust Chimney on Top of the Oven Dome
    const flueHoodMat = new THREE.MeshStandardMaterial({
      color: 0x945437, // Burnished copper
      metalness: 0.8,
      roughness: 0.3
    });
    // Flared copper base collar seated directly on top crown of the dome (x = 0, z = 0)
    const flueHood = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.52, 0.46, 24), flueHoodMat);
    flueHood.position.set(0, 4.82, 0);
    flueHood.castShadow = true;
    ovenGroup.add(flueHood);

    // Decorative copper lip ring at base of chimney
    const collarRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.33, 0.03, 8, 24),
      flueHoodMat
    );
    collarRim.rotation.x = Math.PI / 2;
    collarRim.position.set(0, 5.04, 0);
    ovenGroup.add(collarRim);

    // Heavy Industrial Matte Black Steel Chimney Pipe rising straight up from the oven dome into the ceiling
    const chimneyMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.85, roughness: 0.3 });
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 5.4, 24), chimneyMat);
    chimney.position.set(0, 7.60, 0);
    chimney.castShadow = true;
    ovenGroup.add(chimney);

    // Ceiling penetration trim collar
    const ceilingTrim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 24), chimneyMat);
    ceilingTrim.position.set(0, 9.94, 0);
    ovenGroup.add(ceilingTrim);

    // Riveted structural reinforcing band
    const chimneyBand = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.08, 24), chimneyMat);
    chimneyBand.position.set(0, 6.30, 0);
    ovenGroup.add(chimneyBand);

    // Rotary damper valve wheel on chimney pipe
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0xcc2200, metalness: 0.7, roughness: 0.3 });
    const damperWheel = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.025, 8, 16), wheelMat);
    damperWheel.rotation.y = Math.PI / 4;
    damperWheel.position.set(0.29, 6.30, 0);
    ovenGroup.add(damperWheel);

    const damperSpindle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.18), chimneyMat);
    damperSpindle.rotation.z = Math.PI / 2;
    damperSpindle.position.set(0.20, 6.30, 0);
    ovenGroup.add(damperSpindle);

    // 10. Floor Tools: Wrought Iron Stand & Ash Bucket (Clean floor placement)
    const toolRackMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, metalness: 0.8, roughness: 0.4 });
    const rackStand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.6), toolRackMat);
    rackStand.position.set(2.3, 1.8, 0.4);
    ovenGroup.add(rackStand);

    const rackBase = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.08), toolRackMat);
    rackBase.position.set(2.3, 0.04, 0.4);
    ovenGroup.add(rackBase);

    // Hanging turning peel on rack
    const peelShaftMat = new THREE.MeshStandardMaterial({ color: 0xc29b68, roughness: 0.6 });
    const turningPeel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 3.0), peelShaftMat);
    turningPeel.position.set(2.25, 1.7, 0.3);
    const turningHead = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 16), new THREE.MeshStandardMaterial({ color: 0xb5a07d, metalness: 0.9 }));
    turningHead.rotation.x = Math.PI / 2;
    turningHead.position.set(2.25, 3.2, 0.3);
    ovenGroup.add(turningPeel, turningHead);

    // Metal Ash Bucket resting cleanly on the floor
    const bucketMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.7, roughness: 0.4 });
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.48, 16), bucketMat);
    bucket.position.set(2.0, 0.24, 1.2);
    ovenGroup.add(bucket);

    // Station Highlight Ring (Hidden per design)
    this.ovenHighlightMesh = new THREE.Mesh(
      new THREE.RingGeometry(2.3, 2.45, 32),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    this.ovenHighlightMesh.visible = false;

    // Invisible Hitbox for Oven Station
    const hitBox = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 4.8, 4.4),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitBox.position.set(-5.5, 2.4, -5.5);
    this.scene.add(hitBox);

    this.hitboxes.push({
      mesh: hitBox,
      station: 'oven',
      title: '🔥 Brick Oven',
      subtitle: 'Projects · Click to inspect',
      color: '#ff4500'
    });

    this.scene.add(ovenGroup);
  }

  private buildChalkboardStation() {
    const chalkboardGroup = new THREE.Group();
    chalkboardGroup.position.set(1.5, 5.2, -7.88);

    // Heavy Ornate Dark Walnut Frame with Inner Gold Bevel
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x2b1810, roughness: 0.5 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(5.6, 4.4, 0.18), frameMat);
    chalkboardGroup.add(frame);

    const goldFilletMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.3 });
    const goldFillet = new THREE.Mesh(new THREE.BoxGeometry(5.2, 4.0, 0.20), goldFilletMat);
    chalkboardGroup.add(goldFillet);

    // Chalkboard Board Surface with dynamic multi-page texture
    this.chalkboardManager = createChalkboardManager();
    const boardMat = new THREE.MeshStandardMaterial({
      map: this.chalkboardManager.texture,
      roughness: 0.75,
      metalness: 0.05,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: this.chalkboardManager.texture,
      emissiveIntensity: 0.55
    });
    const board = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 3.8), boardMat);
    board.position.z = 0.12;
    chalkboardGroup.add(board);

    // Listen for chalkboard page switches (e.g. from HUD or keyboard)
    if (typeof window !== 'undefined') {
      window.addEventListener('pizza-chalkboard-page', ((e: CustomEvent) => {
        if (typeof e.detail?.page === 'number') {
          this.chalkboardManager.setPage(e.detail.page);
        }
      }) as EventListener);
    }

    // Hanging Brass Chains mounting chalkboard to rafters
    const chainMat = new THREE.MeshStandardMaterial({ color: 0xc8a452, metalness: 0.85, roughness: 0.25 });
    [-2.2, 2.2].forEach((cx) => {
      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.4), chainMat);
      chain.position.set(cx, 3.2, 0.05);
      chalkboardGroup.add(chain);
    });

    // Chalk Shelf & Chalk pieces & Wooden Eraser
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.12, 0.35), frameMat);
    shelf.position.set(0, -2.1, 0.18);
    chalkboardGroup.add(shelf);

    // Wooden Chalk Eraser with felt pad
    const eraserMat = new THREE.MeshStandardMaterial({ color: 0x54321b, roughness: 0.7 });
    const eraser = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.16), eraserMat);
    eraser.position.set(1.8, -2.0, 0.24);
    chalkboardGroup.add(eraser);

    const chalkMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    for (let i = 0; i < 3; i++) {
      const chalkPiece = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.14), chalkMat);
      chalkPiece.rotation.z = Math.PI / 2;
      chalkPiece.position.set(-1.0 + i * 0.4, -2.02, 0.22);
      chalkboardGroup.add(chalkPiece);
    }

    // Spot Lamp above chalkboard with Edison warm glow
    const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    lampStem.position.set(0, 2.6, 0.5);
    lampStem.rotation.x = Math.PI / 4;
    chalkboardGroup.add(lampStem);

    const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.4, 16), new THREE.MeshStandardMaterial({ color: 0x1f1f1f, metalness: 0.7 }));
    lampShade.position.set(0, 2.4, 0.7);
    lampShade.rotation.x = Math.PI / 3;
    chalkboardGroup.add(lampShade);

    const boardSpot = new THREE.SpotLight(0xfff3d6, 3.5, 8, Math.PI / 3, 0.35);
    boardSpot.position.set(0, 2.4, 0.7);
    boardSpot.target = board;
    chalkboardGroup.add(boardSpot);

    // Highlight wireframe (Hidden per design)
    this.menuHighlightMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(5.7, 4.5),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    this.menuHighlightMesh.visible = false;

    // Invisible Hitbox
    const hitBox = new THREE.Mesh(
      new THREE.BoxGeometry(5.7, 4.6, 0.9),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitBox.position.set(1.5, 5.2, -7.5);
    this.scene.add(hitBox);

    this.hitboxes.push({
      mesh: hitBox,
      station: 'menu',
      title: '📋 Chalkboard Menu',
      subtitle: 'Resume & Skills · Click to view',
      color: '#00e5ff'
    });

    this.scene.add(chalkboardGroup);
  }

  private buildArcadeStation() {
    const fridgeGroup = new THREE.Group();
    fridgeGroup.position.set(5.8, 0, -5.2);
    fridgeGroup.rotation.y = -Math.PI / 4;

    // 1. Commercial Brushed Stainless Steel Materials (satin finish for soft light diffusion)
    const stainlessMat = new THREE.MeshStandardMaterial({
      color: 0xc2c8ce,
      metalness: 0.65,
      roughness: 0.46
    });

    const darkStainlessMat = new THREE.MeshStandardMaterial({
      color: 0x2b2f36,
      metalness: 0.75,
      roughness: 0.4
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf0f3f6,
      metalness: 0.95,
      roughness: 0.15
    });

    const gasketMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.95
    });

    // 2. Heavy Stainless Caster Legs
    const legGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.35, 16);
    const legCoords = [
      [-0.95, -0.75],
      [0.95, -0.75],
      [-0.95, 0.75],
      [0.95, 0.75]
    ];
    legCoords.forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, chromeMat);
      leg.position.set(lx, 0.175, lz);
      fridgeGroup.add(leg);

      // Caster wheel
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16),
        darkStainlessMat
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(lx, 0.08, lz);
      fridgeGroup.add(wheel);
    });

    // 3. Main Cabinet Body (Insulated Heavy Reach-In Carcass)
    const cabinetBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 5.2, 1.95),
      stainlessMat
    );
    cabinetBody.position.y = 2.95;
    cabinetBody.castShadow = true;
    cabinetBody.receiveShadow = true;
    fridgeGroup.add(cabinetBody);

    // Beveled corner protectors / side rails
    [-1.155, 1.155].forEach((rx) => {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 5.2, 0.03),
        chromeMat
      );
      rail.position.set(rx, 2.95, 0.98);
      fridgeGroup.add(rail);
    });

    // 4. Top Condenser / Compressor Louvered Shroud
    const shroud = new THREE.Mesh(
      new THREE.BoxGeometry(2.32, 0.82, 1.98),
      darkStainlessMat
    );
    shroud.position.set(0, 5.15, 0);
    fridgeGroup.add(shroud);

    // Louver Vents on Left of Shroud
    const louverMat = new THREE.MeshStandardMaterial({
      color: 0x111417,
      metalness: 0.6,
      roughness: 0.5
    });
    for (let i = 0; i < 7; i++) {
      const slat = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.035, 0.04),
        louverMat
      );
      slat.position.set(-0.4, 4.88 + i * 0.08, 1.0);
      fridgeGroup.add(slat);
    }

    // Digital LED Controller Panel on Right of Shroud
    const ledBezel = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.32, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x0f1115, roughness: 0.6 })
    );
    ledBezel.position.set(0.65, 5.15, 1.0);
    fridgeGroup.add(ledBezel);

    const ledTex = createFridgeLedTexture();
    this.fridgeLedMaterial = new THREE.MeshStandardMaterial({
      map: ledTex,
      roughness: 0.2,
      emissive: new THREE.Color(0x00ffcc),
      emissiveMap: ledTex,
      emissiveIntensity: 0.85
    });
    const ledScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 0.26),
      this.fridgeLedMaterial
    );
    ledScreen.position.set(0.65, 5.15, 1.025);
    fridgeGroup.add(ledScreen);

    // 5. Heavy Reach-In Door & Rubber Magnetic Gasket
    const doorGasket = new THREE.Mesh(
      new THREE.BoxGeometry(2.18, 4.28, 0.04),
      gasketMat
    );
    doorGasket.position.set(0, 2.5, 0.99);
    fridgeGroup.add(doorGasket);

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(2.14, 4.22, 0.12),
      stainlessMat
    );
    door.position.set(0, 2.5, 1.06);
    door.castShadow = true;
    fridgeGroup.add(door);

    // Heavy-duty commercial chrome hinges on the right side
    [0.7, 4.3].forEach((hy) => {
      const hinge = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.32, 0.16),
        chromeMat
      );
      hinge.position.set(1.08, hy, 1.08);
      fridgeGroup.add(hinge);
    });

    // Vertical Tubular Stainless Door Handle on the left side
    const handleBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 3.2, 16),
      chromeMat
    );
    handleBar.position.set(-0.92, 2.5, 1.25);
    fridgeGroup.add(handleBar);

    // Standoff brackets connecting handle to door
    [1.0, 4.0].forEach((sy) => {
      const standoff = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.024, 0.14, 12),
        chromeMat
      );
      standoff.rotation.x = Math.PI / 2;
      standoff.position.set(-0.92, sy, 1.18);
      fridgeGroup.add(standoff);
    });

    // 6. High-Resolution Ruled Paper To-Do List (Homelab Ops Sheet - matte finish for crisp readability)
    const paperTex = createFridgeTodoListTexture();
    const paperMat = new THREE.MeshStandardMaterial({
      map: paperTex,
      roughness: 0.96,
      metalness: 0.0,
      emissive: new THREE.Color(0xd8d2c5),
      emissiveMap: paperTex,
      emissiveIntensity: 0.05
    });

    const paper = new THREE.Mesh(
      new THREE.PlaneGeometry(1.36, 1.94),
      paperMat
    );
    paper.position.set(0.08, 2.65, 1.125);
    paper.rotation.z = -0.012; // Realistic human slant
    fridgeGroup.add(paper);

    // 7. Realistic 3D Magnets
    // Magnet 1: Miniature 3D Slice of Pizza (Top-Left corner)
    const pizzaMagGroup = new THREE.Group();
    pizzaMagGroup.position.set(-0.54, 3.58, 1.145);
    pizzaMagGroup.rotation.z = 0.25;

    // Triangular wedge crust
    const crustShape = new THREE.Shape();
    crustShape.moveTo(0, 0);
    crustShape.lineTo(0.16, 0);
    crustShape.lineTo(0.08, 0.22);
    crustShape.closePath();

    const crustExtrudeSettings = { depth: 0.03, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.01, bevelThickness: 0.01 };
    const pizzaMagGeo = new THREE.ExtrudeGeometry(crustShape, crustExtrudeSettings);
    const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.4 });
    const pizzaMag = new THREE.Mesh(pizzaMagGeo, cheeseMat);
    pizzaMag.position.set(-0.08, -0.11, 0);
    pizzaMagGroup.add(pizzaMag);

    // Crust border
    const crustMat = new THREE.MeshStandardMaterial({ color: 0xbb7230, roughness: 0.6 });
    const crustRim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.18, 8),
      crustMat
    );
    crustRim.rotation.z = Math.PI / 2;
    crustRim.position.set(0, -0.1, 0.025);
    pizzaMagGroup.add(crustRim);

    // Pepperoni dots on magnet
    const pepMat = new THREE.MeshStandardMaterial({ color: 0xa8201a, roughness: 0.3 });
    [[-0.02, -0.02], [0.03, 0.04]].forEach(([px, py]) => {
      const pep = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.01, 8), pepMat);
      pep.rotation.x = Math.PI / 2;
      pep.position.set(px, py, 0.03);
      pizzaMagGroup.add(pep);
    });
    fridgeGroup.add(pizzaMagGroup);

    // Magnet 2: Red Glossy Button Magnet (Top-Right corner)
    const redMag = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.055, 0.03, 16),
      new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.2, metalness: 0.1 })
    );
    redMag.rotation.x = Math.PI / 2;
    redMag.position.set(0.70, 3.58, 1.145);
    fridgeGroup.add(redMag);

    // Magnet 3: Yellow Glossy Button Magnet (Bottom-Left corner)
    const yellowMag = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.05, 0.03, 16),
      new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.2, metalness: 0.1 })
    );
    yellowMag.rotation.x = Math.PI / 2;
    yellowMag.position.set(-0.52, 1.78, 1.145);
    fridgeGroup.add(yellowMag);

    // Small Polaroid Photo pinned beside to-do list ("Pizzeria Team / Rack")
    const polaroidMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.35
    });
    const polaroidFrame = new THREE.Mesh(
      new THREE.PlaneGeometry(0.38, 0.46),
      polaroidMat
    );
    polaroidFrame.position.set(0.68, 1.88, 1.135);
    polaroidFrame.rotation.z = 0.08;
    fridgeGroup.add(polaroidFrame);

    const polaroidPhoto = new THREE.Mesh(
      new THREE.PlaneGeometry(0.32, 0.32),
      new THREE.MeshStandardMaterial({ color: 0x1d3557, roughness: 0.5 })
    );
    polaroidPhoto.position.set(0.68, 1.92, 1.138);
    polaroidPhoto.rotation.z = 0.08;
    fridgeGroup.add(polaroidPhoto);

    // Cyan pin magnet holding Polaroid
    const blueMag = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.04, 0.03, 16),
      new THREE.MeshStandardMaterial({ color: 0x00b4d8, roughness: 0.2 })
    );
    blueMag.rotation.x = Math.PI / 2;
    blueMag.position.set(0.68, 2.08, 1.15);
    fridgeGroup.add(blueMag);

    // 8. Soft Diffused Cool White Lighting for Walk-In Cooler Station (eliminates glare on paper)
    this.fridgeLight = new THREE.PointLight(0xdceef5, 0.42, 6.5, 2.0);
    this.fridgeLight.position.set(0, 4.3, 2.5);
    fridgeGroup.add(this.fridgeLight);

    // Station Highlight Ring (Hidden per design)
    this.arcadeHighlightMesh = new THREE.Mesh(
      new THREE.RingGeometry(1.5, 1.65, 32),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    this.arcadeHighlightMesh.visible = false;

    // Invisible Hitbox
    const hitBox = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 5.4, 2.5),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitBox.position.set(5.8, 2.7, -5.2);
    this.scene.add(hitBox);

    this.hitboxes.push({
      mesh: hitBox,
      station: 'arcade',
      title: '🧊 Walk-In Fridge',
      subtitle: 'Homelab Ops · Click to inspect',
      color: '#00f0ff'
    });

    this.scene.add(fridgeGroup);
  }

  private buildCounterAndRegisterStation() {
    const counterGroup = new THREE.Group();
    counterGroup.position.set(-1.0, 0, 2.0);

    // 1. Long Wainscoted Service Counter
    const counterWoodMat = new THREE.MeshStandardMaterial({
      color: 0x361c10,
      roughness: 0.55
    });

    const counterBase = new THREE.Mesh(new THREE.BoxGeometry(8.2, 2.2, 1.8), counterWoodMat);
    counterBase.position.y = 1.1;
    counterBase.castShadow = true;
    counterBase.receiveShadow = true;
    counterGroup.add(counterBase);

    // Raised Wood Wainscot Panels on front face
    const panelBevelMat = new THREE.MeshStandardMaterial({ color: 0x27140b, roughness: 0.6 });
    for (let px = -3.0; px <= 3.0; px += 2.0) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.5, 0.06), panelBevelMat);
      panel.position.set(px, 1.1, 0.93);
      counterGroup.add(panel);
    }

    // Brass Foot Rail along counter bottom
    const footRailMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
    const footRail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 8.4), footRailMat);
    footRail.rotation.z = Math.PI / 2;
    footRail.position.set(0, 0.25, 1.15);
    counterGroup.add(footRail);

    // Polished Carrara White Marble Countertop with Beveled Bullnose Edge
    const marbleTex = createMarbleCounterTexture();
    const counterMarbleTopMat = new THREE.MeshStandardMaterial({
      map: marbleTex,
      roughness: 0.2,
      metalness: 0.05
    });

    const counterTop = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.18, 2.2), counterMarbleTopMat);
    counterTop.position.y = 2.29;
    counterTop.receiveShadow = true;
    counterTop.castShadow = true;
    counterGroup.add(counterTop);

    // 2. Glass Sneeze Guard / Display Case with Stainless Steel Frame (Right Zone)
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xeef7fc,
      opacity: 0.28,
      transparent: true,
      roughness: 0.08,
      metalness: 0.15,
      depthWrite: false
    });
    // Display case placed comfortably on the right side of the counter (from x = 0.9 to x = 4.0)
    const sneezeGuard = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.95, 1.35), glassMat);
    sneezeGuard.position.set(2.45, 2.85, 0.05);
    counterGroup.add(sneezeGuard);

    // Stainless steel glass frame brackets
    const frameChromeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.95, roughness: 0.15 });
    [0.92, 3.98].forEach((gx) => {
      const frontPost = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0), frameChromeMat);
      frontPost.position.set(gx, 2.85, 0.68);
      const backPost = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0), frameChromeMat);
      backPost.position.set(gx, 2.85, -0.58);
      counterGroup.add(frontPost, backPost);
    });

    // Left: Pepperoni Pizza on stainless steel riser (3D model from Poly Pizza with procedural fallback)
    const riserMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.9, roughness: 0.2 });
    const riser1 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 0.12, 24), riserMat);
    riser1.position.set(1.70, 2.44, 0.05);
    counterGroup.add(riser1);

    this.loadPizzaModel()
      .then((pizza) => {
        pizza.scale.set(0.18, 0.18, 0.18);
        pizza.position.set(1.70, 2.52, 0.05);
        counterGroup.add(pizza);
      })
      .catch((err) => {
        console.warn('Fallback to procedural pepperoni pizza:', err);
        const pepPizza = new THREE.Mesh(
          new THREE.CylinderGeometry(0.46, 0.46, 0.035, 32),
          new THREE.MeshStandardMaterial({ map: createPizzaTexture(), roughness: 0.6 })
        );
        pepPizza.position.set(1.70, 2.52, 0.05);
        counterGroup.add(pepPizza);
      });

    // Right: Fresh Margherita Pizza on stainless steel riser (3D Poly Pizza model with procedural fallback)
    const riser2 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 0.12, 24), riserMat);
    riser2.position.set(3.20, 2.44, 0.05);
    counterGroup.add(riser2);

    this.loadPizzaModel()
      .then((pizza2) => {
        pizza2.scale.set(0.18, 0.18, 0.18);
        pizza2.position.set(3.20, 2.52, 0.05);
        pizza2.rotation.y = 1.85; // Rotated so it has a distinct orientation from riser1
        counterGroup.add(pizza2);
      })
      .catch((err) => {
        console.warn('Fallback to procedural margherita pizza:', err);
        const margheritaPizza = new THREE.Mesh(
          new THREE.CylinderGeometry(0.46, 0.46, 0.035, 32),
          new THREE.MeshStandardMaterial({ map: createMargheritaPizzaTexture(), roughness: 0.6 })
        );
        margheritaPizza.position.set(3.20, 2.52, 0.05);
        counterGroup.add(margheritaPizza);
      });

    // 3. Sleek Modern Pizzeria POS & Cash Register System (Order Station)
    const registerGroup = new THREE.Group();
    registerGroup.position.set(-2.65, 2.38, 0.15);

    // a. Heavy Steel Cash Drawer Base
    const drawerMat = new THREE.MeshStandardMaterial({
      color: 0x181b19,
      metalness: 0.85,
      roughness: 0.3
    });
    const cashDrawer = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.22, 1.10), drawerMat);
    cashDrawer.position.y = 0.11;
    cashDrawer.castShadow = true;
    registerGroup.add(cashDrawer);

    // Front Drawer Face with Seam & Brass Keyhole Lock
    const drawerFront = new THREE.Mesh(
      new THREE.BoxGeometry(1.12, 0.16, 0.03),
      new THREE.MeshStandardMaterial({ color: 0x121413, metalness: 0.8, roughness: 0.4 })
    );
    drawerFront.position.set(0, 0.11, 0.56);
    registerGroup.add(drawerFront);

    const keyhole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.04, 12),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 })
    );
    keyhole.rotation.x = Math.PI / 2;
    keyhole.position.set(0.42, 0.11, 0.58);
    registerGroup.add(keyhole);

    // b. Brushed Aluminum Swivel Pedestal Neck
    const standMat = new THREE.MeshStandardMaterial({ color: 0x2b2e2c, metalness: 0.8, roughness: 0.3 });
    const standNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.08, 0.42, 16), standMat);
    standNeck.position.set(0, 0.42, 0);
    registerGroup.add(standNeck);

    const standJoint = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 16), standMat);
    standJoint.position.set(0, 0.63, 0);
    registerGroup.add(standJoint);

    // c. Dual Touchscreens:
    // (1) Customer-Facing Display (Facing +Z toward customer in dining area)
    const custScreenGroup = new THREE.Group();
    custScreenGroup.position.set(0, 0.72, 0.10);
    custScreenGroup.rotation.x = -0.22; // Natural angled viewing

    const custBezel = new THREE.Mesh(
      new THREE.BoxGeometry(0.86, 0.58, 0.035),
      new THREE.MeshStandardMaterial({ color: 0x111312, roughness: 0.4 })
    );
    custScreenGroup.add(custBezel);

    const custTex = createRegisterScreenTexture();
    const custScreenMat = new THREE.MeshStandardMaterial({
      map: custTex,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: custTex,
      emissiveIntensity: 0.85,
      roughness: 0.2
    });
    const custScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.54), custScreenMat);
    custScreen.position.z = 0.02;
    custScreenGroup.add(custScreen);
    registerGroup.add(custScreenGroup);

    // (2) Cashier-Facing Touchscreen (Facing -Z toward kitchen/chef)
    const cashierScreenGroup = new THREE.Group();
    cashierScreenGroup.position.set(0, 0.76, -0.10);
    cashierScreenGroup.rotation.x = 0.32; // Angled for staff

    const cashierBezel = new THREE.Mesh(
      new THREE.BoxGeometry(0.88, 0.60, 0.035),
      new THREE.MeshStandardMaterial({ color: 0x141615, roughness: 0.4 })
    );
    cashierScreenGroup.add(cashierBezel);

    const cashierScreenMat = new THREE.MeshStandardMaterial({
      color: 0x1a2620,
      emissive: new THREE.Color(0x00ffaa),
      emissiveIntensity: 0.15,
      roughness: 0.3
    });
    const cashierScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.56), cashierScreenMat);
    cashierScreen.rotation.y = Math.PI;
    cashierScreen.position.z = -0.02;
    cashierScreenGroup.add(cashierScreen);
    registerGroup.add(cashierScreenGroup);

    // d. Thermal Cube Receipt Printer with Real Printed Paper Tape
    const printerGroup = new THREE.Group();
    printerGroup.position.set(-0.85, 0.18, 0.1);

    const printerBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.40, 0.34, 0.42),
      new THREE.MeshStandardMaterial({ color: 0x1b1d1c, roughness: 0.5, metalness: 0.3 })
    );
    printerGroup.add(printerBody);

    // Green Power LED
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
    const powerLed = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 8), ledMat);
    powerLed.position.set(-0.14, 0.18, 0.16);
    printerGroup.add(powerLed);

    // Protruding Printed Paper Receipt
    const receiptTex = createReceiptPaperTexture();
    const receiptMat = new THREE.MeshStandardMaterial({
      map: receiptTex,
      roughness: 0.7,
      side: THREE.DoubleSide
    });
    const receiptTape = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.52), receiptMat);
    receiptTape.position.set(0, 0.36, 0.06);
    receiptTape.rotation.x = -0.35;
    printerGroup.add(receiptTape);
    registerGroup.add(printerGroup);

    // e. Contactless Tap-To-Pay Reader Puck (Square / Verifone Terminal)
    const puckGroup = new THREE.Group();
    puckGroup.position.set(0.82, 0.03, 0.28);

    const puckBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.06, 0.38),
      new THREE.MeshStandardMaterial({ color: 0x222423, metalness: 0.5, roughness: 0.4 })
    );
    puckBase.rotation.x = -0.15;
    puckGroup.add(puckBase);

    // 4 Glowing Green NFC Contactless LEDs
    for (let i = 0; i < 4; i++) {
      const nfcLed = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x00ff88 })
      );
      nfcLed.position.set(-0.06 + i * 0.04, 0.05, 0.06);
      puckGroup.add(nfcLed);
    }
    registerGroup.add(puckGroup);

    counterGroup.add(registerGroup);

    // Classic Glass Mason Tip Jar beside the register
    const tipJarGroup = new THREE.Group();
    tipJarGroup.position.set(-1.85, 2.38, 0.20);

    const jarMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1
    });
    const jarGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.36, 16), jarMat);
    jarGlass.position.y = 0.18;
    tipJarGroup.add(jarGlass);

    // White Label: CHEF TIPS
    const labelMat = new THREE.MeshStandardMaterial({ color: 0xf4ede2, roughness: 0.8 });
    const jarLabel = new THREE.Mesh(new THREE.CylinderGeometry(0.162, 0.162, 0.14, 16, 1, true, 0, Math.PI), labelMat);
    jarLabel.rotation.y = Math.PI / 2;
    jarLabel.position.y = 0.18;
    tipJarGroup.add(jarLabel);

    // Folded Green Dollar Bills inside jar
    const billMat = new THREE.MeshStandardMaterial({ color: 0x558b2f, roughness: 0.7 });
    for (let b = 0; b < 4; b++) {
      const bill = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.06), billMat);
      bill.position.set((Math.random() - 0.5) * 0.08, 0.10 + b * 0.04, (Math.random() - 0.5) * 0.08);
      bill.rotation.set(Math.random(), Math.random(), Math.random());
      tipJarGroup.add(bill);
    }
    counterGroup.add(tipJarGroup);

    // 4. Stack of 4 Pizza Takeout Boxes (Neat & clean order stack)
    const boxTex = createPizzaBoxTexture();
    const boxMat = new THREE.MeshStandardMaterial({ map: boxTex, roughness: 0.7 });
    for (let i = 0; i < 4; i++) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.15, 1.02), boxMat);
      box.position.set(-1.05, 2.45 + i * 0.16, 0.20);
      box.rotation.y = (i * 0.05) - 0.07;
      counterGroup.add(box);
    }

    // 5. Classic Shakers (Parmesan & Red Pepper) & Vintage Olive Oil Tin on the left counter
    const shakerGlassMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.6 });
    const shakerCapMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });

    const pepShaker = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.28, 16), shakerGlassMat);
    pepShaker.position.set(-3.5, 2.52, 0.35);
    const pepCap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16), shakerCapMat);
    pepCap.position.set(-3.5, 2.68, 0.35);
    counterGroup.add(pepShaker, pepCap);

    const cheeseShaker = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.28, 16), shakerGlassMat);
    cheeseShaker.position.set(-3.78, 2.52, 0.35);
    const cheeseCap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16), shakerCapMat);
    cheeseCap.position.set(-3.78, 2.68, 0.35);
    counterGroup.add(cheeseShaker, cheeseCap);

    // Vintage Green Italian Olive Oil Can
    const oilCanMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27, metalness: 0.6, roughness: 0.4 });
    const oilCan = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.42, 0.16), oilCanMat);
    oilCan.position.set(-3.65, 2.60, -0.25);
    const oilSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.15), new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.9 }));
    oilSpout.position.set(-3.65, 2.85, -0.25);
    counterGroup.add(oilCan, oilSpout);

    // Highlight Ring on floor (Hidden per design)
    this.registerHighlightMesh = new THREE.Mesh(
      new THREE.RingGeometry(1.6, 1.75, 32),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    this.registerHighlightMesh.visible = false;

    // Invisible Hitbox
    const hitBox = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 3.4, 2.4),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitBox.position.set(-3.5, 2.4, 2.1);
    this.scene.add(hitBox);

    this.hitboxes.push({
      mesh: hitBox,
      station: 'register',
      title: '🧾 Cashier Counter',
      subtitle: 'Contact · Click to connect',
      color: '#ffd700'
    });

    this.scene.add(counterGroup);
  }

  // 4b. Secret In-World Item: Nonna Rosa's 1924 Sourdough Codex (Leads to Tearable Login)
  // Wall-mounted securely on the Left Brick Wall (x = -7.92), completely free of the counter table
  private buildSecretCodexItem() {
    const codexGroup = new THREE.Group();
    // Mounted on Left Brick Wall at x = -7.92, y = 4.45, z = -1.2, rotated 90deg facing into the room (+X)
    codexGroup.position.set(-7.92, 4.45, -1.2);
    codexGroup.rotation.y = Math.PI / 2;

    // 1. Ornate Dark Walnut Shadowbox Plaque Frame
    const walnutMat = new THREE.MeshStandardMaterial({
      color: 0x24140b,
      roughness: 0.65
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.25
    });

    // Dark walnut outer frame backplate
    const frameBacking = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.24, 0.05), walnutMat);
    frameBacking.position.set(0, 0, 0.025);
    frameBacking.castShadow = true;
    codexGroup.add(frameBacking);

    // Beveled brass inner fillet molding
    const brassFillet = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.14, 0.06), brassMat);
    brassFillet.position.set(0, 0, 0.028);
    codexGroup.add(brassFillet);

    // Leather / Velvet parchment mounting board
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0x3a1d12,
      roughness: 0.75
    });
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.74, 1.06, 0.07), boardMat);
    board.position.set(0, 0, 0.035);
    codexGroup.add(board);

    // 4 Burnished Brass Filigree Corner Brackets
    const bracketGeo = new THREE.BoxGeometry(0.10, 0.10, 0.02);
    [
      [-0.37, 0.53],
      [0.37, 0.53],
      [-0.37, -0.53],
      [0.37, -0.53]
    ].forEach(([bx, by]) => {
      const bracket = new THREE.Mesh(bracketGeo, brassMat);
      bracket.position.set(bx, by, 0.075);
      codexGroup.add(bracket);
    });

    // 2. Aged Parchment Manuscript with 1924 Sourdough Recipe Texture
    const codexTex = createSecretCodexTexture();
    const parchmentMat = new THREE.MeshStandardMaterial({
      map: codexTex,
      roughness: 0.6,
      metalness: 0.05,
      emissive: new THREE.Color(0xffe2b8),
      emissiveMap: codexTex,
      emissiveIntensity: 0.35
    });

    const parchment = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 1.0), parchmentMat);
    parchment.position.set(0, 0, 0.076);
    codexGroup.add(parchment);

    // 3. Vintage Brass Wall Picture Sconce mounted above the frame
    const sconceMat = new THREE.MeshStandardMaterial({ color: 0xc8a452, metalness: 0.85, roughness: 0.2 });
    // Sconce wall mount rosette
    const rosette = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16), sconceMat);
    rosette.rotation.x = Math.PI / 2;
    rosette.position.set(0, 0.76, 0.015);
    codexGroup.add(rosette);

    // Curved gooseneck arm extending outward from wall
    const sconceArm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.28, 12), sconceMat);
    sconceArm.rotation.x = Math.PI / 2;
    sconceArm.position.set(0, 0.76, 0.15);
    codexGroup.add(sconceArm);

    // Shaded brass hood pointing down onto the manuscript
    const sconceHood = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.13, 0.12, 16), sconceMat);
    sconceHood.position.set(0, 0.68, 0.28);
    sconceHood.rotation.x = 0.35;
    codexGroup.add(sconceHood);

    // Warm illumination pool on the manuscript
    const codexLight = new THREE.PointLight(0xffdf9e, 1.4, 4.0, 1.8);
    codexLight.position.set(0, 0.62, 0.35);
    codexGroup.add(codexLight);

    // 4. Pulsing Emissive Warmth / Mysterious Halo
    this.animatedUpdaters.push((time) => {
      const pulse = 0.35 + Math.sin(time * 2.2) * 0.12;
      parchmentMat.emissiveIntensity = pulse;
    });

    // 5. Interactive Hitbox placed on the Left Wall (Completely clear of counter)
    const hitBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 1.8, 1.4),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitBox.position.set(-7.75, 4.45, -1.2);
    this.scene.add(hitBox);

    this.hitboxes.push({
      mesh: hitBox,
      station: 'secret',
      title: "📜 Sourdough Codex",
      subtitle: 'Secret Recipe · Click to read',
      color: '#f39c12',
      url: '/login'
    });

    this.scene.add(codexGroup);
  }

  private buildAmbianceAndLights() {
    // 1. Warm Ambient Base Light (dimmed for cozy pizzeria atmosphere)
    this.ambientLight = new THREE.AmbientLight(0xffecd2, 0.48);
    this.scene.add(this.ambientLight);

    // 2. Main Warm Directional Fill (softened fill through front windows)
    this.dirLight = new THREE.DirectionalLight(0xffe2b8, 0.82);
    this.dirLight.position.set(8, 14, 10);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 35;
    this.scene.add(this.dirLight);

    // 3. Hanging Industrial Pendant Lamps over Counter (Elevated above eye line)
    const lampX = [-3.0, 0, 3.0];
    lampX.forEach((x) => {
      // Cord hanging from ceiling (y = 10 to y = 7.1)
      const cord = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 2.8),
        new THREE.MeshBasicMaterial({ color: 0x111111 })
      );
      cord.position.set(x, 8.5, 2.0);
      this.scene.add(cord);

      // Brass / Black Cone Shade (Elevated at y = 7.0 for clear sightlines)
      const shade = new THREE.Mesh(
        new THREE.ConeGeometry(0.42, 0.36, 16),
        new THREE.MeshStandardMaterial({ color: 0x221a14, metalness: 0.8, roughness: 0.25 })
      );
      shade.position.set(x, 7.0, 2.0);
      this.scene.add(shade);

      // Warm Point Light pool shining down on marble counter
      const lampPoint = new THREE.PointLight(0xffb366, 1.25, 7.0, 1.5);
      lampPoint.position.set(x, 6.7, 2.0);
      this.scene.add(lampPoint);
      this.pendantLights.push(lampPoint);
    });

    // 4. Vibrant "HOT SLICES" Neon Sign on Left Wall
    const neonSignGroup = new THREE.Group();
    neonSignGroup.position.set(-7.92, 6.8, -3.2);
    neonSignGroup.rotation.y = Math.PI / 2;

    // Dark acrylic sign backing with mounting standoffs
    const signBacking = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 1.2, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.7, metalness: 0.2 })
    );
    neonSignGroup.add(signBacking);

    // Industrial electrical conduit running up to the ceiling
    const conduitMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, metalness: 0.85, roughness: 0.3 });
    const conduit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 2.4),
      conduitMat
    );
    conduit.position.set(0, 1.8, -0.02);
    neonSignGroup.add(conduit);

    // High-resolution dual-tube neon canvas
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 180;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#060608';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Outer neon border tube (Amber gold)
    ctx.strokeStyle = '#ff9100';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ff9100';
    ctx.shadowBlur = 12;
    ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

    // Inner bright core for border
    ctx.strokeStyle = '#fff3e0';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 4;
    ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

    // "HOT SLICES" Glowing Neon Lettering
    ctx.textAlign = 'center';

    // 1. Outer Neon Red/Crimson Halo
    ctx.fillStyle = '#ff1744';
    ctx.font = '900 52px Impact, "Arial Black", sans-serif';
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur = 24;
    ctx.fillText('🍕 HOT SLICES 🍕', canvas.width / 2, 108);

    // 2. Inner White-Hot Neon Core
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 50px Impact, "Arial Black", sans-serif';
    ctx.shadowColor = '#ff5252';
    ctx.shadowBlur = 8;
    ctx.fillText('🍕 HOT SLICES 🍕', canvas.width / 2, 108);

    // Sub-text neon underline
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#ffab40';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('FRESH OUT OF THE OVEN • SERVED ALL DAY', canvas.width / 2, 142);

    const neonTex = new THREE.CanvasTexture(canvas);
    const neonMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 1.05),
      new THREE.MeshBasicMaterial({ map: neonTex })
    );
    neonMesh.position.z = 0.05;
    neonSignGroup.add(neonMesh);

    // Red Neon glow light casting onto left wall and stone hearth
    const redNeonLight = new THREE.PointLight(0xff1744, 1.8, 6.5);
    redNeonLight.position.set(-7.1, 6.8, -3.2);
    this.scene.add(redNeonLight);

    this.scene.add(neonSignGroup);

    // Subtle Neon flicker animation
    this.animatedUpdaters.push((time) => {
      if (Math.sin(time * 26.0) > 0.98) {
        redNeonLight.intensity = 0.4;
      } else {
        redNeonLight.intensity = 1.8;
      }
    });
  }

  public update(time: number, delta: number) {
    for (const updater of this.animatedUpdaters) {
      updater(time, delta);
    }
  }

  public updateFridgeTemperature(tempC: number, tempF: number, statusText: string = 'COOLING [OK]') {
    if (!this.fridgeLedMaterial) return;
    const newTex = createFridgeLedTexture(tempC, tempF, statusText);
    if (this.fridgeLedMaterial.map) this.fridgeLedMaterial.map.dispose();
    if (this.fridgeLedMaterial.emissiveMap) this.fridgeLedMaterial.emissiveMap.dispose();
    this.fridgeLedMaterial.map = newTex;
    this.fridgeLedMaterial.emissiveMap = newTex;
    this.fridgeLedMaterial.needsUpdate = true;
  }

  public setDarkMode(isDark: boolean) {
    if (this.ambientLight) {
      this.ambientLight.intensity = isDark ? 0.18 : 0.48;
      this.ambientLight.color.setHex(isDark ? 0xd9c8ff : 0xffecd2);
    }
    if (this.dirLight) {
      this.dirLight.intensity = isDark ? 0.22 : 0.82;
      this.dirLight.color.setHex(isDark ? 0x99b3ff : 0xffe2b8);
    }
    for (const lamp of this.pendantLights) {
      lamp.intensity = isDark ? 0.72 : 1.25;
    }
    if (this.fridgeLight) {
      this.fridgeLight.intensity = isDark ? 0.30 : 0.42;
    }
  }
}
