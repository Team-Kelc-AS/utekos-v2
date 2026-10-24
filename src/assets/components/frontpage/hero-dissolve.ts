export const HERO_HOLD_MS = 3500;
export const HERO_TRANSITION_MS = 3200;

const vertexSource = `
  attribute vec2 a_uv;
  uniform float u_progress;
  uniform float u_size;
  uniform vec2 u_tile;
  varying vec2 v_uv;
  varying float v_alpha;
  varying float v_phase;
  varying float v_accent;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    float seed = hash(a_uv);
    float delay = a_uv.x * 0.28 + (1.0 - a_uv.y) * 0.12 + seed * 0.12;
    float phase = clamp((u_progress - delay) / 0.48, 0.0, 1.0);
    vec2 drift = vec2(hash(a_uv + 2.0) - 0.5, hash(a_uv + 5.0) - 0.65);
    float motion = phase * phase * (3.0 - 2.0 * phase);
    vec2 position = a_uv + drift * motion * vec2(0.12, 0.18);
    gl_Position = vec4(position.x * 2.0 - 1.0, 1.0 - position.y * 2.0, 0.0, 1.0);
    gl_PointSize = max(1.0, u_size * (1.0 + phase * 0.15) * (1.0 - smoothstep(0.45, 1.0, phase)));
    v_alpha = 1.0 - smoothstep(0.25, 1.0, phase);
    v_phase = phase;
    v_accent = hash(a_uv + 9.0);
    v_uv = a_uv;
  }
`;

const fragmentSource = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform vec2 u_tile;
  uniform vec3 u_accent;
  uniform vec3 u_highlight;
  varying vec2 v_uv;
  varying float v_alpha;
  varying float v_phase;
  varying float v_accent;
  void main() {
    vec2 uv = v_uv + (gl_PointCoord - 0.5) * u_tile;
    if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0 || v_alpha < 0.001) discard;
    float circle = 1.0 - smoothstep(0.45, 0.5, length(gl_PointCoord - 0.5));
    // Preserve the complete image at rest, then release circular particles.
    float mask = mix(1.0, circle, smoothstep(0.0, 0.08, v_phase));
    vec3 color = texture2D(u_image, uv).rgb;
    float shimmer = smoothstep(0.10, 0.35, v_phase) * (1.0 - smoothstep(0.55, 0.90, v_phase));
    float accent = step(0.94, v_accent) * shimmer * 0.65;
    vec3 glint = mix(u_accent, u_highlight, step(0.985, v_accent));
    gl_FragColor = vec4(mix(color, glint, accent), v_alpha * mask);
  }
`;

function createParticles(canvas: HTMLCanvasElement, image: HTMLImageElement) {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: false,
    powerPreference: "low-power",
  });
  if (!gl) throw new Error("WebGL is unavailable.");

  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  const texture = gl.createTexture();
  const shaders: WebGLShader[] = [];
  const dispose = () => {
    for (const shader of shaders) gl.deleteShader(shader);
    gl.deleteProgram(program);
    gl.deleteBuffer(buffer);
    gl.deleteTexture(texture);
  };

  try {
    if (!program || !buffer || !texture) throw new Error("Unable to allocate hero particles.");
    for (const [type, source] of [
      [gl.VERTEX_SHADER, vertexSource],
      [gl.FRAGMENT_SHADER, fragmentSource],
    ] as const) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Unable to allocate a hero shader.");
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(`Hero shader compilation failed: ${gl.getShaderInfoLog(shader)}`);
      }
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Hero shader linking failed: ${gl.getProgramInfoLog(program)}`);
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const position = gl.getAttribLocation(program, "a_uv");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const progressUniform = gl.getUniformLocation(program, "u_progress");
    const tileUniform = gl.getUniformLocation(program, "u_tile");
    const sizeUniform = gl.getUniformLocation(program, "u_size");
    // Utekos orange and Cloud Dancer accent only the released particles.
    gl.uniform3f(gl.getUniformLocation(program, "u_accent"), 180 / 255, 71 / 255, 1 / 255);
    gl.uniform3f(gl.getUniformLocation(program, "u_highlight"), 240 / 255, 238 / 255, 233 / 255);
    let count = 0;

    return {
      resize(width: number, height: number) {
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        gl.viewport(0, 0, canvas.width, canvas.height);
        // 20% finer tiles than the previous grid, capped near 350,000 pieces.
        const tile = Math.max(8, Math.sqrt((width * height) / 25000)) / 3.75;
        const columns = Math.ceil(width / tile);
        const rows = Math.ceil(height / tile);
        count = columns * rows;
        const points = new Float32Array(count * 2);
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < columns; x++) {
            const offset = (y * columns + x) * 2;
            points[offset] = ((x + 0.5) * tile) / width;
            points[offset + 1] = ((y + 0.5) * tile) / height;
          }
        }
        gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
        gl.uniform2f(tileUniform, tile / width, tile / height);
        gl.uniform1f(sizeUniform, (tile * canvas.width) / width);
      },
      draw(progress: number) {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(progressUniform, progress);
        gl.drawArrays(gl.POINTS, 0, count);
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}

