import { FilesetResolver, FaceLandmarker, PoseLandmarker } from '@mediapipe/tasks-vision';

// --- UI Elements ---
const uiLayer = document.getElementById('ui-layer');
const arLayer = document.getElementById('ar-layer');
const loadingOverlay = document.getElementById('loading-overlay');
const scannerFx = document.getElementById('scanner-fx');

const materialCards = document.querySelectorAll('.material-card');

// --- Global State ---
let userMaterial = null;
let chosenDemoOutfit = null; // e.g. 'trajedemoA1'
const demoOutfitsMap = {
  'algodon': ['trajedemoA1', 'trajedemoA2', 'trajedemoA3'],
  'lana': ['trajedemoL1', 'trajedemoL2', 'trajedemoL3'],
  'encaje': ['trajedemoE1', 'trajedemoE2', 'trajedemoE3']
};
let currentAvailableOutfits = [];

// Generic single-image textures for all other outfits
const genericTextures = {}; // e.g. { 'trajedemoA2': Image }

function getTextureForOutfit(outfitName) {
    if (outfitName === 'trajedemoA1') return null; // handled separately
    if (!genericTextures[outfitName]) {
        const img = new Image();
        img.src = `${import.meta.env.BASE_URL}${outfitName}/textura.png?cb=` + new Date().getTime();
        genericTextures[outfitName] = img;
    }
    return genericTextures[outfitName];
}

// Texture Images for trajedemoA1
const imgTorsoA1 = new Image();
imgTorsoA1.src = `${import.meta.env.BASE_URL}trajedemoA1/torsoDEMO1.png?cb=` + new Date().getTime();

const imgBrazoIzqA1 = new Image();
imgBrazoIzqA1.src = `${import.meta.env.BASE_URL}trajedemoA1/brazoderechoDEMO1.png?cb=` + new Date().getTime();

const imgBrazoDerA1 = new Image();
imgBrazoDerA1.src = `${import.meta.env.BASE_URL}trajedemoA1/brazoizquierdaDEMO1.png?cb=` + new Date().getTime();

const imgPiernaIzqA1 = new Image();
imgPiernaIzqA1.src = `${import.meta.env.BASE_URL}trajedemoA1/piernaderechaDEMO1.png?cb=` + new Date().getTime();

const imgPiernaDerA1 = new Image();
imgPiernaDerA1.src = `${import.meta.env.BASE_URL}trajedemoA1/piernaizquierdaDEMO1.png?cb=` + new Date().getTime();

// Define a map bridging limb names to their specific images
const partsMapA1 = {
    torso: imgTorsoA1,
    leftArm: imgBrazoIzqA1,
    rightArm: imgBrazoDerA1,
    leftLeg: imgPiernaIzqA1,
    rightLeg: imgPiernaDerA1
};

let videoElement = document.getElementById('webcam');
let canvasElement = document.getElementById('three-canvas'); // Re-using the ID but as a 2D Canvas
let ctx = canvasElement.getContext('2d');

// App Phases: UI -> SCANNING -> VTO
let currentPhase = 'UI'; 
let scanStartTime = 0;
// Extended scan duration
const SCAN_DURATION_MS = 7500;

// Colors mapping
const materialColors = {
  'lana': 'rgba(212, 212, 216, 0.8)',
  'encaje': 'rgba(15, 23, 42, 0.7)',
  'algodon_indigena': 'rgba(248, 250, 252, 0.9)',
  'algodon_afro': 'rgba(250, 204, 21, 0.9)', // example variant color
  'default': 'rgba(56, 189, 248, 0.8)'
};

// --- AI Models ---
let faceLandmarker = null;
let poseLandmarker = null;
let lastVideoTime = -1;

function resizeCanvas() {
  canvasElement.width = window.innerWidth;
  canvasElement.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);


