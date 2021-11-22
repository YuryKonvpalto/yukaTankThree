#pragma glslify: cnoise4 = require(glsl-noise/classic/4d)

uniform float time;
uniform vec4 resolution;
uniform float color;
uniform sampler2D uTexture;


varying vec2 vUv; 
varying vec3 vNormal; 
varying float vColor; 
varying vec3 vPosition; 



void main()	{

    vUv = uv;
    vPosition = position;

    // float noise = cnoise4(vec4(vPosition, time));

    // vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    // gl_PointSize = 90. * ( 1. / - mvPosition.z );    
    

    // gl_Position = projectionMatrix * mvPosition;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}