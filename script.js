let videoElement = document.getElementById('videoElement');
let currentFilter = 'none';
let currentFrame = 'none';
let stream = null;
let currentMode = 'single';
let stripPhotos = [];
let stripCount = 0;
let countdownInterval;

async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false
        });

        videoElement.srcObject = stream;

        document.getElementById('startSection').classList.add('hidden');
        document.getElementById('cameraSection').classList.remove('hidden');
    } catch (error) {
        alert('Cannot access the camera. Please ensure you grant camera permissions.');
        console.error('Error accessing camera:', error);
    }
}

function setMode(mode) {
    currentMode = mode;

    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.mode-btn[onclick*="setMode('${mode}')"]`).classList.add('active');

    stripPhotos = [];
    stripCount = 0;

    const progressContainer = document.getElementById('progressContainer');
    const photoResults = document.getElementById('photoResults');

    if (mode === 'strip') {
        progressContainer.classList.remove('hidden');
        photoResults.classList.add('hidden');
        updateStripStatus();
    } else {
        progressContainer.classList.add('hidden');
        photoResults.classList.add('hidden');
    }
}

function updateStripStatus() {
    const status = document.getElementById('stripStatus');
    const progress = document.getElementById('progressFill');

    if (stripCount < 4) {
        status.textContent = `Ready for photo ${stripCount + 1}/4`;
        progress.style.width = `${(stripCount / 4) * 100}%`;
    } else {
        status.textContent = 'Photo strip complete!';
        progress.style.width = '100%';
    }
}

function showCountdown(callback) {
    const countdownEl = document.getElementById('countdown');
    let count = 3;

    function updateCountdown() {
        if (count > 0) {
            countdownEl.textContent = count;
            countdownEl.classList.add('active');

            setTimeout(() => {
                countdownEl.classList.remove('active');
                count--;
                setTimeout(updateCountdown, 1000);
            }, 1000);
        } else {
            countdownEl.textContent = 'SMILE!';
            countdownEl.classList.add('active');

            setTimeout(() => {
                countdownEl.classList.remove('active');
                callback();
            }, 500);
        }
    }

    updateCountdown();
}

function setFilter(filterType) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));

    document.querySelector(`.filter-btn[onclick*="setFilter('${filterType}')"]`).classList.add('active');

    videoElement.className = '';
    if (filterType !== 'none') {
        videoElement.classList.add('filter-' + filterType);
    }

    currentFilter = filterType;
}

function setFrame(frameType) {
    document.querySelectorAll('.frame-btn').forEach(btn => btn.classList.remove('active'));

    document.querySelector(`.frame-btn[onclick*="setFrame('${frameType}')"]`).classList.add('active');

    const frameOverlay = document.getElementById('frameOverlay');
    frameOverlay.className = 'frame-overlay';

    if (frameType !== 'none') {
        frameOverlay.classList.add(frameType);
    }

    currentFrame = frameType;
}

function capturePhoto() {
    if (currentMode === 'strip') {
        if (stripCount < 4) {
            showCountdown(() => {
                takeStripPhoto();
            });
        }
    } else {
        showCountdown(() => {
            takeSinglePhoto();
        });
    }
}

function takeSinglePhoto() {
    const flash = document.getElementById('flash');
    flash.classList.add('active');
    setTimeout(() => {
        flash.classList.remove('active');
    }, 100);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    if (currentFilter !== 'none') {
        ctx.filter = getCanvasFilter(currentFilter);
    }

    ctx.scale(-1, 1);
    ctx.drawImage(videoElement, -canvas.width, 0, canvas.width, canvas.height);
    ctx.scale(-1, 1);

    if (currentFrame !== 'none') {
        drawFrame(ctx, canvas.width, canvas.height, currentFrame);
    }

    canvas.toBlob(function (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `photobooth-${new Date().getTime()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    }, 'image/png');
}

