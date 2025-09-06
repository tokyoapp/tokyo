struct Params {
    shadows: vec3<f32>,
    midtones: vec3<f32>,
    highlights: vec3<f32>,
}

@group(0) @binding(0)
var input_texture: texture_2d<f32>;

@group(0) @binding(1)
var output_texture: texture_storage_2d<rgba32float, write>;

@group(0) @binding(2)
var<uniform> params: Params;

fn luminance(color: vec3<f32>) -> f32 {
    return 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
}

fn shadow_mask(lum: f32) -> f32 {
    return 1.0 - smoothstep(0.0, 0.5, lum);
}

fn midtone_mask(lum: f32) -> f32 {
    return smoothstep(0.0, 0.5, lum) * (1.0 - smoothstep(0.5, 1.0, lum));
}

fn highlight_mask(lum: f32) -> f32 {
    return smoothstep(0.5, 1.0, lum);
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dimensions = textureDimensions(input_texture);
    let coords = vec2<i32>(i32(global_id.x), i32(global_id.y));

    if (global_id.x >= dimensions.x || global_id.y >= dimensions.y) {
        return;
    }

    let input_color = textureLoad(input_texture, coords, 0);
    let lum = luminance(input_color.rgb);

    // Calculate masks for shadows, midtones, and highlights
    let shadow_weight = shadow_mask(lum);
    let midtone_weight = midtone_mask(lum);
    let highlight_weight = highlight_mask(lum);

    // Apply color balance adjustments
    let shadow_adjustment = input_color.rgb * (1.0 + params.shadows * shadow_weight);
    let midtone_adjustment = shadow_adjustment * (1.0 + params.midtones * midtone_weight);
    let highlight_adjustment = midtone_adjustment * (1.0 + params.highlights * highlight_weight);

    let final_color = vec4<f32>(
        max(highlight_adjustment, vec3<f32>(0.0)),
        input_color.a
    );

    textureStore(output_texture, coords, final_color);
}