// --- Setup MediaPipe ---
async function setupAI() {
  loadingOverlay.classList.remove('hidden');
  loadingOverlay.querySelector('p').innerText = "Cargando Motores de IA (MediaPipe)...";

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numFaces: 1
  });

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numPoses: 1
  });

  loadingOverlay.querySelector('p').innerText = "IA Lista. Solicitando cámara...";
  await startCamera();
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });
    videoElement.srcObject = stream;
    videoElement.addEventListener('loadeddata', () => {
      videoElement.play();
      loadingOverlay.classList.add('hidden');
      resizeCanvas();
      startScanningPhase();
    });
  } catch (error) {
    console.error("Camera access denied:", error);
    alert("Se requiere acceso a la cámara para la experiencia AR.");
    loadingOverlay.classList.add('hidden');
  }
}

// --- App Flow ---

// 1. UI Selection Box
document.getElementById('card-algodon').addEventListener('click', () => selectMaterial('algodon'));

document.getElementById('card-lana').addEventListener('click', () => selectMaterial('lana'));
document.getElementById('card-encaje').addEventListener('click', () => selectMaterial('encaje'));

function selectMaterial(mat) {
  userMaterial = mat;
  currentAvailableOutfits = demoOutfitsMap[userMaterial] || [];
  console.log("Material Seleccionado:", userMaterial, "Opciones:", currentAvailableOutfits);
  
  // Hide UI, Show AR layer
  uiLayer.style.opacity = 0;
  setTimeout(() => uiLayer.style.display = 'none', 1000);
  
  arLayer.classList.add('active');
  videoElement.style.display = 'block';

  // Kick off AI loading -> Camera -> Scanning
  setupAI();
}

// 2. Scanning Phase
function startScanningPhase() {
  currentPhase = 'SCANNING';
  scanStartTime = performance.now();
  scannerFx.classList.add('scanning');
  
  // Start render loop
  requestAnimationFrame(renderLoop);
}

