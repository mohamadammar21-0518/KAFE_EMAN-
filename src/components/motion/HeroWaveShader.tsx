import { useEffect, useRef } from "react";

/** Ref hero shader uniforms from cafenza augiA20Il.js — cream/white/sand waves, not the default rainbow palette */
const HERO_SHADER = {
  colors: [
    [1, 1, 1], // #ffffff
    [163 / 255, 136 / 255, 96 / 255], // sand rgba(163,136,96,0.4) — rgb only in shader
    [1, 1, 1],
    [250 / 255, 242 / 255, 233 / 255], // #faf2e9 cream
  ],
  seed: 0,
  waveSpeed: 1,
  waveFreqX: 1.9,
  waveFreqY: 6,
  waveAngle: -169,
  waveAmplitude: 1.78,
  maskSoftness: 1.89,
  blendAmount: 0.47,
} as const;

const VERTEX = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT = `
precision highp float;
varying vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_seed;
uniform float u_waveSpeed;
uniform float u_waveFreqX;
uniform float u_waveFreqY;
uniform float u_waveAngle;
uniform float u_waveAmplitude;
uniform float u_maskSoftness;
uniform float u_blendAmount;
uniform vec3 u_color0;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;

mat2 Rot(float a) {
  float s = sin(a), c = cos(a);
  return mat2(c, -s, s, c);
}

vec2 hash(vec2 p) {
  float s = u_seed;
  vec2 k1 = vec2(2127.1 + s * 13.37, 81.17 + s * 7.31);
  vec2 k2 = vec2(1269.5 + s * 11.13, 283.37 + s * 5.79);
  p = vec2(dot(p, k1), dot(p, k2));
  return fract(sin(p) * (43758.5453 + s * 1.618));
}

float noise(in vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float n = mix(
    mix(dot(-1.0 + 2.0 * hash(i), f),
        dot(-1.0 + 2.0 * hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(-1.0 + 2.0 * hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(-1.0 + 2.0 * hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y
  );
  return 0.5 + 0.5 * n;
}

vec3 getColor(int idx) {
  if (idx == 0) return u_color0;
  if (idx == 1) return u_color1;
  if (idx == 2) return u_color2;
  return u_color3;
}

float seedF(float base) {
  return base * (1.0 + 0.5 * sin(u_seed * 3.17 + base));
}

vec2 warpUV(vec2 uv) {
  float t = u_time * u_waveSpeed;
  float angleOffset = sin(u_seed * 2.73) * 30.0;
  mat2 dirRot = Rot(radians(u_waveAngle + angleOffset));
  vec2 ruv = dirRot * uv;
  float fxMod = seedF(u_waveFreqX);
  float fyMod = seedF(u_waveFreqY);
  float phaseX = fract(sin(u_seed * 7.19) * 437.58) * 6.2832;
  float phaseY = fract(cos(u_seed * 3.41) * 291.37) * 6.2832;
  float harmonic = sin(u_seed * 1.23) * 0.5;
  float a = fyMod * ruv.y - sin(ruv.x * fxMod + ruv.y - t + phaseX);
  a += harmonic * sin(ruv.x * fxMod * 2.0 + ruv.y * 0.5 + t * 0.7 + phaseY);
  a = smoothstep(
    cos(a) * u_maskSoftness,
    sin(a) * u_maskSoftness + 3.0,
    cos(a - fyMod * ruv.y) - sin(a - fxMod * ruv.x)
  );
  a *= u_waveAmplitude;
  uv = cos(a) * uv + sin(a) * vec2(-uv.y, uv.x);
  return uv;
}

float S(float a, float b, float t) {
  return smoothstep(a, b, t);
}

void main() {
  vec2 fragCoord = v_uv * u_resolution;
  vec2 uv = fragCoord / u_resolution.xy;
  float ratio = u_resolution.x / u_resolution.y;
  float t = u_time * u_waveSpeed;
  vec2 tuv = uv - 0.5;
  vec2 seedShift = vec2(sin(u_seed * 4.37), cos(u_seed * 5.91)) * 100.0;
  float degree = noise(vec2(t * 0.1, tuv.x * tuv.y) + seedShift);
  tuv.y *= 1.0 / ratio;
  tuv *= Rot(radians((degree - 0.5) * 720.0 + 180.0));
  tuv.y *= ratio;
  vec2 uv2 = (fragCoord * 2.0 - u_resolution.xy) / (u_resolution.x + u_resolution.y) * 2.0;
  float preRotAngle = fract(sin(u_seed * 5.63) * 173.29) * 6.2832;
  uv2 *= Rot(preRotAngle);
  vec2 warped = warpUV(uv2) * 0.5 + 0.5;
  vec2 blendUV = mix(tuv, warped - 0.5, u_blendAmount);
  float layerRot1 = -5.0 + sin(u_seed * 1.83) * 20.0;
  float layerRot2 = 10.0 + cos(u_seed * 2.47) * 20.0;
  vec3 c0 = getColor(0);
  vec3 c1 = getColor(1);
  vec3 c2 = getColor(2);
  vec3 c3 = getColor(3);
  vec3 layer1 = mix(c0, c2, S(-0.3, 0.3, (blendUV * Rot(radians(layerRot1))).x));
  vec3 layer2 = mix(c3, c1, S(-0.3, 0.3, (blendUV * Rot(radians(layerRot2))).x));
  vec3 col = mix(layer1, layer2, S(0.3, -0.3, blendUV.y));
  col = mix(col, col * col + 0.5 * sqrt(col), 0.3);
  gl_FragColor = vec4(col, 1.0);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(log ?? "Shader compile failed");
  }
  return shader;
}

export function HeroWaveShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: true, antialias: false });
    if (!gl) return;

    const program = gl.createProgram();
    if (!program) return;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return;
    }

    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      u_resolution: gl.getUniformLocation(program, "u_resolution"),
      u_time: gl.getUniformLocation(program, "u_time"),
      u_seed: gl.getUniformLocation(program, "u_seed"),
      u_waveSpeed: gl.getUniformLocation(program, "u_waveSpeed"),
      u_waveFreqX: gl.getUniformLocation(program, "u_waveFreqX"),
      u_waveFreqY: gl.getUniformLocation(program, "u_waveFreqY"),
      u_waveAngle: gl.getUniformLocation(program, "u_waveAngle"),
      u_waveAmplitude: gl.getUniformLocation(program, "u_waveAmplitude"),
      u_maskSoftness: gl.getUniformLocation(program, "u_maskSoftness"),
      u_blendAmount: gl.getUniformLocation(program, "u_blendAmount"),
      u_color0: gl.getUniformLocation(program, "u_color0"),
      u_color1: gl.getUniformLocation(program, "u_color1"),
      u_color2: gl.getUniformLocation(program, "u_color2"),
      u_color3: gl.getUniformLocation(program, "u_color3"),
    };

    const { colors, ...params } = HERO_SHADER;
    let raf = 0;
    const start = performance.now();

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const t = (performance.now() - start) / 1000;
      gl.uniform2f(uniforms.u_resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.u_time, t);
      gl.uniform1f(uniforms.u_seed, params.seed);
      gl.uniform1f(uniforms.u_waveSpeed, params.waveSpeed);
      gl.uniform1f(uniforms.u_waveFreqX, params.waveFreqX);
      gl.uniform1f(uniforms.u_waveFreqY, params.waveFreqY);
      gl.uniform1f(uniforms.u_waveAngle, params.waveAngle);
      gl.uniform1f(uniforms.u_waveAmplitude, params.waveAmplitude);
      gl.uniform1f(uniforms.u_maskSoftness, params.maskSoftness);
      gl.uniform1f(uniforms.u_blendAmount, params.blendAmount);
      gl.uniform3fv(uniforms.u_color0, colors[0]);
      gl.uniform3fv(uniforms.u_color1, colors[1]);
      gl.uniform3fv(uniforms.u_color2, colors[2]);
      gl.uniform3fv(uniforms.u_color3, colors[3]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}
