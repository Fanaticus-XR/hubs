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
export class FaceTrackingSystem {
  mostRecenteDetections = {}
  
  addFaceDetections(detections) {
    console.log('got eem: ' + detections)
    //this.mostRecenteDetections = detections // TODO add to a collection and correlate to the current timestamp
  }

  getFaceOrientation() {
     // TODO use past values in mostRecenteDetections collection and interpolate/extrapolate baesd on time
     return this.mostRecenteDetections ? this.mostRecenteDetections : {x:45, y: 23, z: 219};
  }

  tick() {
    for (let i = 0; i < components.length; i++) {
      const cmp = components[i];
      const obj = cmp.el.object3D;
      const { visible, rotation } = obj;
      const { isFaceBeingTracked } = cmp.data;
      if (isFaceBeingTracked) {
        try {
            const isMine = NAF.utils.isMine(cmp.el);
            if (isMine) {
                // TODO use webcam to get face orientation then derive the rotation and position to be set directly below
                const faceOrientation = this.getFaceOrientation()
                rotation.set(faceOrientation.x, faceOrientation.y, faceOrientation.z);
                
                obj.matrixNeedsUpdate = true;
                // Normally this object being invisible would cause it not to get updated even though the matrixNeedsUpdate flag is set, force it
                obj.updateMatrixWorld(true, true);
                obj.updateMatrices();
                try {
                    const networkedEl = networkedByComponent.get(cmp);
                    if (networkedEl) {
                        //console.log('about to manually set rotation on networkId: ' + networkedEl.data.networkId);
                        networkedEl.setAttribute('rotation', '45 23 219'); // IMPORTANT: This sets the entire body rotation it seems

                    }
                } catch (e) { console.log(e) }
            }
        } catch (e) { console.log(e) }  

        /* This was the first attempt at checking if the local player owned the entity associated with this component, but the above worked better
        if (cmp.playerInfo && cmp.playerInfo.isLocalPlayerInfo) { // NOTE: !visible is ~kinda an indicator as to isLocalPlayerInfo
            // TODO use webcam to get face orientation then derive the rotation and position to be set directly below
            rotation.set(45, 23, 219);
            
            obj.matrixNeedsUpdate = true;
            // Normally this object being invisible would cause it not to get updated even though the matrixNeedsUpdate flag is set, force it
            obj.updateMatrixWorld(true, true);
            obj.updateMatrices();
            try {
                console.log('set rotation' + obj.networked.data.networkId)
            } catch (e) { console.log(e) }
        }
        */
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
        NAF.utils.getNetworkedEntity(this.el).then((networkedEl) => {
            networkedByComponent.set(this, networkedEl)
        });
      },

      pause() {
        components.splice(components.indexOf(this), 1);
      }
    }
);