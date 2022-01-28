const components = [];

export class CustomBehaviorSystem {
  tick(dt) {
    for (let i = 0; i < components.length; i++) {
        const cmp = components[i];
        const obj = cmp.el.object3D;
        try {
            const isMine = NAF.utils.isMine(cmp.el);
            console.log('custom behavior being applied...isMine:' + isMine)
            if (isMine) {
            }
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