// Main Render & Detection Loop
async function renderLoop() {
  if (!videoElement.videoWidth) {
    requestAnimationFrame(renderLoop);
    return;
  }

  let currentTimeMs = performance.now();
  
  if (lastVideoTime !== videoElement.currentTime) {
    lastVideoTime = videoElement.currentTime;
    
    // Clear canvas ONLY when we have a new frame to process
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Scale factors to map normalized coordinates to canvas
    // NOTE: The video is mirrored via CSS scaleX(-1). We must mirror the X coordinate here too.
    const w = canvasElement.width;
    const h = canvasElement.height;
    
    // Video dimension ratios to calculate actual drawn video size within object-fit: cover
    const videoRatio = videoElement.videoWidth / videoElement.videoHeight;
    const screenRatio = w / h;
    let drawW = w;
    let drawH = h;
    let offsetX = 0;
    let offsetY = 0;

    if (screenRatio > videoRatio) {
       // Screen is wider than video (e.g. landscape)
       drawH = w / videoRatio;
       offsetY = (h - drawH) / 2;
    } else {
       // Screen is taller than video (e.g. mobile portrait)
       drawW = h * videoRatio;
       offsetX = (w - drawW) / 2;
    }

    // Helper to map MediaPipe normalized coords to our Screen Canvas
    const mapPoint = (lm) => {
        // Mirror X because the video element is mirrored visually
        const mirroredX = 1.0 - lm.x; 
        return {
           x: offsetX + (mirroredX * drawW),
           y: offsetY + (lm.y * drawH)
        };
    };

    // --- PHASE: SCANNING (Face Filter + Randomizing) ---
    if (currentPhase === 'SCANNING' && faceLandmarker) {
      const faceResult = faceLandmarker.detectForVideo(videoElement, currentTimeMs);
      
      if (faceResult.faceLandmarks.length > 0) {
        const face = faceResult.faceLandmarks[0];
        
        // Draw Face Mask/Filter
        drawFaceMask(face, mapPoint);

        // Handle extended 6 seconds scan sequence
        const elapsed = currentTimeMs - scanStartTime;
        
        if (elapsed > SCAN_DURATION_MS) {
            // Sequence Finished, transition to VTO
            currentPhase = 'VTO';
            scannerFx.classList.remove('scanning');
            // Brief flash effect
            scannerFx.style.background = 'rgba(255, 255, 255, 0.4)';
            setTimeout(() => scannerFx.style.background = 'none', 300);
            
            // Show the VTO UI (Text & Button)
            showVtoUI();
        } else {
            // Draw scanning text
            const topOfHead = mapPoint(face[10]);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 26px Outfit';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 10;
            
            if (elapsed < 3000) {
               // Stage 1: Analyzing
               const analyzingTexts = ["Analizando complexión...", "Leyendo dimensiones...", "Buscando el mejor traje para ti..."];
               const txt = analyzingTexts[Math.floor((elapsed / 1000) % analyzingTexts.length)];
               ctx.fillText(txt, topOfHead.x, topOfHead.y - 60);
            } else if (elapsed < 4500) {
               // Stage 2: Quick switching names
               const txt = "Seleccionando: " + currentAvailableOutfits[Math.floor((elapsed / 150) % currentAvailableOutfits.length)];
               ctx.fillText(txt, topOfHead.x, topOfHead.y - 60);
            } else {
               // Stage 3: Chosen Outfit!
               if (!chosenDemoOutfit) {
                   chosenDemoOutfit = currentAvailableOutfits[Math.floor(Math.random() * currentAvailableOutfits.length)];
               }
               ctx.fillStyle = '#38bdf8'; // Highlight color
               ctx.fillText("¡Traje Seleccionado!", topOfHead.x, topOfHead.y - 90);
               ctx.font = 'bold 32px Outfit';
               ctx.fillStyle = '#fff';
               ctx.fillText(chosenDemoOutfit.toUpperCase(), topOfHead.x, topOfHead.y - 50);
            }
            ctx.shadowBlur = 0; // reset
        }
      }
    }

    // --- PHASE: VTO (Full Body Try-On) ---
    if (currentPhase === 'VTO' && poseLandmarker) {
      const poseResult = poseLandmarker.detectForVideo(videoElement, currentTimeMs);
      
      if (poseResult.landmarks.length > 0) {
        const pose = poseResult.landmarks[0];
        
        // Measurements derived from pose landmarks
        const lShoulder = mapPoint(pose[11]);
        const rShoulder = mapPoint(pose[12]);
        const lHip = mapPoint(pose[23]);
        const rHip = mapPoint(pose[24]);
        
        // Sometimes points are hidden or off-screen, check visibility
        if (pose[11].visibility > 0.5 && pose[12].visibility > 0.5 && pose[23].visibility > 0.5) {
            const shoulderW = Math.hypot(rShoulder.x - lShoulder.x, rShoulder.y - lShoulder.y);
            const torsoH = Math.hypot(
              (lHip.x + rHip.x)/2 - (lShoulder.x + rShoulder.x)/2,
              (lHip.y + rHip.y)/2 - (lShoulder.y + rShoulder.y)/2
            );
            
            const midShoulderX = (lShoulder.x + rShoulder.x) / 2;
            const midShoulderY = (lShoulder.y + rShoulder.y) / 2;
            const midHipX = (lHip.x + rHip.x) / 2;
            const midHipY = (lHip.y + rHip.y) / 2;

            // Body rotation angle
            const angle = Math.atan2(rShoulder.y - lShoulder.y, rShoulder.x - lShoulder.x);

            // Styling variables
            const pad = shoulderW * 0.15;
            const flare = 1.1; // Skirt/Pant flare
            // Fallbacks for color
            const fillStyle = materialColors[userMaterial] || materialColors['default'];
            const strokeStyle = "transparent";

            ctx.save();
            ctx.globalAlpha = 0.9;
            
            let genericTex = null;
            if (chosenDemoOutfit !== 'trajedemoA1') {
                genericTex = getTextureForOutfit(chosenDemoOutfit);
            }

            // Set up base material or image pattern
            if (chosenDemoOutfit === 'trajedemoA1') {
                if (imgTorsoA1.complete && imgTorsoA1.naturalWidth > 0) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.01)'; // Transparent base, image draws over it
                } else {
                    ctx.fillStyle = 'rgba(248, 250, 252, 0.9)'; // White fallback
                }
            } else if (genericTex && genericTex.complete && genericTex.naturalWidth > 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.01)';
            } else if (chosenDemoOutfit === 'trajedemoA2') { ctx.fillStyle = 'rgba(219, 234, 254, 0.9)'; }
            else if (chosenDemoOutfit === 'trajedemoA3') { ctx.fillStyle = 'rgba(254, 240, 138, 0.9)'; }
            else if (chosenDemoOutfit === 'trajedemoL1') { ctx.fillStyle = 'rgba(212, 212, 216, 0.95)'; }
            else if (chosenDemoOutfit === 'trajedemoL2') { ctx.fillStyle = 'rgba(253, 164, 175, 0.95)'; }
            else if (chosenDemoOutfit === 'trajedemoL3') { ctx.fillStyle = 'rgba(167, 139, 250, 0.95)'; }
            else if (chosenDemoOutfit === 'trajedemoE1') { ctx.fillStyle = 'rgba(15, 23, 42, 0.6)'; }
            else if (chosenDemoOutfit === 'trajedemoE2') { ctx.fillStyle = 'rgba(76, 29, 149, 0.6)'; }
            else if (chosenDemoOutfit === 'trajedemoE3') { ctx.fillStyle = 'rgba(131, 24, 67, 0.6)'; }
            else { ctx.fillStyle = fillStyle; }

            // === 1. TORSO & PELVIS (Combined shape) ===
            ctx.beginPath();
            
            // Shoulder coordinates with padding
                const slX = lShoulder.x - pad * Math.cos(angle);
            const slY = lShoulder.y - pad * Math.sin(angle);
            const srX = rShoulder.x + pad * Math.cos(angle);
            const srY = rShoulder.y + pad * Math.sin(angle);

            // Hip line with flare
            const hipW = Math.hypot(rHip.x - lHip.x, rHip.y - lHip.y);
            const hipAngle = Math.atan2(rHip.y - lHip.y, rHip.x - lHip.x);
            const hipPad = (shoulderW * flare - hipW) / 2;
            // Extend down past the hips for a tunic/dress look
            const dropY = 100;
            const pAngle = hipAngle + Math.PI/2; // Downwards vector
            
            const lHipDropX = lHip.x - hipPad * Math.cos(hipAngle) + Math.cos(pAngle) * dropY;
            const lHipDropY = lHip.y - hipPad * Math.sin(hipAngle) + Math.sin(pAngle) * dropY;
            const rHipDropX = rHip.x + hipPad * Math.cos(hipAngle) + Math.cos(pAngle) * dropY;
            const rHipDropY = rHip.y + hipPad * Math.sin(hipAngle) + Math.sin(pAngle) * dropY;

            // Neckline
            const neckY = midShoulderY - shoulderW * 0.08;
            const neckW = shoulderW * 0.18;

            ctx.moveTo(midShoulderX - neckW, neckY); // Start left neck
            // Left shoulder
            ctx.quadraticCurveTo(slX, slY - shoulderW * 0.05, slX, slY);
            // Left torso side, curving down to extended hip
            ctx.quadraticCurveTo(
              (slX + lHipDropX) / 2 - pad * 0.5, (slY + lHipDropY) / 2,
              lHipDropX, lHipDropY
            );
            // Bottom hem (straight or curved)
            ctx.quadraticCurveTo(midHipX, midHipY + dropY + 20, rHipDropX, rHipDropY);
            // Right torso side
            ctx.quadraticCurveTo(
              (srX + rHipDropX) / 2 + pad * 0.5, (srY + rHipDropY) / 2,
              srX, srY
            );
                ctx.quadraticCurveTo(srX, srY - shoulderW * 0.05, midShoulderX + neckW, neckY);
                // Neckline curve (scoop)
                ctx.quadraticCurveTo(midShoulderX, neckY + shoulderW * 0.1, midShoulderX - neckW, neckY);
                ctx.closePath();

            ctx.fill();
            
            // If custom mannequin texture, draw it over the clipped path
            if (chosenDemoOutfit === 'trajedemoA1' && imgTorsoA1.complete && imgTorsoA1.naturalWidth > 0) {
                ctx.save();
                ctx.clip(); // Clip to the torso path we just filled
                
                // Adjust Torso width to be closer to shoulder width
                const drawWidth = shoulderW * 2.5;
                const drawHeight = drawWidth * (imgTorsoA1.naturalHeight / imgTorsoA1.naturalWidth);
                
                // Center slightly below shoulders
                const cy = midShoulderY + (drawHeight * 0.1);
                ctx.drawImage(imgTorsoA1, midShoulderX - drawWidth/2, cy - drawHeight/2, drawWidth, drawHeight);
                ctx.restore();
            } else if (genericTex && genericTex.complete && genericTex.naturalWidth > 0) {
                ctx.save();
                ctx.clip(); // Clip to the torso path we just filled
                
                // For generic texture, we scale it to fit the torso width, but maybe zoom in slightly
                const drawWidth = shoulderW * 3.0;
                const drawHeight = drawWidth * (genericTex.naturalHeight / genericTex.naturalWidth);
                
                // Center slightly below shoulders
                const cy = midShoulderY + (drawHeight * 0.1);
                ctx.drawImage(genericTex, midShoulderX - drawWidth/2, cy - drawHeight/2, drawWidth, drawHeight);
                ctx.restore();
            }
            
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = 0;
            ctx.stroke();

            // === 2. ARMS & LEGS (Smooth curved sleeves/pants) ===
            const drawLimb = (joint1Idx, joint2Idx, baseWidth, partName, isLowerArm=false) => {
               if (!pose[joint1Idx] || !pose[joint2Idx] || pose[joint1Idx].visibility < 0.5 || pose[joint2Idx].visibility < 0.5) return;
               
               const j1 = mapPoint(pose[joint1Idx]);
               const j2 = mapPoint(pose[joint2Idx]);
               
               ctx.beginPath();
               // Perpendicular offset for width
               const dx = j2.x - j1.x;
               const dy = j2.y - j1.y;
               const len = Math.hypot(dx, dy) || 1;
               // make it tape off slightly towards the end
               const topW = baseWidth;
               const botW = baseWidth * 0.7;
               
               const nx = -dy / len;
               const ny = dx / len;

               ctx.moveTo(j1.x + nx * topW, j1.y + ny * topW);
               // Curve along the outside
               ctx.quadraticCurveTo(
                  (j1.x + j2.x) / 2 + nx * topW * 1.1,
                  (j1.y + j2.y) / 2 + ny * topW * 1.1,
                  j2.x + nx * botW,
                  j2.y + ny * botW
               );
               // Bottom hem
               ctx.lineTo(j2.x - nx * botW, j2.y - ny * botW);
               // Curve along inside
               ctx.quadraticCurveTo(
                  (j1.x + j2.x) / 2 - nx * topW * 1.1,
                  (j1.y + j2.y) / 2 - ny * topW * 1.1,
                  j1.x - nx * topW,
                  j1.y - ny * topW
               );
               ctx.closePath();
               
               ctx.fill();

               if (partName && chosenDemoOutfit === 'trajedemoA1') {
                    const imgPart = partsMapA1[partName];
                    if (imgPart && imgPart.complete && imgPart.naturalWidth > 0) {
                        ctx.save();
                        ctx.clip(); // Clip to the limb path
                        
                        // We use the length of the limb segment (len) instead of a fixed shoulder ratio
                        // to ensure the texture spans exactly the joint distance
                        let drawHeight = len * 1.2; // Slightly longer to cover overlaps
                        let drawWidth = drawHeight * (imgPart.naturalWidth / imgPart.naturalHeight); 
                        
                        // For the forearm, the user wants extreme zoom so it doesn't look like a duplicated shoulder
                        if(isLowerArm) {
                            drawWidth *= 4.0;
                            drawHeight *= 4.0;
                        }
                        
                        // Center point calculation for drawing
                        const mx = (j1.x + j2.x) / 2;
                        const my = (j1.y + j2.y) / 2;
                        
                        // We rotate the canvas to align the texture with the limb angle
                        ctx.translate(mx, my);
                        const limbAngle = Math.atan2(dy, dx);
                        // Add 90deg offset so the vertical sprite aligns with the limb
                        ctx.rotate(limbAngle - Math.PI/2); 

                        // Draw centered at the origin
                        ctx.drawImage(imgPart, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight);
                        
                        ctx.restore();
                    }
               } else if (genericTex && genericTex.complete && genericTex.naturalWidth > 0) {
                    ctx.save();
                    ctx.clip(); // Clip to the limb path
                    
                    // We use the length of the limb segment (len)
                    let drawHeight = len * 2.5; // Zoom in a bit more for generic textures on limbs
                    let drawWidth = drawHeight * (genericTex.naturalWidth / genericTex.naturalHeight); 
                    
                    if(isLowerArm) {
                        drawWidth *= 2.0;
                        drawHeight *= 2.0;
                    }
                    
                    // Center point calculation for drawing
                    const mx = (j1.x + j2.x) / 2;
                    const my = (j1.y + j2.y) / 2;
                    
                    // We rotate the canvas to align the texture with the limb angle
                    ctx.translate(mx, my);
                    const limbAngle = Math.atan2(dy, dx);
                    ctx.rotate(limbAngle - Math.PI/2); 

                    // Draw centered at the origin
                    ctx.drawImage(genericTex, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight);
                    
                    ctx.restore();
               }

               ctx.stroke();
            };

            const slvPuff = shoulderW * 0.15;
            const legThick = shoulderW * 0.2;

            // Left Arm
            drawLimb(11, 13, slvPuff, 'leftArm', false); // Upper Arm
            drawLimb(13, 15, slvPuff*0.8, 'leftArm', true); // Forearm (zoomed)
            // Right Arm
            drawLimb(12, 14, slvPuff, 'rightArm', false); // Upper Arm
            drawLimb(14, 16, slvPuff*0.8, 'rightArm', true); // Forearm (zoomed)

            // Left Leg (thigh to knee)
            drawLimb(23, 25, legThick, 'leftLeg', false); // Upper Leg (Bermuda)
            drawLimb(25, 27, legThick*0.8, null, false); // Lower Leg (No texture)
            // Right Leg
            drawLimb(24, 26, legThick, 'rightLeg', false); // Upper Leg (Bermuda)
            drawLimb(26, 28, legThick*0.8, null, false); // Lower Leg (No texture)

            ctx.restore();
        }
      }
    }
  }

  // Loop
  requestAnimationFrame(renderLoop);
}

