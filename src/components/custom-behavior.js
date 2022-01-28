const components = [];

export class CustomBehaviorSystem {
  tick(dt) {
    for (let i = 0; i < components.length; i++) {
        const cmp = components[i];
        const obj = cmp.el.object3D;
        try {
            console.log('custom behavior being applied')
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
  async init() {
    await waitForDOMContentLoaded();
  },

  play() {
    //components.push(this);
  },

  pause() {
    //components.splice(components.indexOf(this), 1);
  },

  tick() {
    const scale = Math.random() * 3;
    this.el.object3D.scale.set(scale, scale, scale);
    this.el.object3D.matrixNeedsUpdate = true;
  }
}
);