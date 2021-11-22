uniform float time;
uniform vec4 resolution;
uniform float color;
uniform sampler2D uTexture;


varying vec2 vUv;
varying vec3 vNormal; 
varying float vColor; 
varying vec3 vPosition; 



    void main() {

      float alpha = abs(sin(time*2.5)/4.);
     

      vec4 image = texture2D(uTexture, vUv);
      // gl_FragColor = vec4(time, 0.3, 1., 1.);


      if(image.r<0.1) discard;
      image.a -= alpha;
      gl_FragColor = image;

    }

