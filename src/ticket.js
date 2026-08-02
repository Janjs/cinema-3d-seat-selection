import * as THREE from "three";

export function ticketDisplacement(x, y, pointerX, pointerY, time, strength = 1) {
  const idle = Math.sin(x * 1.35 + time * 1.15) * 0.035 + Math.cos(y * 2.1 - time * 0.8) * 0.018;
  const crease = (x - pointerX) * 0.72 + (y - pointerY) * 0.7;
  const fold = Math.tanh(crease * 2.6) * Math.exp(-Math.abs(crease) * 1.05) * 0.42 * strength;
  const touch = -Math.exp(-((x - pointerX) ** 2 + (y - pointerY) ** 2) * 2.4) * 0.18 * strength;
  return idle + fold + touch;
}

export function isPortfolioUv(uv) {
  return Boolean(uv && uv.x >= 0.285 && uv.x <= 0.46 && uv.y >= 0.44 && uv.y <= 0.56);
}

function roundedTicketPath(context, width, height) {
  const margin = 34;
  const notch = 28;
  const radius = 34;
  context.beginPath();
  context.moveTo(margin + radius, margin);
  context.lineTo(width - margin - radius, margin);
  context.quadraticCurveTo(width - margin, margin, width - margin, margin + radius);
  context.lineTo(width - margin, height / 2 - notch);
  context.arc(width - margin, height / 2, notch, -Math.PI / 2, Math.PI / 2, true);
  context.lineTo(width - margin, height - margin - radius);
  context.quadraticCurveTo(width - margin, height - margin, width - margin - radius, height - margin);
  context.lineTo(margin + radius, height - margin);
  context.quadraticCurveTo(margin, height - margin, margin, height - margin - radius);
  context.lineTo(margin, height / 2 + notch);
  context.arc(margin, height / 2, notch, Math.PI / 2, -Math.PI / 2, true);
  context.lineTo(margin, margin + radius);
  context.quadraticCurveTo(margin, margin, margin + radius, margin);
  context.closePath();
}

function createTicketTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 480;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return { canvas, texture };
}

function paintGoldTicket(canvas) {
  const context = canvas.getContext("2d");
  const { width, height } = canvas;
  context.clearRect(0, 0, width, height);
  roundedTicketPath(context, width, height);
  context.save();
  context.clip();

  const gold = context.createLinearGradient(0, 0, width, height);
  gold.addColorStop(0, "#8d6622");
  gold.addColorStop(0.22, "#f4d789");
  gold.addColorStop(0.5, "#bd8731");
  gold.addColorStop(0.72, "#ffe6a1");
  gold.addColorStop(1, "#8f6221");
  context.fillStyle = gold;
  context.fillRect(0, 0, width, height);

  context.globalAlpha = 0.13;
  for (let x = -height; x < width; x += 14) context.fillRect(x, 0, 2, height);
  context.globalAlpha = 1;
  return context;
}