// Function to draw an elaborate face mask during the scanning phase
function drawFaceMask(face, mapPoint) {
   // Key face landmarks to create a "tech mesh"
   // We will draw triangles/lines connecting these points to look like a 3D topology scan
   const meshPoints = [
       10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
       400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
       54, 103, 67, 109, // Outer oval
       
       // Inner points for depth
       151, // Top of nose
       9,   // Middle of nose
       8,   // Lower nose
       164, // Under nose
       14,  // Lower lip center
       13,  // Upper lip center
       
       // Eyes
       33, 133, // Left Eye bounds
       362, 263, // Right eye bounds
       
       // Cheeks
       50, 280, 205, 425
   ];
   
   // We'll draw lines from the nose bridge to the outer points to create a starburst/grid effect
   const centerNose = mapPoint(face[9]);

   ctx.save();
   
   // Draw glowing connections
   ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
   ctx.lineWidth = 1;
   
   for(let i=0; i<meshPoints.length; i++) {
        if(!face[meshPoints[i]]) continue;
        const p = mapPoint(face[meshPoints[i]]);
        
        // Connect to center nose for a wireframe look
        ctx.beginPath();
        ctx.moveTo(centerNose.x, centerNose.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        
        // Connect to the next point in the array to form the web/mesh
        if(i < meshPoints.length - 1 && face[meshPoints[i+1]]) {
            const nextP = mapPoint(face[meshPoints[i+1]]);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(nextP.x, nextP.y);
            ctx.stroke();
        }
   }

   // Draw dynamic scanning data points over the nodes
   ctx.fillStyle = "#38bdf8";
   ctx.shadowColor = '#38bdf8';
   ctx.shadowBlur = 8;
   
   const timeScan = performance.now();
   
   meshPoints.forEach((idx, i) => {
      if(!face[idx]) return;
      const p = mapPoint(face[idx]);
      
      // Make them pulse/twinkle over time
      const radius = 2 + Math.sin(timeScan / 200 + i) * 1.5;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, radius), 0, Math.PI*2);
      ctx.fill();
   });
   
   ctx.restore();
}

