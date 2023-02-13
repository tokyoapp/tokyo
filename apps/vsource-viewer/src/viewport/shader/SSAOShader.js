import CompShader from './CompShader.js';

export default class SSAOShader extends CompShader {

    static fragmentSource() {
        return `#version 300 es

            // THREE js solution by alteredq / http://alteredqualia.com/

            precision mediump float;

            uniform sampler2D color;
            uniform sampler2D depth;
            uniform sampler2D guides;
            uniform sampler2D guidesDepth;

            in vec2 vTexCoords;

            out vec4 oFragColor;

            #define DL 2.399963229728653  // PI * ( 3.0 - sqrt( 5.0 ) )
            #define EULER 2.718281828459045

            const int samples = 8;     // ao sample count
            const float radius = 2.0;  // ao radius

            const float noiseAmount = 0.0003; // dithering amount

            const float diffArea = 0.6;   // self-shadowing reduction
            const float gDisplace = 0.4;  // gauss bell center

            const vec2 size = vec2(0.33);
            const float aoClamp = 0.5;
            const float lumInfluence = 0.1;

            vec2 rand( const vec2 coord ) {
                vec2 noise;

                float nx = dot ( coord, vec2( 12.9898, 78.233 ) );
                float ny = dot ( coord, vec2( 12.9898, 78.233 ) * 2.0 );

                noise = clamp( fract ( 43758.5453 * sin( vec2( nx, ny ) ) ), 0.0, 1.0 );

                return ( noise * 2.0  - 1.0 ) * noiseAmount;
            }

            float readDepth( const in vec2 coord ) {
                return texture( depth, coord ).r;
            }

            float compareDepths( const in float depth1, const in float depth2, inout int far ) {

                float garea = 2.0;                         // gauss bell width
                float diff = ( depth1 - depth2 ) * 100.0;  // depth difference (0-100)

                // reduce left bell width to avoid self-shadowing

                if ( diff < gDisplace ) {
                    garea = diffArea;
                } else {
                    far = 1;
                }

                float dd = diff - gDisplace;
                float gauss = pow( EULER, -2.0 * dd * dd / ( garea * garea ) );
                return gauss;
            }

            float calcAO( float depth, float dw, float dh ) {

                float dd = radius - depth * radius;
                vec2 vv = vec2( dw, dh );

                vec2 coord1 = vTexCoords + dd * vv;
                vec2 coord2 = vTexCoords - dd * vv;

                float temp1 = 0.0;
                float temp2 = 0.0;

                int far = 0;
                temp1 = compareDepths( depth, readDepth( coord1 ), far );

                // DEPTH EXTRAPOLATION

                if ( far > 0 ) {
                    temp2 = compareDepths( readDepth( coord2 ), depth, far );
                    temp1 += ( 1.0 - temp1 ) * temp2;
                }

                return temp1;
            }

            void main() {
                
                vec2 noise = rand( vTexCoords );
			    float depth = readDepth( vTexCoords );

                float tt = clamp( depth, aoClamp, 1.0 );

                float w = ( 1.0 / size.x )  / tt + ( noise.x * ( 1.0 - noise.x ) );
                float h = ( 1.0 / size.y ) / tt + ( noise.y * ( 1.0 - noise.y ) );

                float ao = 0.0;

                float dz = 1.0 / float( samples );
                float z = 1.0 - dz / 2.0;
                float l = 0.0;

                for ( int i = 0; i <= samples; i ++ ) {

                    float r = sqrt( 1.0 - z );

                    float pw = cos( l ) * r;
                    float ph = sin( l ) * r;
                    ao += calcAO( depth, pw * w, ph * h );
                    z = z - dz;
                    l = l + DL;
                }

                ao /= float( samples );
                ao = 1.0 - ao;

                vec3 color = texture( color, vTexCoords ).rgb;

                vec3 lumcoeff = vec3( 0.299, 0.587, 0.114 );
                float lum = dot( color.rgb, lumcoeff );
                vec3 luminance = vec3( lum );

                vec3 aoResult = vec3( mix( vec3( ao ), vec3( 1.0 ), luminance * lumInfluence ) );

                oFragColor = vec4(aoResult * 2.0, 1.0);
            }
        `;
    }

}