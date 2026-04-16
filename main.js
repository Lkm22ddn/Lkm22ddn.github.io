// https://mediapipe.readthedocs.io/en/latest/solutions/hands.html
// https://gamedev.stackexchange.com/questions/122382/how-to-calculate-a-simple-swivel-rotation-no-physics-engine
var chart = d3.select("#chart");
console.log("OK");
// Reads data from csv. Data is unemployment through 2024 - 2025.
// Data is from https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/bulletins/jobsandvacanciesintheuk/february2026
d3.csv("./data.csv", function(data) {
  const percentages = data.map(row => (row.Thousands / 100)); // Divides by 100 to allow better scaling
  var gridMax = Math.sqrt(percentages.length); // Length of percentages array

  var chartBars = chart.selectAll("a-box.bar")
               .data(percentages)
               .enter()
               .append("a-box")
               .classed("bar", true)
               .attr({
  position: function(d,i) {
       x= i % gridMax;
       z= Math.floor(i/gridMax);
       y= d/4;
       m ++;
       return x + " " + y + " " + z;
       },
   height: function(d){return d/2;}, // Height is half to ensure they are aligned correctly at the bottom.
   color: function(d,i){ // Color function starts with green and descends into red. This gives the effect high values are green, low values are red.
    var greenBrightness = (255 - (i * 10));
    var redBrightness = (0 + (i * 40));
    var color =  "rgb(" + redBrightness + ", " + greenBrightness + ", 0)";
   
     return color;}
     
 });
})

const THREE = AFRAME.THREE;

var freezeChart = false;

var y = 1;
var z = 1;
var m = 0;

// MediaPipe setup
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

// Up value pointing up, -1 as the chart will show upside down if not.
// Alternative can use normal.negate() to flip the chart.
// Quaternions declaration
const up = new THREE.Vector3(0, -1, 0); 
const quat = new THREE.Quaternion(); // Used to hand to chart orientation
const upQuat = new THREE.Quaternion(); // Gesture used to snap upright
const spinQuat = new THREE.Quaternion(); // Gesture used to add Y-Axis rotation to upQuat

