import React, { useState, useRef, useEffect } from "react";
import * as faceapi from "face-api.js";
import "./styles/FaceDetection.css";

const FaceDetection = () => {
	const [result, setResult] = useState("Please wait...");
	const videoRef = useRef();
	const canvasRef = useRef();
	const useTiny = true;
	const minConfidence = 0.6;

	useEffect(() => {
		const loadModels = async () => {
			const url = process.env.PUBLIC_URL + "/models";
			await faceapi.loadTinyFaceDetectorModel(url);
			await faceapi.loadFaceLandmarkTinyModel(url);
			await faceapi.loadFaceExpressionModel(url);
			await faceapi.loadFaceRecognitionModel(url);
			console.log("Models loaded");
		};
		loadModels();
		getVideo();
	}, []);

	const dimensions = {
		width: 600,
		height: 400,
	};

	const getVideo = () => {
		navigator.mediaDevices
			.getUserMedia({ video: dimensions })
			.then((stream) => {
				videoRef.current.srcObject = stream;
			})
			.catch((err) => {
				console.error("error:", err);
			});
	};

	const detect = async () => {
		const refFace = await loadLabeledImages();
		const faceMatcher = new faceapi.FaceMatcher(refFace, minConfidence);

		setInterval(async () => {
			const detection = await faceapi
				.detectSingleFace(
					videoRef.current,
					new faceapi.TinyFaceDetectorOptions()
				)
				.withFaceLandmarks(useTiny)
				.withFaceExpressions()
				.withFaceDescriptor();

			if (detection) {
				const resizedDetections = faceapi.resizeResults(
					detection,
					dimensions
				);
				const result = faceMatcher.findBestMatch(
					resizedDetections.descriptor
				);
				setResult(result.toString());
				console.log(result);
			}
		}, 2000);
	};

	function loadLabeledImages() {
		const labels = ["masud"];

		return Promise.all(
			labels.map(async (label) => {
				const descriptions = [];
				for (let i = 1; i < 3; i++) {
					let loc = `../images/${label}/${i}.jpg`;
					const img = await faceapi.fetchImage(loc);
					const detections = await faceapi
						.detectSingleFace(
							img,
							new faceapi.TinyFaceDetectorOptions()
						)
						.withFaceLandmarks(useTiny)
						.withFaceExpressions()
						.withFaceDescriptor();

					if (detections) {
						descriptions.push(detections.descriptor);
					}
				}
				return new faceapi.LabeledFaceDescriptors(label, descriptions);
			})
		);
	}

	return (
		<div className="mainDiv">
			<div className="detection">
				<video autoPlay muted ref={videoRef} onPlay={detect} />
				<canvas ref={canvasRef} />
			</div>
			<div className="result">
				<h2>Matching Result</h2>
				<div>{result}</div>
			</div>
			<div className="author">
				By <b>Md. Masud Mazumder</b>{" "}
				<a href="https://github.com/masud70">@GitHub</a>
			</div>
		</div>
	);
};

export default FaceDetection;