function drawTicket(canvas, seat, format) {
  const context = paintGoldTicket(canvas);
  const { height } = canvas;
  const seatMatch = seat.match(/^([A-Z]+)(\d+)$/);
  const row = seatMatch?.[1] ?? "—";
  const seatNumber = seatMatch?.[2] ?? seat;
  context.strokeStyle = "rgba(55, 35, 10, .55)";
  context.lineWidth = 2;
  context.setLineDash([8, 9]);
  context.beginPath();
  context.moveTo(700, 72);
  context.lineTo(700, height - 72);
  context.stroke();
  context.setLineDash([]);

  context.fillStyle = "#35220b";
  context.font = "600 24px Work Sans, sans-serif";
  context.letterSpacing = "8px";
  context.fillText("ADMIT ONE", 92, 112);
  context.font = "600 42px Work Sans, sans-serif";
  context.letterSpacing = "-2px";
  context.fillText("DID YOU LIKE THIS DEMO?", 88, 205);
  context.font = "500 18px Work Sans, sans-serif";
  context.letterSpacing = "2px";
  context.fillText("MORE FUN STUFF AT JANJS.DEV →", 92, 252);

  context.font = "500 18px Work Sans, sans-serif";
  context.letterSpacing = "2px";
  context.fillText(format.toUpperCase(), 92, 362);
  context.fillText("€14.50", 525, 362);

  context.textAlign = "center";
  context.font = "600 18px Work Sans, sans-serif";
  context.letterSpacing = "5px";
  context.fillText("RESERVED", 836, 112);
  context.font = "600 15px Work Sans, sans-serif";
  context.letterSpacing = "3px";
  context.fillText("ROW", 788, 180);
  context.fillText("SEAT", 882, 180);
  context.strokeStyle = "rgba(55, 35, 10, .35)";
  context.beginPath();
  context.moveTo(835, 155);
  context.lineTo(835, 265);
  context.stroke();
  context.font = "600 52px Work Sans, sans-serif";
  context.letterSpacing = "-2px";
  context.fillText(row, 788, 245);
  context.fillText(seatNumber, 882, 245);
  context.font = "500 15px Work Sans, sans-serif";
  context.letterSpacing = "3px";
  context.fillText("ENJOY THE SHOW", 836, 345);
  context.restore();
}

function drawTicketBack(canvas) {
  const context = paintGoldTicket(canvas);
  const { width, height } = canvas;
  context.fillStyle = "#35220b";
  context.fillRect(34, 62, width - 68, 54);
  context.fillRect(34, height - 116, width - 68, 54);
  context.fillStyle = "#e7c66f";
  context.textAlign = "center";
  context.font = "600 24px Work Sans, sans-serif";
  context.letterSpacing = "12px";
  context.fillText("★ ★ ★ ★ ★ ★ ★", width / 2, 98);
  context.fillText("★ ★ ★ ★ ★ ★ ★", width / 2, height - 78);
  context.fillStyle = "#35220b";
  context.font = "600 88px Work Sans, sans-serif";
  context.letterSpacing = "-3px";
  context.fillText("FILM TICKET", width / 2, 278);
  context.font = "500 17px Work Sans, sans-serif";
  context.letterSpacing = "6px";
  context.fillText("LIGHTS · CAMERA · ACTION", width / 2, 322);
  context.restore();
}

