// https://mediapipe.readthedocs.io/en/latest/solutions/hands.html

var dataset = [ 5, 10, 13, 19, 21, 25, 22, 18, 15, 13, 11, 12, 15, 20, 18, 17, 16, 18, 23, 25, 22, 18, 15, 18, 10 ];//

        
console.log(dataset.length);


 var gridMax = Math.sqrt(dataset.length);

 var content = d3.select("#helloworld");

 var xPos; var yPos; var zPos;

// we use d3's enter/update/exit pattern to draw and bind our dom elements
 var myBars = content.selectAll("a-box.bar")
               .data(dataset)
               .enter()
               .append("a-box")
               .classed("bar", true);
// we set attributes on our cubes to determine how they are rendered

 //var x = -dataset.length/2;
//var x = 1;
 var y = 1;
 var z = 1;
 var m = 0;

const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

// https://mediapipe.readthedocs.io/en/latest/solutions/hands.html
// Function onResults, camera and hands setup found in the documentaion for locating hands of user.
// X, Y, and Z are normalized and need to be transformed.
// https://github.com/google-ai-edge/mediapipe/issues/742
function onResults(results) {
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
    await hands.send({image: videoElement});
  },
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