export async function enhanceHeroDissolve(root: HTMLElement, signal: AbortSignal) {
  if (signal.aborted) return;
  const frame = root.querySelector<HTMLElement>("[data-hero-frame]");
  const front = root.querySelector<HTMLImageElement>("[data-hero-front] img");
  const back = root.querySelector<HTMLImageElement>("[data-hero-back] img");
  const canvas = root.querySelector("canvas");
  if (!frame || !front || !back || !canvas) throw new Error("Hero dissolve markup is incomplete.");
  // Keep the original front image visible until both images and the GPU are ready.
  back.loading = "eager";
  await Promise.all([front.decode(), back.decode()]);
  if (signal.aborted) return;
  const particles = createParticles(canvas, front);
  let disposed = false;
  let request = 0;
  let timer = 0;
  let previous = -1;
  let width = 0;
  let height = 0;
  let elapsed = 0;
  let lastTime = 0;
  let running = false;
  let inView = false;

  const render = (progress: number) => {
    if (disposed) return;
    if (progress === previous) return;
    previous = progress;
    root.style.setProperty("--hero-front-opacity", progress === 0 ? "1" : "0");
    root.style.setProperty("--hero-particle-opacity", progress > 0 && progress < 1 ? "1" : "0");
    const fade = Math.max(0, Math.min(1, (progress - 0.04) / 0.88));
    root.style.setProperty("--hero-back-opacity", String(fade * fade * (3 - 2 * fade)));
    particles.draw(progress);
  };
  const tick = () => {
    request = 0;
    timer = 0;
    if (disposed || !running) return;
    const now = performance.now();
    elapsed += now - lastTime;
    lastTime = now;
    const leg = HERO_HOLD_MS + HERO_TRANSITION_MS;
    const phase = elapsed % (leg * 2);
    let holdRemaining = 0;
    if (phase < HERO_HOLD_MS) {
      render(0);
      holdRemaining = HERO_HOLD_MS - phase;
    } else if (phase < leg) {
      render((phase - HERO_HOLD_MS) / HERO_TRANSITION_MS);
    } else if (phase < leg + HERO_HOLD_MS) {
      render(1);
      holdRemaining = leg + HERO_HOLD_MS - phase;
    } else {
      render(1 - (phase - leg - HERO_HOLD_MS) / HERO_TRANSITION_MS);
    }
    // No animation frames are needed while an image is held still.
    if (holdRemaining > 0) timer = window.setTimeout(tick, holdRemaining);
    else request = requestAnimationFrame(tick);
  };
  const syncPlayback = () => {
    if (disposed) return;
    const shouldPlay = inView && !document.hidden;
    if (shouldPlay && !running) {
      running = true;
      lastTime = performance.now();
      tick();
    } else if (!shouldPlay && running) {
      elapsed += performance.now() - lastTime;
      running = false;
      cancelAnimationFrame(request);
      clearTimeout(timer);
      request = 0;
      timer = 0;
    }
    root.dataset.playback = shouldPlay ? "playing" : "paused";
  };
  const resize = () => {
    if (disposed) return;
    const rect = front.getBoundingClientRect();
    if (rect.width !== width || rect.height !== height) {
      width = rect.width;
      height = rect.height;
      particles.resize(width, height);
      const current = Math.max(0, previous);
      previous = -1;
      render(current);
    }
  };
  const observer = new ResizeObserver(resize);
  const visibility = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting && entry.intersectionRatio >= 0.1;
    syncPlayback();
  }, { threshold: [0, 0.1] });
  const stop = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(request);
    clearTimeout(timer);
    observer.disconnect();
    visibility.disconnect();
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", syncPlayback);
    canvas.removeEventListener("webglcontextlost", lost);
    signal.removeEventListener("abort", stop);
    delete root.dataset.state;
    delete root.dataset.playback;
    root.style.removeProperty("--hero-back-opacity");
    root.style.removeProperty("--hero-front-opacity");
    root.style.removeProperty("--hero-particle-opacity");
    particles.dispose();
  };
  const lost = (event: Event) => {
    event.preventDefault();
    stop();
    console.warn("Hero WebGL context lost; retaining the original images.");
  };

  signal.addEventListener("abort", stop, { once: true });
  canvas.addEventListener("webglcontextlost", lost);
  resize();
  root.dataset.state = "ready";
  observer.observe(front);
  visibility.observe(frame);
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", syncPlayback);
}
