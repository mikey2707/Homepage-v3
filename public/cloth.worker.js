(function () {
  "use strict";

  const wasmPromise = (async () => {
    const wasmUrl = new URL("/cloth-sim.wasm", self.location.href).toString();
    const res = await fetch(wasmUrl);
    if (!res.ok) throw new Error(`Failed to fetch cloth-sim.wasm: ${res.status}`);
    if (WebAssembly.compileStreaming) {
      try {
        return await WebAssembly.compileStreaming(res);
      } catch {
        const cloneRes = await fetch(wasmUrl);
        const buf = await cloneRes.arrayBuffer();
        return WebAssembly.compile(buf);
      }
    }
    const buf = await res.arrayBuffer();
    return WebAssembly.compile(buf);
  })();

  const instances = new Map();
  const pendingQueue = [];
  let wasmReady = false;

  wasmPromise
    .then(() => {
      wasmReady = true;
      for (const { id, msg } of pendingQueue) {
        handleMessage(id, msg);
      }
      pendingQueue.length = 0;
    })
    .catch((err) => {
      console.error("[cloth.worker] WASM compile failed", err);
    });

  async function createClothInstance(width, height, segX, segY, tearThreshold, stiffness) {
    const mod = await wasmPromise;
    const exports = (await WebAssembly.instantiate(mod, {})).exports;
    exports.init(width, height, segX, segY, tearThreshold, stiffness);

    const ptr = exports.pos_ptr();
    const len = exports.pos_len();
    const posView = new Float32Array(exports.memory.buffer, ptr, len);
    const particleCount = exports.particle_count();
    const maxEdgeLen = (width / segX) * tearThreshold;

    return {
      exports,
      posView,
      pendingMessages: [],
      segX,
      segY,
      width,
      particleCount,
      maxLengthSq: maxEdgeLen * maxEdgeLen,
      normalsBuf: new Float32Array(particleCount * 3),
      indexBuf: new Uint32Array(segX * segY * 6),
    };
  }

  function rebuildNormalsAndIndices(inst) {
    const { posView: pos, segX, segY, particleCount, maxLengthSq, normalsBuf, indexBuf } = inst;
    const stride = segX + 1;
    const totalFloats = particleCount * 3;

    for (let i = 0; i < totalFloats; i++) {
      normalsBuf[i] = 0;
    }

    let drawCount = 0;
    for (let r = 0; r < segY; r++) {
      for (let c = 0; c < segX; c++) {
        const i0 = c + stride * r;
        const i1 = c + stride * (r + 1);
        const i2 = c + 1 + stride * (r + 1);
        const i3 = c + 1 + stride * r;

        const p0 = i0 * 3;
        const p1 = i1 * 3;
        const p2 = i2 * 3;
        const p3 = i3 * 3;

        const x0 = pos[p0], y0 = pos[p0 + 1], z0 = pos[p0 + 2];
        const x1 = pos[p1], y1 = pos[p1 + 1], z1 = pos[p1 + 2];
        const x2 = pos[p2], y2 = pos[p2 + 1], z2 = pos[p2 + 2];
        const x3 = pos[p3], y3 = pos[p3 + 1], z3 = pos[p3 + 2];

        // Triangle 1: (i0, i1, i3)
        let dx = x0 - x1, dy = y0 - y1, dz = z0 - z1;
        const d01Sq = dx * dx + dy * dy + dz * dz;
        dx = x0 - x3; dy = y0 - y3; dz = z0 - z3;
        const d03Sq = dx * dx + dy * dy + dz * dz;

        if (d01Sq < maxLengthSq && d03Sq < maxLengthSq) {
          indexBuf[drawCount++] = i0;
          indexBuf[drawCount++] = i1;
          indexBuf[drawCount++] = i3;

          const ux = x1 - x0, uy = y1 - y0, uz = z1 - z0;
          const vx = x3 - x0, vy = y3 - y0, vz = z3 - z0;
          const nx = uy * vz - uz * vy;
          const ny = uz * vx - ux * vz;
          const nz = ux * vy - uy * vx;

          normalsBuf[p0] += nx; normalsBuf[p0 + 1] += ny; normalsBuf[p0 + 2] += nz;
          normalsBuf[p1] += nx; normalsBuf[p1 + 1] += ny; normalsBuf[p1 + 2] += nz;
          normalsBuf[p3] += nx; normalsBuf[p3 + 1] += ny; normalsBuf[p3 + 2] += nz;
        }

        // Triangle 2: (i1, i2, i3)
        dx = x1 - x2; dy = y1 - y2; dz = z1 - z2;
        const d12Sq = dx * dx + dy * dy + dz * dz;
        dx = x2 - x3; dy = y2 - y3; dz = z2 - z3;
        const d23Sq = dx * dx + dy * dy + dz * dz;

        if (d12Sq < maxLengthSq && d23Sq < maxLengthSq) {
          indexBuf[drawCount++] = i1;
          indexBuf[drawCount++] = i2;
          indexBuf[drawCount++] = i3;

          const ux = x2 - x1, uy = y2 - y1, uz = z2 - z1;
          const vx = x3 - x1, vy = y3 - y1, vz = z3 - z1;
          const nx = uy * vz - uz * vy;
          const ny = uz * vx - ux * vz;
          const nz = ux * vy - uy * vx;

          normalsBuf[p1] += nx; normalsBuf[p1 + 1] += ny; normalsBuf[p1 + 2] += nz;
          normalsBuf[p2] += nx; normalsBuf[p2 + 1] += ny; normalsBuf[p2 + 2] += nz;
          normalsBuf[p3] += nx; normalsBuf[p3 + 1] += ny; normalsBuf[p3 + 2] += nz;
        }
      }
    }

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const nx = normalsBuf[idx];
      const ny = normalsBuf[idx + 1];
      const nz = normalsBuf[idx + 2];
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (len > 1e-6) {
        const inv = 1 / len;
        normalsBuf[idx] = nx * inv;
        normalsBuf[idx + 1] = ny * inv;
        normalsBuf[idx + 2] = nz * inv;
      } else {
        normalsBuf[idx] = 0;
        normalsBuf[idx + 1] = 0;
        normalsBuf[idx + 2] = 1;
      }
    }

    return drawCount;
  }

  self.onmessage = (ev) => {
    const data = ev.data;
    const id = data.id;
    if (!wasmReady) {
      pendingQueue.push({ id, msg: data });
      return;
    }
    handleMessage(id, data);
  };

  function handleMessage(id, msg) {
    if (msg.type === "init") {
      createClothInstance(msg.width, msg.height, msg.segX, msg.segY, msg.tearThreshold, msg.stiffness)
        .then((inst) => {
          instances.set(id, inst);
          self.postMessage({
            type: "ready",
            id,
            particleCount: inst.exports.particle_count(),
            constraintCount: inst.exports.constraint_count(),
          });
          for (const queued of inst.pendingMessages) {
            handleMessage(id, queued);
          }
          inst.pendingMessages.length = 0;
        })
        .catch((err) => {
          console.error("[cloth.worker] init failed", err);
        });
      return;
    }

    if (msg.type === "dispose") {
      instances.delete(id);
      return;
    }

    const inst = instances.get(id);
    if (!inst) return;

    switch (msg.type) {
      case "grab":
        inst.exports.grab(msg.slot ?? 0, msg.x, msg.y, msg.z, msg.radius);
        break;
      case "moveGrab":
        inst.exports.move_grab(msg.slot ?? 0, msg.x, msg.y, msg.strength);
        break;
      case "releaseGrab":
        if (typeof msg.slot === "number") {
          inst.exports.release_grab(msg.slot);
        } else {
          inst.exports.release_all_grabs();
        }
        break;
      case "cut":
        inst.exports.cut(msg.mx, msg.my, msg.mz, msg.px, msg.py, msg.radius);
        break;
      case "drop":
        inst.exports.drop_pins();
        break;
      case "step": {
        inst.exports.step(msg.gx, msg.gy, msg.gz, msg.damping, msg.iterations, msg.subSteps);
        let posView = inst.posView;
        if (posView.buffer !== inst.exports.memory.buffer || posView.length !== inst.exports.pos_len()) {
          const ptr = inst.exports.pos_ptr();
          const len = inst.exports.pos_len();
          posView = new Float32Array(inst.exports.memory.buffer, ptr, len);
          inst.posView = posView;
        }

        let posOut;
        if (msg.buffer instanceof ArrayBuffer && msg.buffer.byteLength === posView.byteLength) {
          posOut = msg.buffer;
        } else {
          posOut = new ArrayBuffer(posView.byteLength);
        }
        new Float32Array(posOut).set(posView);

        const drawCount = rebuildNormalsAndIndices(inst);
        const normalsOut = new ArrayBuffer(inst.normalsBuf.byteLength);
        new Float32Array(normalsOut).set(inst.normalsBuf);

        const indexOut = new ArrayBuffer(drawCount * 4);
        new Uint32Array(indexOut).set(inst.indexBuf.subarray(0, drawCount));

        self.postMessage(
          {
            type: "stepResult",
            id,
            buffer: posOut,
            normals: normalsOut,
            index: indexOut,
            drawCount,
            brokenCount: inst.exports.broken_count(),
          },
          [posOut, normalsOut, indexOut]
        );
        break;
      }
    }
  }
})();
