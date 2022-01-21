import { findAncestorWithComponent } from "../utils/scene-graph";
import { waitForDOMContentLoaded } from "../utils/async-utils";

var InterpolationBuffer = require('buffered-interpolation');

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
  boxMin = {x: Number.MAX_VALUE, y: Number.MAX_VALUE}
  boxMax = {x: Number.MIN_VALUE, y: Number.MIN_VALUE}
  origPos = void 0
  myComponent = void 0
  myBuffer = void 0
  myBufferPosition = new THREE.Vector3()

  addFaceDetections(detections) {
    if (detections) {
      try {
        const box = detections.alignedRect.box
        if (box.x < this.boxMin.x) this.boxMin.x = box.x 
        if (box.y < this.boxMin.y) this.boxMin.y = box.y 
        if (box.x > this.boxMax.x) this.boxMax.x = box.x 
        if (box.y > this.boxMax.y) this.boxMax.y = box.y 
        
        const boxRange = subVec3(this.boxMax, this.boxMin)
        this.mostRecentDetections =  new THREE.Vector3( // put the values in the range of -maxRelativeMovement to maxRelativeMovement
          -(((box.x - this.boxMin.x) / boxRange.x) - 0.5) * 2 * maxRelativeMovement.x,
          -(((box.y - this.boxMin.y) / boxRange.y) - 0.5) * 2 * maxRelativeMovement.y, // have to negate Y since screen Y increases downward as scene Y increases upward
          0)

        if (this.myComponent) {
          if (!this.myBuffer) {
            this.myBuffer = { buffer: new InterpolationBuffer(InterpolationBuffer.MODE_LERP, 0.15), // NOTE: the face detection is running @ 10 Hz, so this ought to be just a little behind that for smoother outcome
              object3D: this.myComponent.el.object3D,
              componentNames: ['position'] };
          }
          this.myBuffer.buffer.setPosition(this.myBufferPosition.set(this.mostRecentDetections.x, this.mostRecentDetections.y, this.mostRecentDetections.z));
        }
      } catch (e) {
        this.mostRecentDetections =  void 0; // TODO remove this as it really doesn't make sense in the long run...final impl
      }
    }
  }

  // NOTE: this needs to be called in tick so the buffer gets updated with delta time (dt) in order to buffer interpolate
  getFaceOrientation(dt) {
    if (this.myBuffer) {
      let buffer = this.myBuffer.buffer
      buffer.update(dt)
      return buffer.getPosition()
    }
    return this.mostRecentDetections ? this.mostRecentDetections : vec3zero;
  }

  tick(dt) {
    for (let i = 0; i < components.length; i++) {
      const cmp = components[i];
      const obj = cmp.el.object3D;
      const { visible, position } = obj;
      const { isFaceBeingTracked } = cmp.data;
      if (isFaceBeingTracked) {
        try {
            const isMine = NAF.utils.isMine(cmp.el);
            if (isMine) {
              if (!this.myComponent) this.myComponent = cmp
              const faceOrientation = this.getFaceOrientation(dt).clone()
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