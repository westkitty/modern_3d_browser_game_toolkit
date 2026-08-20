export const COLOR_VS = `#version 300 es
in vec3 a_pos;
in vec3 a_col;
uniform mat4 u_viewProj;
uniform vec3 u_offset;
out vec3 v_col;
void main() {
  v_col = a_col;
  gl_Position = u_viewProj * vec4(a_pos + u_offset, 1.0);
}`;

export const COLOR_FS = `#version 300 es
precision mediump float;
in vec3 v_col;
out vec4 outColor;
void main() { outColor = vec4(v_col, 1.0); }`;

export const POINT_VS = `#version 300 es
in vec3 a_pos;
uniform mat4 u_viewProj;
void main() {
  gl_Position = u_viewProj * vec4(a_pos, 1.0);
  gl_PointSize = 4.0;
}`;

export const POINT_FS = `#version 300 es
precision mediump float;
out vec4 outColor;
void main() { outColor = vec4(1.0, 0.85, 0.45, 1.0); }`;

export const POST_VS = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

export const POST_FS = `#version 300 es
precision mediump float;
in vec2 v_uv;
uniform sampler2D u_color;
uniform float u_strength;
out vec4 outColor;
void main() {
  vec3 color = texture(u_color, v_uv).rgb;
  float vig = smoothstep(1.0, 0.35, distance(v_uv, vec2(0.5)));
  outColor = vec4(color * mix(1.0, vig, u_strength), 1.0);
}`;