// --- VTO UI Overlay ---
function showVtoUI() {
    // Check if UI already exists
    if(document.getElementById('vto-ui-container')) return;

    const container = document.createElement('div');
    container.id = 'vto-ui-container';
    container.style.position = 'absolute';
    container.style.bottom = '40px';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.zIndex = '100';
    container.style.pointerEvents = 'auto';
    container.style.animation = 'fadeInUp 1s ease-out';

    const textLabel = document.createElement('div');
    textLabel.innerHTML = `¡Este es el indicado!<br><span style="font-size: 1.5rem; font-weight: 600; color: #38bdf8;">${chosenDemoOutfit.toUpperCase()}</span>`;
    textLabel.style.color = '#fff';
    textLabel.style.textAlign = 'center';
    textLabel.style.textShadow = '0 2px 10px rgba(0,0,0,0.8)';
    textLabel.style.marginBottom = '15px';
    textLabel.style.fontFamily = "'Outfit', sans-serif";

    const changeBtn = document.createElement('button');
    changeBtn.innerText = 'Cambiar Traje';
    changeBtn.style.padding = '12px 24px';
    changeBtn.style.borderRadius = '24px';
    changeBtn.style.border = '1px solid rgba(255,255,255,0.4)';
    changeBtn.style.background = 'rgba(15, 23, 42, 0.8)';
    changeBtn.style.color = '#fff';
    changeBtn.style.fontFamily = "'Outfit', sans-serif";
    changeBtn.style.fontSize = '1rem';
    changeBtn.style.backdropFilter = 'blur(10px)';
    changeBtn.style.cursor = 'pointer';

    changeBtn.addEventListener('click', () => {
        // Find next outfit in rotation
        let idx = currentAvailableOutfits.indexOf(chosenDemoOutfit);
        idx = (idx + 1) % currentAvailableOutfits.length;
        chosenDemoOutfit = currentAvailableOutfits[idx];
        
        // Update label
        textLabel.innerHTML = `Explorando opciones...<br><span style="font-size: 1.5rem; font-weight: 600; color: #38bdf8;">${chosenDemoOutfit.toUpperCase()}</span>`;
    });

    container.appendChild(textLabel);
    container.appendChild(changeBtn);
    arLayer.appendChild(container);
}
