import { findAncestorWithComponent } from "../utils/scene-graph";
import { waitForDOMContentLoaded } from "../utils/async-utils";

/**
 * Face tracking component for A-Frame using face-api.js.
 * @namespace avatar
 * @component face-tracking
 *
 * @member {boolean} isFaceBeingTracked - Control if face is being tracked
 */

const components = [];
const networkedByComponent = new Map();
const origPosByEl = new Map();

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const vec3ToAttrString = (vec3) => '' + vec3.x + ' ' + vec3.y + ' ' + vec3.z;

const attrStringToVec3 = (attrString) => { 
  const eles = attrString.split(' ')
  return new THREE.Vector3(parseFloat(ele[0]), parseFloat(ele[1]), parseFloat(ele[2]))
}

const vec3zero = new THREE.Vector3()
const addVec3 = (v1, v2) => new THREE.Vector3(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z)
const subVec3 = (v1, v2) => new THREE.Vector3(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z)
const mulVec3 = (v1, v2) => new THREE.Vector3(v1.x * v2.x, v1.y * v2.y, v1.z * v2.z)
const divVec3 = (v1, v2) => new THREE.Vector3(v1.x / v2.x, v1.y / v2.y, v1.z / v2.z)

const maxRelativeMovement = ({x: 0.6, y: 0.3}) // 0.3 is just under 1 foot in either direction

export class FaceTrackingSystem {
  mostRecentDetections = {} // each item is a bound vec3, with only x and y populated, between the values of -maxRelativeMovement to maxRelativeMovement
  firstBox = void 0 // TODO no longer ASSuME the first box is essentially centered....TODO require player to go through tracking calibration to detect min/max values!
  boxMin = {x: Number.MAX_VALUE, y: Number.MAX_VALUE}
  boxMax = {x: Number.MIN_VALUE, y: Number.MIN_VALUE}
  origPos = void 0

  addFaceDetections(detections) {
    if (detections) {
      try {
        const box = detections.alignedRect.box
        //if (!this.firstBox) this.firstBox = {x: box.x, y: box.y} // every follow on movement will be applied relative to these values!
        if (box.x < this.boxMin.x) this.boxMin.x = box.x 
        if (box.y < this.boxMin.y) this.boxMin.y = box.y 
        if (box.x > this.boxMax.x) this.boxMax.x = box.x 
        if (box.y > this.boxMax.y) this.boxMax.y = box.y 
        
        //this.mostRecentDetections =  {x:(box.x - this.firstBox.x) / 10, y:(box.x - this.firstBox.y) / 10, z: 0};
        const boxRange = subVec3(this.boxMax, this.boxMin)
        this.mostRecentDetections =  new THREE.Vector3( // put the values in the range of -maxRelativeMovement to maxRelativeMovement
          -(((box.x - this.boxMin.x) / boxRange.x) - 0.5) * 2 * maxRelativeMovement.x,
          -(((box.y - this.boxMin.y) / boxRange.y) - 0.5) * 2 * maxRelativeMovement.y, // have to negate Y since screen Y increases downward as scene Y increases upward
          0)

        // TODO add to a collection and correlate to the current timestamp
      } catch (e) {
        console.log(e)
        this.mostRecentDetections =  void 0; // TODO remove this as it really doesn't make sense in the long run...final impl
      }
    }
  }

  getFaceOrientation() {
     // TODO use past values in mostRecentDetections collection and interpolate/extrapolate baesd on time
     return this.mostRecentDetections ? this.mostRecentDetections : vec3zero;
  }

  tick() {
    for (let i = 0; i < components.length; i++) {
      const cmp = components[i];
      const obj = cmp.el.object3D;
      const { visible, position } = obj;
      const { isFaceBeingTracked } = cmp.data;
      if (isFaceBeingTracked) {
        try {
            const isMine = NAF.utils.isMine(cmp.el);
            if (isMine) {
              const faceOrientation = this.getFaceOrientation().clone()
              faceOrientation.applyQuaternion(obj.quaternion) // put it into relative orientation not absolute/world orientation               
              const newPos = addVec3(origPosByEl.get(cmp.el), faceOrientation) // NOTE: faceOrientation is relative and is now applied to original position to yield final pos
              
              //const newPos = addVec3(origPosByEl.get(cmp.el), faceOrientation) // NOTE: faceOrientation is relative and is now applied to original position to yield final pos
              position.set(newPos.x, newPos.y, newPos.z);
              obj.matrixNeedsUpdate = true;
              // Normally this object being invisible would cause it not to get updated even though the matrixNeedsUpdate flag is set, force it
              obj.updateMatrixWorld(true, true);
              obj.updateMatrices();

              const networkedEl = networkedByComponent.get(cmp);
              if (networkedEl) {
                //const newPosNet = addVec3(networkedEl.getAttribute('position'), faceOrientation) // NOTE: faceOrientation is relative and is now applied to original position to yield final pos
                //networkedEl.setAttribute('position', vec3ToAttrString(newPosNet)); // IMPORTANT: This sets the entire body instead of head...so head is not networked
              }
            }
        } catch (e) { console.log(e) }  
      }
    }
  }
}

AFRAME.registerComponent("face-tracking", {
    schema: {
        isFaceBeingTracked: { type: "boolean", default: true }
      },

      async init() {
        await waitForDOMContentLoaded();
        this.playerInfo = findAncestorWithComponent(this.el, "player-info").components["player-info"];
      },

      play() {
        components.push(this);
        origPosByEl.set(this.el, {x:this.el.object3D.position.x, y:this.el.object3D.position.y, z:this.el.object3D.position.z})
        NAF.utils.getNetworkedEntity(this.el).then((networkedEl) => {
            networkedByComponent.set(this, networkedEl)
        });
      },

      pause() {
        components.splice(components.indexOf(this), 1);
      }
    }
);