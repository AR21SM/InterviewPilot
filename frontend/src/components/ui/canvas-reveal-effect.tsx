"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef } from "react";

export interface CanvasRevealEffectProps {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  totalSize?: number;
  showGradient?: boolean;
  isActive?: boolean;
}

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_opacities[10];
uniform vec3 u_colors[6];
uniform float u_total_size;
uniform float u_dot_size;
uniform float u_animation_speed_factor;

float PHI = 1.61803398874989484820459;
float random(vec2 xy) {
  return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
}

void main() {
  vec2 fragCoord = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);
  vec2 st = fragCoord;
  st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));
  st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));
  float opacity = step(0.0, st.x) * step(0.0, st.y);

  vec2 st2 = vec2(floor(st.x / u_total_size), floor(st.y / u_total_size));

  float frequency = 5.0;
  float show_offset = random(st2);
  float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency) + 1.0);

  int opIndex = int(clamp(floor(rand * 10.0), 0.0, 9.0));
  float op = u_opacities[0];
  for (int i = 0; i < 10; i++) {
    if (i == opIndex) {
      op = u_opacities[i];
      break;
    }
  }
  opacity *= op;
  opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
  opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

  int colIndex = int(clamp(floor(show_offset * 6.0), 0.0, 5.0));
  vec3 color = u_colors[0];
  for (int i = 0; i < 6; i++) {
    if (i == colIndex) {
      color = u_colors[i];
      break;
    }
  }

  float intro_offset = distance(u_resolution / 2.0 / u_total_size, st2) * 0.01 + (random(st2) * 0.15);
  opacity *= step(intro_offset, u_time * u_animation_speed_factor);
  opacity *= clamp((1.0 - step(intro_offset + 0.1, u_time * u_animation_speed_factor)) * 1.25, 1.0, 1.25);

  gl_FragColor = vec4(color * opacity, opacity);
}
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string
): WebGLProgram | null {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  return program;
}

export const CanvasRevealEffect = ({
  animationSpeed = 0.4,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[0, 255, 255]],
  containerClassName,
  dotSize = 2,
  totalSize = 4,
  showGradient = true,
  isActive = true,
}: CanvasRevealEffectProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const isRunningRef = useRef<boolean>(false);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Latest props refs to avoid rebuilding WebGL context on prop changes
  const propsRef = useRef({
    animationSpeed,
    opacities,
    colors,
    dotSize,
    totalSize,
    isActive,
  });

  propsRef.current = {
    animationSpeed,
    opacities,
    colors,
    dotSize,
    totalSize,
    isActive,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const gl =
      canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference: "high-performance",
      }) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

    if (!gl) return;

    const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    if (!program) return;

    gl.useProgram(program);

    // Quad geometry: 2 triangles as triangle strip covering [-1, 1]
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPositionLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPositionLoc);
    gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uResolutionLoc = gl.getUniformLocation(program, "u_resolution");
    const uTimeLoc = gl.getUniformLocation(program, "u_time");
    const uOpacitiesLoc = gl.getUniformLocation(program, "u_opacities");
    const uColorsLoc = gl.getUniformLocation(program, "u_colors");
    const uTotalSizeLoc = gl.getUniformLocation(program, "u_total_size");
    const uDotSizeLoc = gl.getUniformLocation(program, "u_dot_size");
    const uSpeedLoc = gl.getUniformLocation(program, "u_animation_speed_factor");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let width = 0;
    let height = 0;
    let dpr = 1;

    const updateSize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const newWidth = Math.max(1, Math.round(rect.width * dpr));
      const newHeight = Math.max(1, Math.round(rect.height * dpr));

      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;
        width = newWidth;
        height = newHeight;
        gl.viewport(0, 0, width, height);
      }
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
      if (isRunningRef.current) {
        renderFrame();
      }
    });
    resizeObserver.observe(container);

    const renderFrame = () => {
      if (!gl || !program) return;

      const p = propsRef.current;
      const elapsed = (performance.now() - startTimeRef.current) / 1000;

      gl.useProgram(program);
      gl.uniform2f(uResolutionLoc, width, height);
      gl.uniform1f(uTimeLoc, elapsed);
      gl.uniform1f(uTotalSizeLoc, p.totalSize);
      gl.uniform1f(uDotSizeLoc, p.dotSize);
      gl.uniform1f(uSpeedLoc, p.animationSpeed);

      // Prepare 6 colors uniform
      const colorsArray: number[][] = [];
      if (p.colors.length === 1) {
        for (let i = 0; i < 6; i++) colorsArray.push(p.colors[0]);
      } else if (p.colors.length === 2) {
        colorsArray.push(p.colors[0], p.colors[0], p.colors[0], p.colors[1], p.colors[1], p.colors[1]);
      } else {
        colorsArray.push(
          p.colors[0],
          p.colors[0],
          p.colors[1],
          p.colors[1],
          p.colors[2] ?? p.colors[1],
          p.colors[2] ?? p.colors[1]
        );
      }

      const flatColors = new Float32Array(18);
      for (let i = 0; i < 6; i++) {
        const c = colorsArray[i] || [0, 255, 255];
        flatColors[i * 3 + 0] = c[0] / 255;
        flatColors[i * 3 + 1] = c[1] / 255;
        flatColors[i * 3 + 2] = c[2] / 255;
      }
      gl.uniform3fv(uColorsLoc, flatColors);

      const flatOpacities = new Float32Array(
        p.opacities.length === 10
          ? p.opacities
          : [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1]
      );
      gl.uniform1fv(uOpacitiesLoc, flatOpacities);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const loop = () => {
      renderFrame();
      if (isRunningRef.current) {
        animFrameIdRef.current = requestAnimationFrame(loop);
      }
    };

    const startLoop = () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = null;
      }
      startTimeRef.current = performance.now();
      isRunningRef.current = true;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    const stopLoop = () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
      fadeTimeoutRef.current = setTimeout(() => {
        isRunningRef.current = false;
        if (animFrameIdRef.current) {
          cancelAnimationFrame(animFrameIdRef.current);
          animFrameIdRef.current = null;
        }
      }, 400);
    };

    if (isActive) {
      startLoop();
    }

    // Expose controller for prop changes
    (container as any).__startLoop = startLoop;
    (container as any).__stopLoop = stopLoop;

    return () => {
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      isRunningRef.current = false;
      resizeObserver.disconnect();
      if (positionBuffer) gl.deleteBuffer(positionBuffer);
      if (program) gl.deleteProgram(program);
    };
  }, []);

  // React to isActive changes without reinitializing WebGL context
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (isActive) {
      if (typeof (container as any).__startLoop === "function") {
        (container as any).__startLoop();
      }
    } else {
      if (typeof (container as any).__stopLoop === "function") {
        (container as any).__stopLoop();
      }
    }
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      className={cn("h-full relative w-full overflow-hidden", containerClassName)}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full pointer-events-none"
      />
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-[84%] pointer-events-none" />
      )}
    </div>
  );
};
