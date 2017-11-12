const cv = require('opencv');
const fs = require('fs');
const path = require('path');
const getCurvePoints = require('cardinal-spline-js').getCurvePoints;
const darknet = require('@moovel/yolo');


const IMAGE = process.argv[2];
const showNames = !!process.argv[3];
cv.readImage(IMAGE, (err, img) => {
  const grey = img.copy();
  //const regions = img.copy();
  const canvas = new cv.Matrix(img.height(), img.width(), cv.Constants.CV_8UC3, [255,255,255]);
  grey.convertGrayscale();
  const coarse = grey.copy();
  const fine = grey.copy();
  for (let i = 0; i < 5; i++) {
    coarse.gaussianBlur([7, 7]);
    coarse.dilate(4);
    coarse.erode(2);
  }
  coarse.canny(0, 50);
  coarse.dilate(5);
  coarse.save('./coarse.jpg');

  for (let i = 0; i < 5; i++) {
    fine.gaussianBlur([7, 7]);
    fine.dilate(3);
    fine.erode(3);
  }
  fine.canny(0, 50);
  fine.dilate(3);
  fine.save('./fine.jpg');

  //regions.gaussianBlur([51,51]);
  //regions.dilate(10);
  //grey.save('./filtered.jpg');
  //regions.canny(0, 50);
  //regions.save('./regions.jpg');

  //const colors = img.copy();
  //colors.cvtColor('CV_BGR2Lab');
  //colors.reshape([colors.width()*colors.height(), 3]);
  //cv.kmeans(colors, 4, [cv.TERM_CRITERIA_EPS + cv.TERM_CRITERIA_MAX_ITER, 10, 1.0], 10, cv.KMEANS_RANDOM_CENTERS);
  //const quant = clt.cluser_centers

  const contours = coarse.findContours();
  const faceContours = fine.findContours();

  darknet.detectImage({
    cfg: './cfg/yolo.cfg',
    weights: './yolo.weights',
    data: './cfg/coco.data',
    image: IMAGE,
    thresh: 0.5,
    hierThresh: 0.75
  }, (modified, original, detections, dimensions) => {
    img.detectObject(cv.FACE_CASCADE, {}, (err, faces) => {
      for (let i = 0; i < contours.size(); i++) {
        const rect = contours.boundingRect(i);
        const inObject = detections.some(detection => !(
          rect.x-rect.width/2 > (detection.x+detection.w/2)*canvas.width() || 
          rect.x+rect.width/2 < (detection.x-detection.w/2)*canvas.width() || 
          rect.y-rect.height/2 > (detection.y+detection.h/2)*canvas.height() ||
          rect.y+rect.height/2 < (detection.y-detection.h/2)*canvas.height()
        ));
        const inFace = faces.some(face => !(
          rect.x-rect.width/2 > face.x+face.width || 
          rect.x+rect.width/2 < face.x || 
          rect.y-rect.height/2 > face.y+face.height ||
          rect.y+rect.height/2 < face.y
        ));

        if (inFace && Math.random()>0.5) continue;
        if (!inObject && (Math.random()>0.2 || rect.width*rect.height < 50*50) || (Math.random()>0.2 && rect.width*rect.height < 20*20)) continue;

        const arcLength = contours.arcLength(i, true);
        contours.approxPolyDP(i, 0.02 * arcLength, true);
        const points = [];
        contours.points(i).forEach(point => points.push(point.x, point.y));
        const splinePoints = getCurvePoints(points.slice(0, Math.floor(points.length/4)*2), 1);
        drawLine(canvas, splinePoints, sampleColor(img, rect), 40);
        //canvas.rectangle([rect.x-rect.width/2, rect.y-rect.height/2], [rect.x+rect.width/2, rect.y+rect.height/2], [0, 255, 0], 1);
      }

      if (showNames) detections.forEach(detection => {
        if (detection.prob < 0.76) return;
        console.log(detection);
        //canvas.rectangle(
          //[canvas.width()*(detection.x-detection.w/2), canvas.height()*(detection.y-detection.h/2)],
          //[canvas.width()*(detection.x+detection.w/2), canvas.height()*(detection.y+detection.h/2)],
          //[0, 0, 255], 1
        //);
        canvas.putText(
          `"${detection.name}"`,
          detection.x*canvas.width(),
          (detection.y+detection.h*0.25)*canvas.height(),
          'HERSEY_PLAIN',
          [0,0,255],
          5,
          3 
        );
        canvas.line(
          [detection.x*canvas.width(), (detection.y+detection.h*0.2)*canvas.height()],
          [detection.x*canvas.width(), (detection.y+detection.h*0.1)*canvas.height()],
          [0,0,255],
          4
        );
        canvas.line(
          [detection.x*canvas.width(), (detection.y+detection.h*0.1)*canvas.height()],
          [detection.x*canvas.width()-15, (detection.y+detection.h*0.1)*canvas.height()+15],
          [0,0,255],
          4
        );
        canvas.line(
          [detection.x*canvas.width(), (detection.y+detection.h*0.1)*canvas.height()],
          [detection.x*canvas.width()+15, (detection.y+detection.h*0.1)*canvas.height()+15],
          [0,0,255],
          4
        );
      });

      faces.forEach(x =>
        canvas.ellipse(x.x + x.width/2, x.y + x.height/2, x.width/2, x.height/2, [0,0,0], 4)
      );

      for (let i = 0; i < faceContours.size(); i++) {
        const rect = faceContours.boundingRect(i);
        const inFace = faces.some(face => !(
          rect.x-rect.width/2 > face.x+face.width || 
          rect.x+rect.width/2 < face.x || 
          rect.y-rect.height/2 > face.y+face.height ||
          rect.y+rect.height/2 < face.y
        ));

        if (!inFace) continue;

        const arcLength = faceContours.arcLength(i, true);
        faceContours.approxPolyDP(i, 0.005 * arcLength, true);
        const points = [];
        faceContours.points(i).forEach(point => points.push(point.x, point.y));
        const splinePoints = getCurvePoints(points.slice(0, Math.floor(points.length/4)*2), 1);
        drawLine(canvas, splinePoints, [0,0,0], 4);
        //canvas.rectangle([rect.x-rect.width/2, rect.y-rect.height/2], [rect.x+rect.width/2, rect.y+rect.height/2], [0, 255, 0], 1);
      }
      canvas.save('./out.jpg');
    });
  });
});

function sampleColor(img, rect) {
  const color = [0, 0, 0];
  const samples = 4;
  for (let i = 0; i < samples; i++) {
    const x = Math.floor(rect.x - rect.width/2 + Math.random()*rect.width);
    const y = Math.floor(rect.y - rect.height/2 + Math.random()*rect.height);
    const sample = img.pixel(y, x);
    color[0] += sample[0];
    color[1] += sample[1];
    color[2] += sample[2];
  }
  return [Math.floor(color[0]/samples), Math.floor(color[1]/samples), Math.floor(color[2]/samples)];
}

function randomSide(detection) {
  const n = Math.random();
  if (n < 0.25) {
    return [detection.x, detection.y-detection.h/2];
  } else if (n < 0.5) {
    return [detection.x, detection.y+detection.h/2];
  } else if (n < 0.75) {
    return [detection.x-detection.w/2, detection.y];
  } else {
    return [detection.x+detection.w/2, detection.y];
  }
}

function drawLine(mat, points, color, thickness) {
  for (let j = 0; j < points.length/2-1; j++) {
    mat.line(
      [...points.slice(2*j, 2*(j+1))],
      [...points.slice(2*(j+1), 2*(j+2))],
      color,
      thickness
    );
  }
}
