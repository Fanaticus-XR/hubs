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
            document.body.append(canvas)
            const displaySize = { width: video.width, height: video.height }
            faceapi.matchDimensions(canvas, displaySize)
            setInterval(async () => {
                const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
                const resizedDetections = faceapi.resizeResults(detections, displaySize)
                canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
                faceapi.draw.drawDetections(canvas, resizedDetections)
                faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
                faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
            }, 100)
        });
        
        Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('/third-party-libs/face-api/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('/third-party-libs/face-api/models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('/third-party-libs/face-api/models'),
            faceapi.nets.faceExpressionNet.loadFromUri('/third-party-libs/face-api/models')
        ]).then(this._startVideo);
    }
    
    _startVideo() {
        const video = document.getElementById('facialTrackingVideoView');

        /*
        navigator.mediaDevices.getUserMedia(
            { video: {} },
            stream => video.srcObject = stream,
            err => console.error(err)
        )
        */

        if (navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
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