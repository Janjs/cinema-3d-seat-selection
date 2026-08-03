import * as THREE from "three";

const VIDEO_ASPECT = 1920 / 1342;
const VIDEO_PILLAR_PAD = 187 / 1920;

export function createProjectionScreenMaterial(map, screenAspect) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: map },
      minLuminance: { value: 0.07 },
      projectionGain: { value: 1.22 },
      projectionStrength: { value: 0.68 },
      videoAspect: { value: VIDEO_ASPECT },
      screenAspect: { value: screenAspect },
      pillarPad: { value: VIDEO_PILLAR_PAD },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform float minLuminance;
      uniform float projectionGain;
      uniform float projectionStrength;
      uniform float videoAspect;
      uniform float screenAspect;
      uniform float pillarPad;
      varying vec2 vUv;

      vec2 coverUv(vec2 uv) {
        vec2 repeat = screenAspect > videoAspect
          ? vec2(1.0, videoAspect / screenAspect)
          : vec2(screenAspect / videoAspect, 1.0);
        vec2 local = uv * repeat + (1.0 - repeat) * 0.5;
        local.x = mix(pillarPad, 1.0 - pillarPad, local.x);
        return local;
      }

      void main() {
        vec3 tex = texture2D(map, coverUv(vUv)).rgb;
        float luma = dot(tex, vec3(0.2126, 0.7152, 0.0722));
        vec3 lifted = max(tex, vec3(minLuminance));
        lifted = mix(lifted, tex, smoothstep(0.0, 0.18, luma));
        vec3 projected = lifted * projectionGain;
        vec3 color = mix(tex, projected, projectionStrength);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    transparent: false,
    toneMapped: true,
    depthWrite: true,
  });

  return material;
}

export function setProjectionScreenAspect(material, aspect) {
  material.uniforms.screenAspect.value = aspect;
}

export function createScreenLightController(video, light, { minIntensity = 0.8, lumaScale = 7.5 } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 28;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  let frame = 0;
  let smoothLuma = 0.25;
  const smoothColor = new THREE.Color(0xe8edf5);

  return function updateScreenLight() {
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    frame += 1;
    if (frame % 3 !== 0) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let lumaSum = 0;
    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    const pixels = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      const luma = r * 0.2126 + g * 0.7152 + b * 0.0722;
      lumaSum += luma;
      rSum += r * luma;
      gSum += g * luma;
      bSum += b * luma;
    }

    const luma = lumaSum / pixels;
    const tintWeight = Math.max(lumaSum, 0.001);
    const sampledColor = new THREE.Color(rSum / tintWeight, gSum / tintWeight, bSum / tintWeight);

    smoothLuma += (luma - smoothLuma) * 0.22;
    smoothColor.lerp(sampledColor, 0.22);
    light.intensity = minIntensity + smoothLuma * lumaScale;
    light.color.copy(smoothColor);
  };
}
