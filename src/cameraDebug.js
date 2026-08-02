function formatVector(vector) {
  return `{ x: ${vector.x.toFixed(2)}, y: ${vector.y.toFixed(2)}, z: ${vector.z.toFixed(2)} }`;
}

function readNumber(input, fallback) {
  const value = Number.parseFloat(input.value);
  return Number.isFinite(value) ? value : fallback;
}

function vectorFromInputs(prefix, fallback) {
  return {
    x: readNumber(document.querySelector(`#${prefix}-x`), fallback.x),
    y: readNumber(document.querySelector(`#${prefix}-y`), fallback.y),
    z: readNumber(document.querySelector(`#${prefix}-z`), fallback.z),
  };
}

function setInputValues(prefix, vector) {
  document.querySelector(`#${prefix}-x`).value = vector.x.toFixed(2);
  document.querySelector(`#${prefix}-y`).value = vector.y.toFixed(2);
  document.querySelector(`#${prefix}-z`).value = vector.z.toFixed(2);
}

function axisFields(prefix, label, values) {
  return `
    <fieldset>
      <legend>${label}</legend>
      <label>X <input id="${prefix}-x" type="number" step="0.1" value="${values.x.toFixed(2)}" /></label>
      <label>Y <input id="${prefix}-y" type="number" step="0.1" value="${values.y.toFixed(2)}" /></label>
      <label>Z <input id="${prefix}-z" type="number" step="0.1" value="${values.z.toFixed(2)}" /></label>
    </fieldset>
  `;
}

export function isCameraDebugEnabled() {
  const params = new URLSearchParams(location.search);
  if (params.get("debug") === "0") return false;
  if (params.get("debug") === "camera") return true;
  return import.meta.env.DEV;
}

export function createCameraDebug({ camera, controls, overview, isMobileLayout }) {
  const panel = document.createElement("aside");
  panel.className = "camera-debug";
  panel.hidden = false;
  panel.innerHTML = `
    <header>
      <strong>Camera debug</strong>
      <span>D to hide</span>
    </header>
    ${axisFields("overview-position", "Desktop overview position", overview.position)}
    ${axisFields("overview-target", "Desktop overview target", overview.target)}
    ${axisFields("overview-mobile-position", "Mobile overview position", overview.mobilePosition)}
    ${axisFields("overview-mobile-target", "Mobile overview target", overview.mobileTarget)}
    <label class="camera-debug__field">FOV <input id="camera-fov" type="number" step="0.1" value="${overview.fov.toFixed(1)}" /></label>
    <fieldset>
      <legend>Live camera</legend>
      <output id="live-position">position: —</output>
      <output id="live-target">target: —</output>
    </fieldset>
    <pre id="camera-debug-snippet"></pre>
    <div class="camera-debug__actions">
      <button type="button" id="camera-debug-apply">Apply overview</button>
      <button type="button" id="camera-debug-capture">Use current view</button>
      <button type="button" id="camera-debug-copy">Copy snippet</button>
    </div>
    <p id="camera-debug-status" aria-live="polite"></p>
  `;
  document.body.appendChild(panel);

  const snippet = panel.querySelector("#camera-debug-snippet");
  const status = panel.querySelector("#camera-debug-status");

  function readOverviewFromInputs() {
    overview.position = vectorFromInputs("overview-position", overview.position);
    overview.target = vectorFromInputs("overview-target", overview.target);
    overview.mobilePosition = vectorFromInputs("overview-mobile-position", overview.mobilePosition);
    overview.mobileTarget = vectorFromInputs("overview-mobile-target", overview.mobileTarget);
    overview.fov = readNumber(panel.querySelector("#camera-fov"), overview.fov);
  }

  function writeOverviewToInputs() {
    setInputValues("overview-position", overview.position);
    setInputValues("overview-target", overview.target);
    setInputValues("overview-mobile-position", overview.mobilePosition);
    setInputValues("overview-mobile-target", overview.mobileTarget);
    panel.querySelector("#camera-fov").value = overview.fov.toFixed(1);
  }

  function buildSnippet() {
    return [
      `overviewPosition: ${formatVector(overview.position)},`,
      `overviewTarget: ${formatVector(overview.target)},`,
      `mobileOverviewPosition: ${formatVector(overview.mobilePosition)},`,
      `mobileOverviewTarget: ${formatVector(overview.mobileTarget)},`,
      `camera.fov: ${overview.fov.toFixed(1)},`,
      "",
      "// live",
      `camera.position: ${formatVector(camera.position)},`,
      `controls.target: ${formatVector(controls.target)},`,
      `isMobileLayout: ${isMobileLayout()}`,
    ].join("\n");
  }

  function setStatus(message) {
    status.textContent = message;
  }

  panel.querySelector("#camera-debug-apply").addEventListener("click", () => {
    readOverviewFromInputs();
    camera.fov = overview.fov;
    camera.updateProjectionMatrix();
    const position = isMobileLayout() ? overview.mobilePosition : overview.position;
    const target = isMobileLayout() ? overview.mobileTarget : overview.target;
    camera.position.set(position.x, position.y, position.z);
    controls.target.set(target.x, target.y, target.z);
    controls.update();
    setStatus("Applied overview values.");
  });

  panel.querySelector("#camera-debug-capture").addEventListener("click", () => {
    overview.fov = camera.fov;
    if (isMobileLayout()) {
      overview.mobilePosition = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
      overview.mobileTarget = { x: controls.target.x, y: controls.target.y, z: controls.target.z };
    } else {
      overview.position = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
      overview.target = { x: controls.target.x, y: controls.target.y, z: controls.target.z };
    }
    writeOverviewToInputs();
    setStatus("Captured current camera into overview fields.");
  });

  panel.querySelector("#camera-debug-copy").addEventListener("click", async () => {
    readOverviewFromInputs();
    const text = buildSnippet();
    snippet.textContent = text;
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copied camera snippet.");
    } catch {
      setStatus("Copy failed — select the snippet manually.");
    }
  });

  return {
    update() {
      if (panel.hidden) return;
      panel.querySelector("#live-position").textContent = `position: ${formatVector(camera.position)}`;
      panel.querySelector("#live-target").textContent = `target: ${formatVector(controls.target)}`;
      snippet.textContent = buildSnippet();
    },
    toggle() {
      panel.hidden = !panel.hidden;
      setStatus(panel.hidden ? "Camera debug hidden." : "Camera debug visible.");
    },
    panel,
  };
}
