const components = [];

export class CustomBehaviorSystem {
  tick(dt) {
    for (let i = 0; i < components.length; i++) {
        const cmp = components[i];
        const obj = cmp.el.object3D;
        try {
            //console.log('custom behavior being applied')
        } catch (e) { console.log(e) }  
    }
  }
}

AFRAME.registerComponent("custom-behavior", {
      async init() {
        await waitForDOMContentLoaded();
      },

      play() {
        components.push(this);
      },

      pause() {
        components.splice(components.indexOf(this), 1);
      }
    }
);

AFRAME.registerComponent("scale-tween", {
  schema: {
    smallest: { type: "number", default: 0.5 },
    largest: { type: "number", default: 3 },
    oneWayTimeMillis: { type: "number", default: 2000 },
    startTimeMillis: {type: "number", default: 0},
    isGrowing: { type: "boolean", default: true},
    startScale:  { type: "number", default: 0.5 },
    targetScale:  { type: "number", default: 0.5 }
  },
  
  async init() {
    await waitForDOMContentLoaded();

    this.toggleDirection(Date.now());
  },

  toggleDirection(newStartMillis) {
    this.data.isGrowing = !this.data.isGrowing;
    const { smallest, largest, isGrowing } = this.data;
    this.data.startScale = isGrowing ? smallest : largest;
    this.data.targetScale = isGrowing ? largest : smallest;
    this.data.startTimeMillis = newStartMillis;
  },

  play() {
    //components.push(this);
  },

  pause() {
    //components.splice(components.indexOf(this), 1);
  },

  tick() {
    const { startScale, targetScale, oneWayTimeMillis, startTimeMillis } = this.data;

    const start = new THREE.Vector3(startScale, startScale, startScale);
    const target = new THREE.Vector3(targetScale, targetScale, targetScale);
    const nowMillis = Date.now()
    const lerp = (nowMillis - startTimeMillis) / oneWayTimeMillis;

    if (lerp > 1) {
      this.toggleDirection(nowMillis);
    } else {
      const scale = start.lerp(target, lerp);
      this.el.object3D.scale.set(scale.x, scale.y, scale.z);
      this.el.object3D.matrixNeedsUpdate = true;
    }
  }
});