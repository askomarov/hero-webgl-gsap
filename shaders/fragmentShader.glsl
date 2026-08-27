precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColorStops[3];
uniform float uBlobScale;
uniform float uSoftness;
uniform float uNoiseAmp;
uniform vec2 uMouse;

varying vec2 vUv;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,
    0.366025403784439,
    -0.577350269189626,
    0.024390243902439
  );
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
    permute(i.y + vec3(0.0, i1.y, 1.0))
      + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
    0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)),
    0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec3 colorRamp(float t) {
  t = clamp(t, 0.0, 1.0);
  if (t < 0.5) {
    return mix(uColorStops[0], uColorStops[1], t * 2.0);
  }
  return mix(uColorStops[1], uColorStops[2], (t - 0.5) * 2.0);
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);

  // центр + лёгкий паритет к мыши
  vec2 center = vec2(0.5) + uMouse * 0.06;
  vec2 p = (uv - center) * vec2(aspect, 1.0);

  float t = uTime * 0.35;

  // органическая деформация
  float n1 = snoise(p * 1.6 + vec2(t * 0.4, t * 0.25));
  float n2 = snoise(p * 2.8 - vec2(t * 0.3, -t * 0.45));
  float n3 = snoise(p * 0.9 + vec2(-t * 0.2, t * 0.5));

  vec2 warped = p;
  warped.x += (n1 * 0.55 + n2 * 0.25) * uNoiseAmp;
  warped.y += (n2 * 0.45 + n3 * 0.35) * uNoiseAmp;

  float d = length(warped);
  float blob = 1.0 - smoothstep(uBlobScale * (1.0 - uSoftness), uBlobScale, d);

  // внутреннее мерцание / перелив
  float flow = snoise(warped * 2.2 + vec2(t * 0.6, -t * 0.4));
  float swirl = snoise(warped * 3.5 - t * 0.5);
  float mixFactor = 0.5 + 0.5 * (flow * 0.7 + swirl * 0.3);

  vec3 col = colorRamp(mixFactor + n1 * 0.15);

  // ярче в ядре, мягче по краям
  float core = smoothstep(uBlobScale * 0.85, 0.0, d);
  col *= 0.55 + core * 0.9;

  float alpha = blob * (0.55 + core * 0.35);
  alpha = clamp(alpha, 0.0, 1.0);

  gl_FragColor = vec4(col * alpha, alpha);
}
