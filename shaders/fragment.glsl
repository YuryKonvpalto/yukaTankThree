uniform float time;
uniform vec4 resolution;
uniform float color;
uniform sampler2D uTexture;


varying vec2 vUv;
varying vec3 vNormal; 
varying float vColor; 
varying vec3 vPosition; 


//https://github.com/glslify/glsl-easings/blob/master/back-in-out.glsl
#define PI 3.141592653589793


float backInOut(float t) {
  float f = t < 0.5
    ? 2.0 * t
    : 1.0 - (2.0 * t - 1.0);

  float g = pow(f, 3.0) - f * sin(f * PI);

  return t < 0.5
    ? 0.5 * g
    : 0.5 * (1.0 - g) + 0.5;
}

float backIn(float t) {
  return pow(t, 3.0) - t * sin(t * PI);
}

float backOut(float t) {
  float f = 1.0 - t;
  return 1.0 - (pow(f, 3.0) - f * sin(f * PI));
}

    void main() {

      float t = mod(time/0.99, 1.);
      

      float alpha = abs(sin(time*2.5)/4.);
      // float alpha = (backOut(t)*0.2)*2.;

      vec4 image = texture2D(uTexture, vUv);
      // gl_FragColor = vec4(time, 0.3, 1., 1.);


      if(image.r<0.1) discard;
      image.a -= alpha;
      gl_FragColor = image;

    }

