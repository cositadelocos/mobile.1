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
const genericTextures = {}; // e.g. { 'trajedemoA3': Image }

function getTextureForOutfit(outfitName) {
    if (['trajedemoA1', 'trajedemoA2', 'trajedemoA3', 'trajedemoL1', 'trajedemoL2', 'trajedemoL3', 'trajedemoE1', 'trajedemoE2', 'trajedemoE3'].includes(outfitName)) return null; // handled separately
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

// Texture Images for trajedemoA2
const imgTorsoA2 = new Image();
imgTorsoA2.src = `${import.meta.env.BASE_URL}trajedemoA2/barequeracamisa.png?cb=` + new Date().getTime();

const imgFaldaA2 = new Image();
imgFaldaA2.src = `${import.meta.env.BASE_URL}trajedemoA2/barequerafalda.png?cb=` + new Date().getTime();

// Texture Images for trajedemoA3
const imgTorsoA3 = new Image();
imgTorsoA3.src = `${import.meta.env.BASE_URL}trajedemoA3/torsof.png?cb=` + new Date().getTime();

const imgBrazoIzqA3 = new Image();
imgBrazoIzqA3.src = `${import.meta.env.BASE_URL}trajedemoA3/brazoizquierdof.png?cb=` + new Date().getTime();

const imgBrazoDerA3 = new Image();
imgBrazoDerA3.src = `${import.meta.env.BASE_URL}trajedemoA3/brazoderechof.png?cb=` + new Date().getTime();

const imgPiernaIzqA3 = new Image();
imgPiernaIzqA3.src = `${import.meta.env.BASE_URL}trajedemoA3/piernaizquierdaf.png?cb=` + new Date().getTime();

const imgPiernaDerA3 = new Image();
imgPiernaDerA3.src = `${import.meta.env.BASE_URL}trajedemoA3/piernaderechaf.png?cb=` + new Date().getTime();

// Define a map bridging limb names to their specific images
const partsMapA3 = {
    torso: imgTorsoA3,
    leftArm: imgBrazoIzqA3,
    rightArm: imgBrazoDerA3,
    leftLeg: imgPiernaIzqA3,
    rightLeg: imgPiernaDerA3
};

// Texture Images for trajedemoL1
const imgTorsoL1 = new Image();
imgTorsoL1.src = `${import.meta.env.BASE_URL}trajedemoL1/ruana.png?cb=` + new Date().getTime();

const imgPiernaIzqL1 = new Image();
imgPiernaIzqL1.src = `${import.meta.env.BASE_URL}trajedemoL1/piernaderecha1.png?cb=` + new Date().getTime(); // Swapped correctly

const imgPiernaDerL1 = new Image();
imgPiernaDerL1.src = `${import.meta.env.BASE_URL}trajedemoL1/piernaizquierda1.png?cb=` + new Date().getTime(); // Swapped correctly

const partsMapL1 = {
    torso: imgTorsoL1,
    leftLeg: imgPiernaIzqL1,
    rightLeg: imgPiernaDerL1
};

// Texture Images for trajedemoL2
const imgTorsoL2 = new Image();
imgTorsoL2.src = `${import.meta.env.BASE_URL}trajedemoL2/torso2.png?cb=` + new Date().getTime();

const imgFaldaL2 = new Image();
imgFaldaL2.src = `${import.meta.env.BASE_URL}trajedemoL2/falda2.png?cb=` + new Date().getTime();

// Texture Images for trajedemoL3
const imgTorsoL3 = new Image();
imgTorsoL3.src = `${import.meta.env.BASE_URL}trajedemoL3/torsowayu.png?cb=` + new Date().getTime();

const imgFaldaL3 = new Image();
imgFaldaL3.src = `${import.meta.env.BASE_URL}trajedemoL3/faldawayu.png?cb=` + new Date().getTime();

// Texture Images for trajedemoE1
const imgTorsoE1 = new Image(); imgTorsoE1.src = `${import.meta.env.BASE_URL}trajedemoE1/torsog.png?cb=` + new Date().getTime();
const imgBrazoIzqE1 = new Image(); imgBrazoIzqE1.src = `${import.meta.env.BASE_URL}trajedemoE1/brazoizquierdog.png?cb=` + new Date().getTime(); // physically left arm
const imgBrazoDerE1 = new Image(); imgBrazoDerE1.src = `${import.meta.env.BASE_URL}trajedemoE1/brazoderechog.png?cb=` + new Date().getTime(); // physically right arm
const imgPiernaIzqE1 = new Image(); imgPiernaIzqE1.src = `${import.meta.env.BASE_URL}trajedemoE1/piernaizquierdag.png?cb=` + new Date().getTime(); // physically left leg
const imgPiernaDerE1 = new Image(); imgPiernaDerE1.src = `${import.meta.env.BASE_URL}trajedemoE1/piernaderechag.png?cb=` + new Date().getTime();

const partsMapE1 = { torso: imgTorsoE1, leftArm: imgBrazoIzqE1, rightArm: imgBrazoDerE1, leftLeg: imgPiernaIzqE1, rightLeg: imgPiernaDerE1 };

// Texture Images for trajedemoE2
const imgTorsoE2 = new Image(); imgTorsoE2.src = `${import.meta.env.BASE_URL}trajedemoE2/torsopopayan.png?cb=` + new Date().getTime();
const imgBrazoIzqE2 = new Image(); imgBrazoIzqE2.src = `${import.meta.env.BASE_URL}trajedemoE2/brazoizquierdopopayan.png?cb=` + new Date().getTime();
const imgBrazoDerE2 = new Image(); imgBrazoDerE2.src = `${import.meta.env.BASE_URL}trajedemoE2/brazoderechopopayan.png?cb=` + new Date().getTime();
const imgFaldaE2 = new Image(); imgFaldaE2.src = `${import.meta.env.BASE_URL}trajedemoE2/faldapopayan.png?cb=` + new Date().getTime();

const partsMapE2 = { torso: imgTorsoE2, leftArm: imgBrazoIzqE2, rightArm: imgBrazoDerE2 }; 

// Texture Images for trajedemoE3
const imgTorsoE3 = new Image(); imgTorsoE3.src = `${import.meta.env.BASE_URL}trajedemoE3/torsorosa.png?cb=` + new Date().getTime();
const imgBrazoIzqE3 = new Image(); imgBrazoIzqE3.src = `${import.meta.env.BASE_URL}trajedemoE3/brazoizquierdorosa.png?cb=` + new Date().getTime();
const imgBrazoDerE3 = new Image(); imgBrazoDerE3.src = `${import.meta.env.BASE_URL}trajedemoE3/brazoderechorosa.png?cb=` + new Date().getTime();
const imgFaldaE3 = new Image(); imgFaldaE3.src = `${import.meta.env.BASE_URL}trajedemoE3/faldarosa.png?cb=` + new Date().getTime();

const partsMapE3 = { torso: imgTorsoE3, leftArm: imgBrazoIzqE3, rightArm: imgBrazoDerE3 };

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
            if (['trajedemoA1', 'trajedemoA2', 'trajedemoA3', 'trajedemoL1', 'trajedemoL2', 'trajedemoL3', 'trajedemoE1', 'trajedemoE2', 'trajedemoE3'].includes(chosenDemoOutfit) === false) {
                genericTex = getTextureForOutfit(chosenDemoOutfit);
            }

            if (chosenDemoOutfit === 'trajedemoA1') {
                if (imgTorsoA1.complete && imgTorsoA1.naturalWidth > 0) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.01)'; // Transparent base, image draws over it
                } else {
                    ctx.fillStyle = 'rgba(248, 250, 252, 0.9)'; // White fallback
                }
            } else if (chosenDemoOutfit === 'trajedemoA3') {
                if (imgTorsoA3.complete && imgTorsoA3.naturalWidth > 0) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.01)'; 
                } else {
                    ctx.fillStyle = 'rgba(254, 240, 138, 0.9)'; 
                }
            } else if (chosenDemoOutfit === 'trajedemoL1') {
                if (typeof imgTorsoL1 !== 'undefined' && imgTorsoL1.complete && imgTorsoL1.naturalWidth > 0) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.01)'; 
                } else {
                    ctx.fillStyle = 'rgba(212, 212, 216, 0.95)'; 
                }
            } else if (chosenDemoOutfit === 'trajedemoL2') {
                if (typeof imgTorsoL2 !== 'undefined' && imgTorsoL2.complete && imgTorsoL2.naturalWidth > 0) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.01)'; 
                } else {
                    ctx.fillStyle = 'rgba(253, 164, 175, 0.95)'; 
                }
            } else if (chosenDemoOutfit === 'trajedemoL3') {
                if (typeof imgTorsoL3 !== 'undefined' && imgTorsoL3.complete && imgTorsoL3.naturalWidth > 0) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.01)'; 
                } else {
                    ctx.fillStyle = 'rgba(167, 139, 250, 0.95)'; 
                }
            } else if (chosenDemoOutfit === 'trajedemoE1') {
                if (typeof imgTorsoE1 !== 'undefined' && imgTorsoE1.complete && imgTorsoE1.naturalWidth > 0) ctx.fillStyle = 'rgba(255, 255, 255, 0.01)'; else ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
            } else if (chosenDemoOutfit === 'trajedemoE2') {
                if (typeof imgTorsoE2 !== 'undefined' && imgTorsoE2.complete && imgTorsoE2.naturalWidth > 0) ctx.fillStyle = 'rgba(255, 255, 255, 0.01)'; else ctx.fillStyle = 'rgba(76, 29, 149, 0.6)';
            } else if (chosenDemoOutfit === 'trajedemoE3') {
                if (typeof imgTorsoE3 !== 'undefined' && imgTorsoE3.complete && imgTorsoE3.naturalWidth > 0) ctx.fillStyle = 'rgba(255, 255, 255, 0.01)'; else ctx.fillStyle = 'rgba(252, 211, 77, 0.6)';
            } else if (genericTex && genericTex.complete && genericTex.naturalWidth > 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.01)';
            } else if (chosenDemoOutfit === 'trajedemoA2') { ctx.fillStyle = 'rgba(219, 234, 254, 0.9)'; }
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
            
            // (Torso overlay images have been moved to the end of the drawing sequence for proper layering)
            
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
               } else if (partName && chosenDemoOutfit === 'trajedemoA3') {
                    const imgPart = partsMapA3[partName];
                    if (imgPart && imgPart.complete && imgPart.naturalWidth > 0) {
                        ctx.save();
                        ctx.clip(); // Clip to the limb path
                        
                        // Increase scaling massively to account for user's full frame images
                        let drawHeight = len * 3.0; 
                        let drawWidth = drawHeight * (imgPart.naturalWidth / imgPart.naturalHeight); 
                        
                        if(isLowerArm) {
                            // Boost sizing specifically for lower segments to ensure visibility
                            drawWidth *= 2.5;
                            drawHeight *= 2.5;
                        }
                        
                        const mx = (j1.x + j2.x) / 2;
                        const my = (j1.y + j2.y) / 2;
                        
                        ctx.translate(mx, my);
                        const limbAngle = Math.atan2(dy, dx);
                        ctx.rotate(limbAngle - Math.PI/2); 

                        ctx.drawImage(imgPart, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight);
                        
                        ctx.restore();
                    }
               } else if (partName && chosenDemoOutfit === 'trajedemoL1') {
                    const imgPart = partsMapL1[partName];
                    if (imgPart && imgPart.complete && imgPart.naturalWidth > 0) {
                        ctx.save();
                        ctx.clip(); // Clip to the limb path
                        
                        let drawHeight = len * 1.5; 
                        let drawWidth = drawHeight * (imgPart.naturalWidth / imgPart.naturalHeight); 
                        
                        if(isLowerArm) {
                            // Zoom for "antepierna" as requested
                            drawWidth *= 4.0;
                            drawHeight *= 4.0;
                        }
                        
                        const mx = (j1.x + j2.x) / 2;
                        const my = (j1.y + j2.y) / 2;
                        
                        ctx.translate(mx, my);
                        const limbAngle = Math.atan2(dy, dx);
                        ctx.rotate(limbAngle - Math.PI/2); 

                        ctx.drawImage(imgPart, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight);
                        
                        ctx.restore();
                    }
               } else if (partName && ['trajedemoE1','trajedemoE2','trajedemoE3'].includes(chosenDemoOutfit)) {
                    const partsMap = chosenDemoOutfit === 'trajedemoE1' ? partsMapE1 : (chosenDemoOutfit === 'trajedemoE2' ? partsMapE2 : partsMapE3);
                    const imgPart = partsMap[partName];
                    if (imgPart && imgPart.complete && imgPart.naturalWidth > 0) {
                        ctx.save();
                        ctx.clip(); // Clip to the limb path
                        
                        let drawHeight = len * 2.0; 
                        let drawWidth = drawHeight * (imgPart.naturalWidth / imgPart.naturalHeight); 
                        
                        if(isLowerArm) {
                            drawWidth *= 4.0;
                            drawHeight *= 4.0;
                        }
                        
                        const mx = (j1.x + j2.x) / 2;
                        const my = (j1.y + j2.y) / 2;
                        
                        ctx.translate(mx, my);
                        const limbAngle = Math.atan2(dy, dx);
                        ctx.rotate(limbAngle - Math.PI/2); 

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

            if (['trajedemoA2', 'trajedemoL1', 'trajedemoL2', 'trajedemoL3'].includes(chosenDemoOutfit) === false) {
                // Left Arm
                drawLimb(11, 13, slvPuff, 'leftArm', false); // Upper Arm
                drawLimb(13, 15, slvPuff*0.8, 'leftArm', true); // Forearm
                // Right Arm
                drawLimb(12, 14, slvPuff, 'rightArm', false); // Upper Arm
                drawLimb(14, 16, slvPuff*0.8, 'rightArm', true); // Forearm
            } else {
                // For trajedemoA2, L1, L2, L3 we want a sleeveless look
                // So we do NOT render the arm sleeves.
            }

            // Grouping skirts correctly
            if (['trajedemoA2', 'trajedemoL2', 'trajedemoL3', 'trajedemoE2', 'trajedemoE3'].includes(chosenDemoOutfit)) {
                 if (chosenDemoOutfit === 'trajedemoA2' && imgFaldaA2 && imgFaldaA2.complete && imgFaldaA2.naturalWidth > 0) {
                      ctx.save();
                      
                      // Create a skirt path that bridges the gap between the two thighs
                      if (pose[23].visibility > 0.5 && pose[24].visibility > 0.5 && pose[25].visibility > 0.5 && pose[26].visibility > 0.5) {
                          const lKnee = mapPoint(pose[25]);
                          const rKnee = mapPoint(pose[26]);
                          
                          ctx.beginPath();
                          ctx.moveTo(lHip.x, lHip.y);
                          ctx.lineTo(rHip.x, rHip.y);
                          // Flare out slightly to the knees
                          ctx.lineTo(rKnee.x + legThick, rKnee.y);
                          ctx.lineTo(lKnee.x - legThick, lKnee.y);
                          ctx.closePath();
                          
                          ctx.fill();
                          ctx.clip();
                          
                          // Draw the barequera falda image
                          const drawWidth = shoulderW * 3.0; // wider skirt
                          const drawHeight = drawWidth * (imgFaldaA2.naturalHeight / imgFaldaA2.naturalWidth);
                          
                          // Align so the top of the skirt is at the hips
                          const cy = midHipY + (drawHeight * 0.2); // Shift it down
                          
                          ctx.drawImage(imgFaldaA2, midHipX - drawWidth/2, cy - drawHeight/2, drawWidth, drawHeight);
                      }
                      
                      ctx.restore();
                 } else if (chosenDemoOutfit === 'trajedemoL2' && typeof imgFaldaL2 !== 'undefined' && imgFaldaL2.complete && imgFaldaL2.naturalWidth > 0) {
                      ctx.save();
                      
                      // Create a skirt path that bridges the gap between the two thighs
                      if (pose[23].visibility > 0.5 && pose[24].visibility > 0.5 && pose[25].visibility > 0.5 && pose[26].visibility > 0.5) {
                          const lKnee = mapPoint(pose[25]);
                          const rKnee = mapPoint(pose[26]);
                          
                          ctx.beginPath();
                          ctx.moveTo(lHip.x, lHip.y);
                          ctx.lineTo(rHip.x, rHip.y);
                          ctx.lineTo(rKnee.x + legThick, rKnee.y);
                          ctx.lineTo(lKnee.x - legThick, lKnee.y);
                          ctx.closePath();
                          
                          ctx.fill();
                          ctx.clip();
                          
                          const drawWidth = shoulderW * 7.5; // Scaled up wider skirt
                          const drawHeight = drawWidth * (imgFaldaL2.naturalHeight / imgFaldaL2.naturalWidth);
                          
                          // Align so the top of the skirt is at the hips
                          const cy = midHipY + (drawHeight * 0.25); // Shift it down
                          
                          ctx.drawImage(imgFaldaL2, midHipX - drawWidth/2, cy - drawHeight/2, drawWidth, drawHeight);
                      }
                      
                      ctx.restore();
                 } else if (chosenDemoOutfit === 'trajedemoL3' && typeof imgFaldaL3 !== 'undefined' && imgFaldaL3.complete && imgFaldaL3.naturalWidth > 0) {
                      ctx.save();
                      
                      // Create a skirt path that bridges the gap between the two thighs
                      if (pose[23].visibility > 0.5 && pose[24].visibility > 0.5 && pose[25].visibility > 0.5 && pose[26].visibility > 0.5) {
                          const lKnee = mapPoint(pose[25]);
                          const rKnee = mapPoint(pose[26]);
                          
                          ctx.beginPath();
                          ctx.moveTo(lHip.x, lHip.y);
                          ctx.lineTo(rHip.x, rHip.y);
                          ctx.lineTo(rKnee.x + legThick, rKnee.y);
                          ctx.lineTo(lKnee.x - legThick, lKnee.y);
                          ctx.closePath();
                          
                          ctx.fill();
                          ctx.clip();
                          
                          const drawWidth = shoulderW * 7.5; // Scaled up wider skirt
                          const drawHeight = drawWidth * (imgFaldaL3.naturalHeight / imgFaldaL3.naturalWidth);
                          
                          // Align so the top of the skirt is at the hips
                          const cy = midHipY + (drawHeight * 0.25); // Shift it down
                          
                          ctx.drawImage(imgFaldaL3, midHipX - drawWidth/2, cy - drawHeight/2, drawWidth, drawHeight);
                      }
                      
                      ctx.restore();
                 } else if (['trajedemoE2', 'trajedemoE3'].includes(chosenDemoOutfit)) {
                      let imgFalda = chosenDemoOutfit === 'trajedemoE2' ? imgFaldaE2 : imgFaldaE3;
                      if (typeof imgFalda !== 'undefined' && imgFalda.complete && imgFalda.naturalWidth > 0) {
                          ctx.save();
                          if (pose[23].visibility > 0.5 && pose[24].visibility > 0.5 && pose[25].visibility > 0.5 && pose[26].visibility > 0.5) {
                              const lKnee = mapPoint(pose[25]);
                              const rKnee = mapPoint(pose[26]);
                              ctx.beginPath();
                              ctx.moveTo(lHip.x, lHip.y);
                              ctx.lineTo(rHip.x, rHip.y);
                              ctx.lineTo(rKnee.x + legThick, rKnee.y);
                              ctx.lineTo(lKnee.x - legThick, lKnee.y);
                              ctx.closePath();
                              ctx.fill();
                              ctx.clip();
                              
                              const drawWidth = shoulderW * 6.5; // Custom skirt width for E sets
                              const drawHeight = drawWidth * (imgFalda.naturalHeight / imgFalda.naturalWidth);
                              const cy = midHipY + (drawHeight * 0.25); 
                              ctx.drawImage(imgFalda, midHipX - drawWidth/2, cy - drawHeight/2, drawWidth, drawHeight);
                          }
                          ctx.restore();
                      }
                 }
            } else {
                // Standard individual pant legs
                // Left Leg (thigh to knee)
                drawLimb(23, 25, legThick, 'leftLeg', false); // Upper Leg (Bermuda)
                if (chosenDemoOutfit !== 'trajedemoA1' && chosenDemoOutfit !== 'trajedemoE1') {
                    drawLimb(25, 27, legThick*0.8, 'leftLeg', true); // Lower Leg
                }
                // Right Leg
                drawLimb(24, 26, legThick, 'rightLeg', false); // Upper Leg (Bermuda)
                if (chosenDemoOutfit !== 'trajedemoA1' && chosenDemoOutfit !== 'trajedemoE1') {
                    drawLimb(26, 28, legThick*0.8, 'rightLeg', true); // Lower Leg
                }
            }

            // === 3. TORSO OVERLAY (Layering fix) ===
            // Reconstruct path for clipping Torso over everything else (legs/skirts)
            ctx.beginPath();
            ctx.moveTo(midShoulderX - neckW, neckY); 
            ctx.quadraticCurveTo(slX, slY - shoulderW * 0.05, slX, slY);
            ctx.quadraticCurveTo((slX + lHipDropX) / 2 - pad * 0.5, (slY + lHipDropY) / 2, lHipDropX, lHipDropY);
            ctx.quadraticCurveTo(midHipX, midHipY + pad, rHipDropX, rHipDropY);
            ctx.quadraticCurveTo((srX + rHipDropX) / 2 + pad * 0.5, (srY + rHipDropY) / 2, srX, srY);
            ctx.quadraticCurveTo(srX, srY - shoulderW * 0.05, midShoulderX + neckW, neckY);
            ctx.quadraticCurveTo(midShoulderX, neckY + shoulderW * 0.05, midShoulderX - neckW, neckY);
            ctx.closePath();

            // Draw torso textures
            if (chosenDemoOutfit === 'trajedemoA1' && imgTorsoA1.complete && imgTorsoA1.naturalWidth > 0) {
                ctx.save();
                ctx.clip(); 
                const drawWidth = shoulderW * 2.5;
                const drawHeight = drawWidth * (imgTorsoA1.naturalHeight / imgTorsoA1.naturalWidth);
                const cy = midShoulderY + (drawHeight * 0.1);
                ctx.drawImage(imgTorsoA1, midShoulderX - drawWidth/2, cy - drawHeight/2, drawWidth, drawHeight);
                ctx.restore();
            } else if (chosenDemoOutfit === 'trajedemoA3' && imgTorsoA3.complete && imgTorsoA3.naturalWidth > 0) {
                ctx.save();
                ctx.clip(); 
                const drawWidth = shoulderW * 2.5; 
                const drawHeight = drawWidth * (imgTorsoA3.naturalHeight / imgTorsoA3.naturalWidth);
                const cy = midShoulderY + (drawHeight * 0.1);
                ctx.drawImage(imgTorsoA3, midShoulderX - drawWidth/2, cy - drawHeight/2, drawWidth, drawHeight);
                ctx.restore();
            } else if (chosenDemoOutfit === 'trajedemoL1' && typeof imgTorsoL1 !== 'undefined' && imgTorsoL1.complete && imgTorsoL1.naturalWidth > 0) {
                ctx.save();
                ctx.clip(); 
                const drawWidth = shoulderW * 3.5; 
                const drawHeight = drawWidth * (imgTorsoL1.naturalHeight / imgTorsoL1.naturalWidth);
                const cy = midShoulderY + (drawHeight * 0.15);
                ctx.drawImage(imgTorsoL1, midShoulderX - drawWidth/2, cy - drawHeight/2, drawWidth, drawHeight);
                ctx.restore();
            } else if (chosenDemoOutfit === 'trajedemoL2' && typeof imgTorsoL2 !== 'undefined' && imgTorsoL2.complete && imgTorsoL2.naturalWidth > 0) {
                ctx.save();
                ctx.clip(); 
                const drawWidth = shoulderW * 2.8; 
                const drawHeight = drawWidth * (imgTorsoL2.naturalHeight / imgTorsoL2.naturalWidth);
                const cy = midShoulderY + (drawHeight * 0.1);
                ctx.drawImage(imgTorsoL2, midShoulderX - drawWidth/2, cy - drawHeight/2, drawWidth, drawHeight);
                ctx.restore();
            } else if (chosenDemoOutfit === 'trajedemoL3' && typeof imgTorsoL3 !== 'undefined' && imgTorsoL3.complete && imgTorsoL3.naturalWidth > 0) {
                ctx.save();
                ctx.clip(); 
                const drawWidth = shoulderW * 2.8; 
                const drawHeight = drawWidth * (imgTorsoL3.naturalHeight / imgTorsoL3.naturalWidth);
                const cy = midShoulderY + (drawHeight * 0.1);
                ctx.drawImage(imgTorsoL3, midShoulderX - drawWidth/2, cy - drawHeight/2, drawWidth, drawHeight);
                ctx.restore();
            } else if (chosenDemoOutfit === 'trajedemoE1' && typeof imgTorsoE1 !== 'undefined' && imgTorsoE1.complete && imgTorsoE1.naturalWidth > 0) {
                ctx.save();
                ctx.clip(); 
                const drawWidth = shoulderW * 2.5; 
                const drawHeight = drawWidth * (imgTorsoE1.naturalHeight / imgTorsoE1.naturalWidth);
                const cy = midShoulderY + (drawHeight * 0.1);
                ctx.drawImage(imgTorsoE1, midShoulderX - drawWidth/2, cy - drawHeight/2, drawWidth, drawHeight);
                ctx.restore();
            } else if (chosenDemoOutfit === 'trajedemoE2' && typeof imgTorsoE2 !== 'undefined' && imgTorsoE2.complete && imgTorsoE2.naturalWidth > 0) {
                ctx.save();
                ctx.clip(); 
                const drawWidth = shoulderW * 2.0; 
                const drawHeight = drawWidth * (imgTorsoE2.naturalHeight / imgTorsoE2.naturalWidth);
                const cy = midShoulderY + (drawHeight * 0.05);
                ctx.drawImage(imgTorsoE2, midShoulderX - drawWidth/2, cy - drawHeight/2, drawWidth, drawHeight);
                ctx.restore();
            } else if (chosenDemoOutfit === 'trajedemoE3' && typeof imgTorsoE3 !== 'undefined' && imgTorsoE3.complete && imgTorsoE3.naturalWidth > 0) {
                ctx.save();
                ctx.clip(); 
                const drawWidth = shoulderW * 2.0; 
                const drawHeight = drawWidth * (imgTorsoE3.naturalHeight / imgTorsoE3.naturalWidth);
                const cy = midShoulderY + (drawHeight * 0.05);
                ctx.drawImage(imgTorsoE3, midShoulderX - drawWidth/2, cy - drawHeight/2, drawWidth, drawHeight);
                ctx.restore();
            } else if (chosenDemoOutfit === 'trajedemoA2' && imgTorsoA2.complete && imgTorsoA2.naturalWidth > 0) {
                ctx.save();
                ctx.clip(); 
                const drawWidth = shoulderW * 3.0;
                const sWidth = imgTorsoA2.naturalWidth;
                const sHeight = imgTorsoA2.naturalHeight;
                const drawHeight = drawWidth * (sHeight / sWidth);
                const cy = midShoulderY + (drawHeight * 0.1);
                ctx.drawImage(imgTorsoA2, midShoulderX - drawWidth/2, cy - drawHeight/2, drawWidth, drawHeight);
                ctx.restore();
            } else if (genericTex && genericTex.complete && genericTex.naturalWidth > 0) {
                ctx.save();
                ctx.clip(); 
                const drawWidth = shoulderW * 3.0;
                const drawHeight = drawWidth * (genericTex.naturalHeight / genericTex.naturalWidth);
                const cy = midShoulderY + (drawHeight * 0.1);
                ctx.drawImage(genericTex, midShoulderX - drawWidth/2, cy - drawHeight/2, drawWidth, drawHeight);
                ctx.restore();
            }

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

    const outfitNames = {
        'trajedemoA1': 'Traje Negro (Siglo XVI)',
        'trajedemoA2': 'Barequera río Guadalupe',
        'trajedemoA3': 'Antonio Villavicencio',
        'trajedemoL1': 'Ruana boyacense',
        'trajedemoL2': 'Misak hombre',
        'trajedemoL3': 'Misak mujer',
        'trajedemoE1': 'Traje gris satinado siglo XVII',
        'trajedemoE2': 'Ñapanga de Popayán',
        'trajedemoE3': 'Mochuelana de San Gil'
    };

    const getDisplayName = (id) => outfitNames[id] || id.replace('trajedemo', 'Traje ').toUpperCase();

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
    textLabel.innerHTML = `¡Este es el indicado!<br><span style="font-size: 1.5rem; font-weight: 600; color: #38bdf8;">${getDisplayName(chosenDemoOutfit)}</span>`;
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
        textLabel.innerHTML = `Explorando opciones...<br><span style="font-size: 1.5rem; font-weight: 600; color: #38bdf8;">${getDisplayName(chosenDemoOutfit)}</span>`;
    });

    container.appendChild(textLabel);
    container.appendChild(changeBtn);
    arLayer.appendChild(container);

    // Subtle Home Button
    const homeBtn = document.createElement('button');
    homeBtn.innerHTML = '&#8962; Inicio'; 
    homeBtn.style.position = 'absolute';
    homeBtn.style.top = '24px';
    homeBtn.style.left = '24px';
    homeBtn.style.padding = '8px 16px';
    homeBtn.style.background = 'rgba(15, 23, 42, 0.4)';
    homeBtn.style.border = '1px solid rgba(255,255,255,0.2)';
    homeBtn.style.color = '#fff';
    homeBtn.style.borderRadius = '20px';
    homeBtn.style.backdropFilter = 'blur(8px)';
    homeBtn.style.cursor = 'pointer';
    homeBtn.style.fontFamily = "'Outfit', sans-serif";
    homeBtn.style.fontSize = '0.9rem';
    homeBtn.style.zIndex = '101';
    
    homeBtn.addEventListener('click', () => {
        window.location.reload(); 
    });

    arLayer.appendChild(homeBtn);
}
