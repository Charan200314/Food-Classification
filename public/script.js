const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const cameraView = document.getElementById('camera-view');
const previewView = document.getElementById('preview-view');

const snapBtn = document.getElementById('snap');
const retakeBtn = document.getElementById('retake');
const submitBtn = document.getElementById('submit');
const resultText = document.getElementById('result');

let model;

// Labels from COCO-SSD that are food-like
const foodLabels = [
  'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot',
  'hot dog', 'pizza', 'donut', 'cake', 'bottle', 'bowl', 'pineapple'
];

// Mapping labels to categories
const categoryMap = {
  "pizza": "appetizer",
  "hot dog": "appetizer",
  "sandwich": "appetizer",
  "donut": "dessert",
  "cake": "dessert",
  "banana": "fruit",
  "apple": "fruit",
  "orange": "fruit",
  "pineapple": "fruit",
  "carrot": "vegetable",
  "broccoli": "vegetable",
  "bowl": "rice item",
  "bottle": "beverage"
};

// Load COCO-SSD model
cocoSsd.load().then(loadedModel => {
  model = loadedModel;
  console.log("✅ COCO-SSD model loaded");
});

// Start camera
navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
  video.srcObject = stream;
});

// SNAP — capture frame
snapBtn.onclick = async () => {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  if (!model) {
    alert("Model is loading, please wait...");
    return;
  }

  const predictions = await model.detect(canvas);
  const foodItems = predictions.filter(pred => foodLabels.includes(pred.class));

  if (foodItems.length === 0) {
    alert("❌ No food detected. Please capture a clear image of food.");
    return;
  }

  cameraView.style.display = 'none';
  previewView.style.display = 'block';
};

// RETAKE — go back to camera
retakeBtn.onclick = () => {
  previewView.style.display = 'none';
  cameraView.style.display = 'block';
  resultText.innerText = '';
};

// SUBMIT — show food category
submitBtn.onclick = async () => {
  const predictions = await model.detect(canvas);
  const foodItems = predictions.filter(pred => foodLabels.includes(pred.class));

  if (foodItems.length > 0) {
    const firstItem = foodItems[0].class;
    
    const category = categoryMap[firstItem] || "unknown";
    resultText.innerText = `🍽️ Food Type: ${category}`;

    // Send image and category to backend
    canvas.toBlob(async blob => {
      const formData = new FormData();
      formData.append('image', blob, 'capture.jpg');
      formData.append('category', category);

      await fetch('http://localhost:5000/save', {
        method: 'POST',
        body: formData
      });
    }, 'image/jpeg');
  } else {
    resultText.innerText = "No food detected in image.";
  }
};
