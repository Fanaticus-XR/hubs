import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Container } from "./react-components/layout/Container";

import { faceapi } from "./assets/third-party-libs/face-api/face-api"

// The following imports of face tracking files is where all the custom loading is for getting this file content available to the face-api in a hubs approved way (see also webpack.config.js)
import tinyFaceDetectorModelWeights from "../src/assets/third-party-libs/face-api/models/tiny_face_detector_model-weights_manifest.json";
import tinyFaceDetectorBin from "!!binary-loader!../src/assets/third-party-libs/face-api/models/tiny_face_detector_model-shard1.bin";

import faceLandmark86ModelWeights from "../src/assets/third-party-libs/face-api/models/face_landmark_68_model-weights_manifest.json";
import faceLandmark86Bin from "!!binary-loader!../src/assets/third-party-libs/face-api/models/face_landmark_68_model-shard1.bin";

export default class FacialTracking extends Component {
    faceTrackingSystem = void 0;
    
    constructor() {
        super();

        this.faceTrackingSystem = document.querySelector("a-scene").systems["hubs-systems"].faceTrackingSystem
        console.log('faceTrackingSystem: ' + this.faceTrackingSystem)
    }
    
    applySingleFaceDetection(detections) {
        this.faceTrackingSystem.addFaceDetections(detections)
    }

    async trackFace() {
        const video = document.getElementById('facialTrackingVideoView');
    
        video.addEventListener('play', () => {
            const canvas = faceapi.createCanvasFromMedia(video)
            video.parentElement.append(canvas)
            const displaySize = { width: video.width, height: video.height }
            faceapi.matchDimensions(canvas, displaySize)
            setInterval(async () => {
                const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks()
                this.applySingleFaceDetection(detections)
            }, 100)
        });
        
        const modelsLoc = '/hubs/assets/src/third-party-libs/face-api/models'; // IMPORTANT: This is not used and is only here to have something to pass in to existing functions below without having to do too much refactoring in their code
        Promise.all([
            // IMPORTANT: loadFromUri is a misnomer as it only loads from the provided uri *if* the arguments of the json and bin files are not provided, which as of now must be provided as the files are not available at those uris based on how hubs+webpack deploys and exposes stuff
            faceapi.nets.tinyFaceDetector.loadFromUri(modelsLoc, tinyFaceDetectorModelWeights, tinyFaceDetectorBin),
            faceapi.nets.faceLandmark68Net.loadFromUri(modelsLoc, faceLandmark86ModelWeights, faceLandmark86Bin)
        ]).then(this._startVideo);
    }
    
    _startVideo() {
        const video = document.getElementById('facialTrackingVideoView');
        if (navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true, video: { facingMode: "user" } })
              .then(function (stream) {
                video.srcObject = stream;
              })
              .catch(function (err0r) {
                console.log("Something went wrong!");
              });
        } else {
            console.log("getUserMedia is a NO GO!");
        }
    }

    componentDidMount() {
      this.trackFace()
    }

    render() {
        return (
          <Container>
            <video /*hidden*/ id="facialTrackingVideoView" width="720" height="560" autoPlay muted></video>
          </Container>
          )
    }
}
    
document.addEventListener("DOMContentLoaded", () => {
    ReactDOM.render(<FacialTracking />, document.getElementById("face-tracking"));
});
  