struct Params {
    target_width: u32,
    target_height: u32,
}

@group(0) @binding(0)
var input_texture: texture_2d<f32>;

@group(0) @binding(1)
var output_texture: texture_storage_2d<rgba32float, write>;

@group(0) @binding(2)
var<uniform> params: Params;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let output_dimensions = textureDimensions(output_texture);
    let input_dimensions = textureDimensions(input_texture);
    let coords = vec2<i32>(i32(global_id.x), i32(global_id.y));

    if (global_id.x >= output_dimensions.x || global_id.y >= output_dimensions.y) {
        return;
    }

    // Calculate the source coordinates by mapping output pixel to input space
    let scale_x = f32(input_dimensions.x) / f32(output_dimensions.x);
    let scale_y = f32(input_dimensions.y) / f32(output_dimensions.y);

    let source_x = f32(global_id.x) * scale_x;
    let source_y = f32(global_id.y) * scale_y;

    // Get integer coordinates for sampling
    let source_int_coords = vec2<i32>(i32(source_x), i32(source_y));

    var final_color = vec4<f32>(0.0, 0.0, 0.0, 1.0); // Default to black

    // Check if source coordinates are within bounds
    if (source_int_coords.x >= 0 && source_int_coords.x < i32(input_dimensions.x) &&
        source_int_coords.y >= 0 && source_int_coords.y < i32(input_dimensions.y)) {

        // Bilinear interpolation for better quality
        let frac_x = fract(source_x);
        let frac_y = fract(source_y);

        // Check if we can do bilinear interpolation (not at edges)
        if (source_int_coords.x + 1 < i32(input_dimensions.x) &&
            source_int_coords.y + 1 < i32(input_dimensions.y)) {

            // Sample the four neighboring pixels
            let tl = textureLoad(input_texture, source_int_coords, 0);
            let tr = textureLoad(input_texture, source_int_coords + vec2<i32>(1, 0), 0);
            let bl = textureLoad(input_texture, source_int_coords + vec2<i32>(0, 1), 0);
            let br = textureLoad(input_texture, source_int_coords + vec2<i32>(1, 1), 0);

            // Interpolate horizontally
            let top = mix(tl, tr, frac_x);
            let bottom = mix(bl, br, frac_x);

            // Interpolate vertically
            final_color = mix(top, bottom, frac_y);
        } else {
            // Fallback to nearest neighbor at edges
            final_color = textureLoad(input_texture, source_int_coords, 0);
        }
    }

    textureStore(output_texture, coords, final_color);
}