// https://mediapipe.readthedocs.io/en/latest/solutions/hands.html
// Function onResults, camera and hands setup found in the documentaion for locating hands of user.
// X, Y, and Z are normalized and need to be transformed.
// https://github.com/google-ai-edge/mediapipe/issues/742
function onResults(results) {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) { 

    const middleFinger = results.multiHandLandmarks[0][12];
    const wristLoc = results.multiHandLandmarks[0][0];
    const pinkyLoc = results.multiHandLandmarks[0][20];
    const thumbLoc = results.multiHandLandmarks[0][4];

    // Position of palm
    const palmLoc_X = (middleFinger.x + wristLoc.x) / 2;
    const palmLoc_Y = (middleFinger.y + wristLoc.y) / 2;
    const palmLoc_Z = (middleFinger.z + wristLoc.z) / 2;

    // // Three.js XYZ
    const threeWrist = new THREE.Vector3(wristLoc.x, 1 - wristLoc.y, 1 - wristLoc.z);
    const threePinky = new THREE.Vector3(pinkyLoc.x, 1 - pinkyLoc.y, 1 - pinkyLoc.z);
    const threeThumb = new THREE.Vector3(thumbLoc.x, 1 - thumbLoc.y, 1 - thumbLoc.z);
    const threeMiddle = new THREE.Vector3(middleFinger.x, 1 - middleFinger.y, 1 - middleFinger.z);

    // Rotation
    // https://www.reddit.com/r/askmath/comments/ps0hzf/finding_an_equation_of_a_plane_using_3_points/
    // https://stackoverflow.com/questions/25199173/how-to-find-rotation-matrix-between-two-vectors-in-three-js
    // https://stackoverflow.com/questions/61619752/how-to-find-rotation-matrix-between-two-sets-of-3d-points-in-three-js
    // First needed to gather the equation of the plane. By creating two vectors and then getting the normal position from them.
    const vector1 = new THREE.Vector3().subVectors(threePinky, threeWrist); // Subtraction
    const vector2 = new THREE.Vector3().subVectors(threeThumb, threeWrist); // Subtraction
    const normal = new THREE.Vector3().crossVectors(vector1, vector2); // Multiplication
    normal.normalize(); 

    // https://stackoverflow.com/questions/77050158/computing-quaternion-in-three-js-to-orient-object-to-target-direction-and-normal
    quat.setFromUnitVectors(up, normal);

    // https://dev.to/rachsmith/lerp-2mh7 Used to make the movement smoother
    const box = document.getElementById('anchor');
    const bars = document.querySelectorAll('.bar');
    if(!freezeChart){
      // Position offsets, altered to help look realistic when resting on palm.
      box.object3D.position.x += (((palmLoc_X - 0.5) * 2) - box.object3D.position.x) * 0.2;
      box.object3D.position.y += (((0.5 - palmLoc_Y) * 2) - box.object3D.position.y) * 0.2;
      box.object3D.position.z += (((palmLoc_Z - 1.25) * 2) - box.object3D.position.z) * 0.2;

      // Rotates with hand. Slerp makes the movement smooth, 0.1 sets the smoothness.
      box.object3D.quaternion.slerp(quat, 0.1);

      // https://aframe.io/docs/1.7.0/components/material.html
      // Above link used to understand how to change opacity in A-Frame
      // Used to reduce visiblity if the chart is behind the hand.
      if(normal.z > 0){
        bars.forEach(singleBar => { // Loops through all bars created
          singleBar.setAttribute('material', {opacity: 0.2, transparent: true});
        })
        
      } else 
        bars.forEach(singleBar => {
          singleBar.setAttribute('material', {opacity: 1, transparent: false});
        })


    }

    const closedGesture = new THREE.Vector3().subVectors(threeThumb, threeMiddle);
    const rotationValue = threeMiddle.y / 8
    // const savedPos = new THREE.Vector3(box.object3D.position.x, box.object3D.position.y, box.object3D.position.z);

    // https://stackoverflow.com/questions/30191963/rotate-object-around-the-world-axis
    // https://stackoverflow.com/questions/75679447/how-to-rotate-item-independently-on-each-axis-three-js
    upQuat.setFromUnitVectors(up, new THREE.Vector3(0, -1, 0)); // Sets chart to face up
    spinQuat.setFromAxisAngle(new THREE.Vector3(0, -1, 0), rotationValue); // Rotates Y-Axis

    if(closedGesture.length() < 0.2){
      freezeChart = true;
      box.object3D.quaternion.slerp(upQuat, 0.01); 
      box.object3D.quaternion.multiply(spinQuat); // Multipes the two quats
    
    } else {
      freezeChart = false;
    }
  }
}

// https://mediapipe.readthedocs.io/en/latest/solutions/hands.html
// MediaPipe setup
const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});
hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement}); },
  facingMode: 'environment',
  width: 1280,
  height: 720
});
camera.start();function onResults(results) {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) { // Used to draw TEMPORARY guidelines of the hand structures with connection points on joints.
    const palmLoc = results.multiHandLandmarks[0][9];
  
    const xPos = (palmLoc.x - 0.5) * 2;  
    const yPos = (0.5 - palmLoc.y) * 2; 
    const zPos = -palmLoc.z * 4 - 1.5;
    console.log(xPos, yPos, zPos);

    const box = document.getElementById('myBox');
    box.setAttribute('position', `${xPos} ${yPos} ${zPos}`);
   
  }
}



const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement}); },
  facingMode: 'environment',
  width: 1280,
  height: 720
});
 

camera.start();



myBars.attr({
  position: function(d,i) {
       x= i % gridMax;
       z= Math.floor(i/gridMax);
       y= d/4;
       m ++;
       console.log("Count: " + m + " - " + "x: " + x + " y: " + y + " z: " + z);
       return x + " " + y + " " + z;
       },
   height: function(d){return d/2;},
   width: function(d){return 0.9;},
   depth: function(d){return 0.9;},
  
   //radius: function(d){return 0.9/2;},
   color: function(d){
     var letters = '0123456789ABCDEF'.split('');
     var color = '#';
     for (var i = 0; i < 6; i++) {
         color += letters[Math.floor(Math.random() * 16)];
     }
     console.log(xPos);
     return color;}
     
 });