function takeStripPhoto() {
    const flash = document.getElementById('flash');
    flash.classList.add('active');
    setTimeout(() => {
        flash.classList.remove('active');
    }, 100);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    if (currentFilter !== 'none') {
        ctx.filter = getCanvasFilter(currentFilter);
    }

    ctx.scale(-1, 1);
    ctx.drawImage(videoElement, -canvas.width, 0, canvas.width, canvas.height);
    ctx.scale(-1, 1);

    if (currentFrame !== 'none') {
        drawFrame(ctx, canvas.width, canvas.height, currentFrame);
    }

    const photoDataUrl = canvas.toDataURL('image/png');
    stripPhotos.push(photoDataUrl);
    stripCount++;

    updateStripStatus();

    if (stripCount === 4) {
        displayStripPhotos();
    } else {
        setTimeout(() => {
            capturePhoto();
        }, 500);
    }
}

function displayStripPhotos() {
    const photoContainer = document.getElementById('photoContainer');
    photoContainer.innerHTML = '';

    const stripContainer = document.createElement('div');
    stripContainer.classList.add('photo-strip-container');

    const strip = document.createElement('div');
    strip.classList.add('photo-strip');

    stripPhotos.forEach(photo => {
        const img = document.createElement('img');
        img.src = photo;
        img.classList.add('strip-photo');
        strip.appendChild(img);
    });

    stripContainer.appendChild(strip);
    photoContainer.appendChild(stripContainer);

    document.getElementById('progressContainer').classList.add('hidden');
    document.getElementById('photoResults').classList.remove('hidden');
}

function getCanvasFilter(filterType) {
    const filters = {
        grayscale: 'grayscale(100%)',
        sepia: 'sepia(100%)',
        vintage: 'sepia(50%) contrast(120%) brightness(110%)',
        cool: 'hue-rotate(180deg) saturate(120%)',
        warm: 'hue-rotate(30deg) saturate(130%) brightness(110%)',
    };
    return filters[filterType] || 'none';
}

function drawFrame(ctx, width, height, frameType) {
    const borderWidth = Math.min(width, height) * 0.03;

    ctx.globalCompositeOperation = 'source-over';

    const frames = {
        vintage: () => {
            ctx.strokeStyle = '#8b4513';
            ctx.lineWidth = borderWidth;
            ctx.strokeRect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);
        },
        neon: () => {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = borderWidth / 2;
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 20;
            ctx.strokeRect(borderWidth / 4, borderWidth / 4, width - borderWidth / 2, height - borderWidth / 2);
            ctx.shadowBlur = 0;
        },
        elegant: () => {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = borderWidth;
            ctx.strokeRect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);

            ctx.fillStyle = '#ffd700';
            const cornerSize = borderWidth * 2;
            ctx.fillRect(0, 0, cornerSize, cornerSize);
            ctx.fillRect(width - cornerSize, 0, cornerSize, cornerSize);
            ctx.fillRect(0, height - cornerSize, cornerSize, cornerSize);
            ctx.fillRect(width - cornerSize, height - cornerSize, cornerSize, cornerSize);
        },
        emoji: () => {
            const emojis = ['✨', '💖', '😂', '😎', '🥳'];
            const count = 20;
            for (let i = 0; i < count; i++) {
                const emoji = emojis[Math.floor(Math.random() * emojis.length)];
                const x = Math.random() * width;
                const y = Math.random() * height;
                const fontSize = Math.random() * 30 + 20;

                ctx.font = `${fontSize}px Arial`;
                ctx.fillText(emoji, x, y);
            }
        },
    };

    if (frames[frameType]) frames[frameType]();
}

function resetPhotobooth() {
    stripPhotos = [];
    stripCount = 0;
    document.getElementById('photoContainer').innerHTML = '';
    document.getElementById('photoResults').classList.add('hidden');
    document.getElementById('progressContainer').classList.remove('hidden');
    updateStripStatus();
    setMode('strip');
}

window.addEventListener('beforeunload', function () {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
});