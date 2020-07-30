import resizeShadowCameraFrustum from "../utils/resizeShadowCameraFrustum";

function traverseAnimationTargets(rootObject, animations, callback) {
  if (animations && animations.length > 0) {
    for (const animation of animations) {
      for (const track of animation.tracks) {
        const { nodeName } = THREE.PropertyBinding.parseTrackName(track.name);
        let animatedNode = rootObject.getObjectByProperty("uuid", nodeName);

        if (!animatedNode) {
          animatedNode = rootObject.getObjectByName(nodeName);
        }

        if (animatedNode) {
          callback(animatedNode);
        }
      }
    }
  }
}

export class ShadowSystem {
  constructor(sceneEl) {
    this.needsUpdate = false;
    this.dynamicShadowsEnabled = window.APP.store.state.preferences.enableDynamicShadows;
    this.sceneEl = sceneEl;
    this.onEnvironmentSceneLoaded = this.onEnvironmentSceneLoaded.bind(this);
    this.sceneEl.addEventListener("environment-scene-loaded", this.onEnvironmentSceneLoaded);
  }

  onEnvironmentSceneLoaded({ detail: scene }) {
    this.environmentObject3D = scene;
    this.needsUpdate = true;
    this.sceneEl.renderer.shadowMap.autoUpdate = this.dynamicShadowsEnabled;
  }

  tick() {
    if (!this.needsUpdate) {
      return;
    }

    if (window.APP.store.state.preferences.materialQualitySetting === "low") {
      return;
    }

    const environmentObject3D = this.environmentObject3D;

    if (!environmentObject3D) {
      return;
    }

    if (!this.dynamicShadowsEnabled) {
      // Recompute the shadowmap when the environment changes.
      traverseAnimationTargets(environmentObject3D, environmentObject3D.animations, animatedNode => {
        animatedNode.traverse(child => {
          child.castShadow = false;
          child.receiveShadow = false;
        });
      });
    }

    environmentObject3D.updateMatrixWorld(true, true);

    environmentObject3D.traverse(object3D => {
      if (object3D.isDirectionalLight) {
        resizeShadowCameraFrustum(object3D, environmentObject3D);
      }
    });

    this.sceneEl.renderer.shadowMap.needsUpdate = true;
    this.needsUpdate = false;
  }
}