export function createTicketExperience({ overlay, canvas, closeButton }) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.z = 8.2;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;

  const group = new THREE.Group();
  const geometry = new THREE.PlaneGeometry(6, 2.8, 72, 28);
  const backGeometry = geometry.clone();
  const basePositions = geometry.attributes.position.array.slice();
  const { canvas: textureCanvas, texture } = createTicketTexture();
  const { canvas: backTextureCanvas, texture: backTexture } = createTicketTexture();
  backTexture.wrapS = THREE.RepeatWrapping;
  backTexture.repeat.x = -1;
  backTexture.offset.x = 1;
  const materialOptions = {
    transparent: true,
    alphaTest: 0.08,
    side: THREE.FrontSide,
    metalness: 0.78,
    roughness: 0.27,
    clearcoat: 0.65,
    clearcoatRoughness: 0.18,
  };
  const material = new THREE.MeshPhysicalMaterial({
    map: texture,
    ...materialOptions,
  });
  const ticket = new THREE.Mesh(geometry, material);
  const backTicket = new THREE.Mesh(backGeometry, new THREE.MeshPhysicalMaterial({ map: backTexture, ...materialOptions, side: THREE.BackSide }));
  backTicket.rotation.y = Math.PI;
  drawTicketBack(backTextureCanvas);
  backTexture.needsUpdate = true;
  group.add(ticket, backTicket);
  scene.add(group);
  scene.add(new THREE.HemisphereLight(0xffe3a0, 0x211205, 2.4));
  const key = new THREE.DirectionalLight(0xfff1c4, 5.5);
  key.position.set(-3, 4, 6);
  scene.add(key);
  const rim = new THREE.PointLight(0xd0912f, 16, 16);
  rim.position.set(4, -2, 4);
  scene.add(rim);

  const pointer = new THREE.Vector2();
  const smoothedPointer = new THREE.Vector2();
  const foldPointer = new THREE.Vector2();
  const smoothedFoldPointer = new THREE.Vector2();
  const zero = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const dragStart = new THREE.Vector2();
  const lastDragPoint = new THREE.Vector2();
  const dragOrigin = new THREE.Vector2();
  const dragTarget = new THREE.Vector2();
  const dragPosition = new THREE.Vector2();
  const spinRotation = new THREE.Vector2();
  const spinVelocity = new THREE.Vector2();
  let pointerInside = false;
  let dragging = false;
  let dragPointerId = null;
  let dragMoved = false;
  let portfolioPress = false;
  let heldScale = 1;
  let open = false;
  let openedAt = 0;
  let returnFocus = null;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    camera.aspect = rect.width / rect.height;
    camera.position.z = camera.aspect < 1 ? 11 / camera.aspect : 8.2;
    camera.updateProjectionMatrix();
    renderer.setSize(rect.width, rect.height, false);
  }

  function updatePointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1),
      THREE.MathUtils.clamp(-((event.clientY - rect.top) / rect.height) * 2 + 1, -1, 1),
    );
  }

  function ticketAtPointer() {
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects([ticket, backTicket], false)[0] ?? null;
  }

  function setCursor(hit) {
    const overLink = hit?.object === ticket && isPortfolioUv(hit.uv);
    canvas.classList.toggle("ticket-link-hover", overLink);
    canvas.classList.toggle("ticket-grab", Boolean(hit) && !overLink);
  }

  overlay.addEventListener("pointermove", (event) => {
    updatePointer(event);
    pointerInside = true;
    const hit = ticketAtPointer();
    if (hit?.uv) foldPointer.set((hit.uv.x - 0.5) * 6, (hit.uv.y - 0.5) * 2.8);
    setCursor(hit);
    if (dragging && event.pointerId === dragPointerId) {
      const rect = canvas.getBoundingClientRect();
      const dx = event.clientX - dragStart.x;
      const dy = event.clientY - dragStart.y;
      const stepX = event.clientX - lastDragPoint.x;
      const stepY = event.clientY - lastDragPoint.y;
      dragMoved ||= Math.hypot(dx, dy) > 6;
      dragTarget.set(
        THREE.MathUtils.clamp(dragOrigin.x + (dx / rect.width) * 3.5, -1.6, 1.6),
        THREE.MathUtils.clamp(dragOrigin.y - (dy / rect.height) * 2, -0.9, 0.9),
      );
      spinRotation.x += (stepY / rect.height) * Math.PI * 2;
      spinRotation.y += (stepX / rect.width) * Math.PI * 3;
      spinVelocity.set((stepY / rect.height) * 26, (stepX / rect.width) * 38);
      lastDragPoint.set(event.clientX, event.clientY);
    }
  });
  overlay.addEventListener("pointerleave", () => {
    pointerInside = false;
    setCursor(null);
  });
  canvas.addEventListener("pointerdown", (event) => {
    updatePointer(event);
    const hit = ticketAtPointer();
    if (!hit) return;
    dragging = true;
    dragPointerId = event.pointerId;
    dragMoved = false;
    portfolioPress = hit.object === ticket && isPortfolioUv(hit.uv);
    dragStart.set(event.clientX, event.clientY);
    lastDragPoint.copy(dragStart);
    dragOrigin.copy(dragTarget);
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("ticket-holding");
    event.preventDefault();
  });
  const releaseTicket = (event) => {
    if (!dragging || event.pointerId !== dragPointerId) return;
    updatePointer(event);
    const releaseHit = ticketAtPointer();
    const openPortfolio = event.type === "pointerup" && !dragMoved && portfolioPress && releaseHit?.object === ticket && isPortfolioUv(releaseHit.uv);
    dragging = false;
    dragPointerId = null;
    portfolioPress = false;
    dragPosition.copy(dragTarget);
    dragTarget.set(0, 0);
    canvas.classList.remove("ticket-holding");
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (openPortfolio) window.open("https://janjs.dev", "_blank", "noopener,noreferrer");
  };
  canvas.addEventListener("pointerup", releaseTicket);
  canvas.addEventListener("pointercancel", releaseTicket);

  function hide() {
    open = false;
    overlay.classList.remove("visible");
    overlay.setAttribute("aria-hidden", "true");
    returnFocus?.focus();
  }
  closeButton.addEventListener("click", hide);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) hide();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && open) hide();
  });

  const clock = new THREE.Clock();
  function render() {
    requestAnimationFrame(render);
    const delta = Math.min(clock.getDelta(), 0.05);
    if (!open) return;
    const time = clock.elapsedTime;
    const strength = reducedMotion ? 0 : pointerInside ? 1 : 0.3;
    smoothedPointer.lerp(pointerInside ? pointer : zero, 1 - Math.exp(-delta * 5));
    smoothedFoldPointer.lerp(pointerInside ? foldPointer : zero, 1 - Math.exp(-delta * 7));
    const positions = geometry.attributes.position;
    const backPositions = backGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = basePositions[i * 3];
      const y = basePositions[i * 3 + 1];
      const z = ticketDisplacement(x, y, smoothedFoldPointer.x, smoothedFoldPointer.y, time, strength);
      positions.setXYZ(i, x, y, z);
      backPositions.setXYZ(i, -x, y, -z + 0.025);
    }
    positions.needsUpdate = true;
    backPositions.needsUpdate = true;
    geometry.computeVertexNormals();
    backGeometry.computeVertexNormals();
    const entrance = reducedMotion ? 1 : Math.min((performance.now() - openedAt) / 900, 1);
    const eased = 1 - (1 - entrance) ** 4;
    dragPosition.lerp(dragTarget, 1 - Math.exp(-delta * (dragging ? 14 : 5)));
    heldScale += ((dragging ? 1.035 : 1) - heldScale) * (1 - Math.exp(-delta * 9));
    group.scale.setScalar(eased * heldScale);
    group.position.x = dragPosition.x;
    group.position.y = (reducedMotion ? 0 : Math.sin(time * 1.15) * 0.16) + (1 - eased) * -1.8 + dragPosition.y;
    group.position.z += ((dragging ? 0.45 : 0) - group.position.z) * (1 - Math.exp(-delta * 10));
    if (!dragging && !reducedMotion) {
      spinRotation.addScaledVector(spinVelocity, delta);
      spinVelocity.multiplyScalar(Math.exp(-delta * 2.6));
    }
    group.rotation.x = spinRotation.x - smoothedPointer.y * 0.08;
    group.rotation.y = spinRotation.y + smoothedPointer.x * 0.12;
    group.rotation.z = reducedMotion ? -0.035 : -0.035 + Math.sin(time * 0.7) * 0.025;
    renderer.render(scene, camera);
  }
  render();

  return {
    show(seat, format) {
      drawTicket(textureCanvas, seat, format);
      texture.needsUpdate = true;
      spinRotation.set(0, 0);
      spinVelocity.set(0, 0);
      dragTarget.set(0, 0);
      dragPosition.set(0, 0);
      foldPointer.set(0, 0);
      smoothedFoldPointer.set(0, 0);
      open = true;
      openedAt = performance.now();
      returnFocus = document.activeElement;
      overlay.classList.add("visible");
      overlay.setAttribute("aria-hidden", "false");
      resize();
      closeButton.focus();
    },
    resize,
  };
}
