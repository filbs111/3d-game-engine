# antialiasing

would like to have antialiased graphics drawn to the screen.

problem: using fisheye mapping. currently rasterising to intermediate rectilinear view, then sampling from this to draw fisheye view to screen.

Hope to use deferred lighting in screen space (after fisheye mapping) which may complicate this further. 

Initial task to just get nice AA with fisheye.

ideas:

## 0 no AA

intermediate view no antialiasing. sample from it when map to screen using fisheye view with nearest or linear filter. Has castellated "super jaggies" effect for unfortunate edge angles. 

## 1 antialiasing of intermediate view

AFAIK can't use browser native AA for this. Can use custom FXAA etc. Might then sample result for screen points using linear blending.

## 2 Map from intermediate view then antialias after fisheye mapping

Solution currently used in 3sphere-explorer project. FXAA does not deal with "super jaggies" described in 1.

## 3 large intermediate view

Means less jaggies when mapping to screen, maybe will work well with NEAREST filter and deferred rendering after fisheye mapping.

## 4 MSAA

Larger intermediate render, average samples when mapping to screen. Side-effect of dealing better with subpixel details like thin lines. Good fit for not bothering with LOD system.

Expensive but maybe smart choice - implementation easy, useful as "gold standard".

AA of edges maybe not as good as FXAA unless intermediate view is very large. Maybe best to use in combination with other techniques.

## 5 use FXAA on intermediate view when mapping to screen

FXAA and similar aim to find : whether there is an edge, if so, the direction of the edge, and where the edge is relative to the current sample point. Then average the colours on either side of the edge appropriately. Normally FXAA figures this out for grid points matching the aliased image. Could modify this for fisheye for finding the nearest grid point to the sample point, and adjust the distance from edge found by the dot product of the edge direction and the difference between the sample point and closest grid point. 

Hope efficient, works decently.

## 6 draw curved objects straight to screen, antialias there

Requires tesellation/ pn-triangles/ subdivision surfaces/ level of detail etc. Fits well with having curved "low poly" objects. Have notes on this elsewhere. 
 
Huge job, but perhaps best results.

# PLAN: 

Tried 2, with double panel intermediate view. Works reasonably well if the intermediate view is fisheye mapped to penultimate view with linear filtering. Still some stepping seen for near horizontal/vertical lines. 

TODO try 5

TODO check FXAA implementation (copied current version from 3sphere explorer project, suspect isn't more expensive FXAA that handles near horinz/vertical lines well)