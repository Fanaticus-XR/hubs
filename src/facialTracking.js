import { Component } from "react";

var path = require("path");

export default class FacialTracking extends Component {
    constructor() {
        super();
    }
    
    start(faceapi) {
        const video = document.getElementById('facialTrackingVideoView');
    
        video.addEventListener('play', () => {
            const canvas = faceapi.createCanvasFromMedia(video)
            video.parentElement.append(canvas)
            const displaySize = { width: video.width, height: video.height }
            faceapi.matchDimensions(canvas, displaySize)
            setInterval(async () => {
//                const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
                const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks()
                //const resizedDetections = faceapi.resizeResults(detections, displaySize)
                canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
//                faceapi.draw.drawDetections(canvas, resizedDetections)
                faceapi.draw.drawFaceLandmarks(canvas, detections)
//                faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
            }, 100)
        });
        const modelsLoc = '/third-party-libs/face-api/models';

        

        Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(modelsLoc),
            faceapi.nets.faceLandmark68Net.loadFromUri(modelsLoc)
            //faceapi.nets.faceRecognitionNet.loadFromUri(modelsLoc),
            //faceapi.nets.faceExpressionNet.loadFromUri(modelsLoc)
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
            console.log("getUserMedia is a NO GO sir!");
        }
    }
}