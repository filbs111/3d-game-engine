

* add more TODOs - see about.md for high level features.

1) most important thing - get a static character model in game in pose holding a gun, in some scene (eg a room), check whether fisheye camera mapping looks good - can actually check this in 3sphere project! (put as player object, use cockpit camera 0 offset)
2) separate legs and torso object, check pitching looks sensible

# items
* ground
* metre cube
* objects/scene for scale - eg house rooms with furniture.
* static characters
* car, helicopter - have these in vr project. want to see what fisheye looks like inside vehicle with view to use in FPS

# controls/animation
* basic eg box object for wasd moving and mouse rotation for "player object" (stuck to ground), and a free flying camera.
* mouse behaviour to avoid gimbal lock - free flight-ish with physical-is auto-leveling (due to restoring force for approximate simulated spine- when aimed straight up and tilt to left, beyond some amount, feet will turn to left to prefer pure elevation
* display current speed, acceleration (g meter) in real units
* controls for either player or god mode camera, switch to decide which to control.

# camera
* option to show camera for either player or god mode camera
* jump camera to different places - can do res evil style fixed camera? useful for testing view from eyes of static human object.
* fisheye camera
* ability to draw picture in picture or grid (useful for building an editor)

# model+animation
* cutscene animation - does this look good in 1st person? (ie seeing 1st person character gesticuating, talking) - do loss animation this way?
* "simulated" spine object - line of boxes? not real sim - just to check pose of torso/camera object looks sensible.
* arms object with gun that elevates. perhaps/optionally including torso and head so can check whether seems reasonable to rotate all together.
* legs object.
* skinned legs+torso object - animation so spine curves? 
* animate legs - can skip bum - not that visible from viewpoint!
* animation of walking most basic version - early res evil style
* animation with blending so can traverse slope (or flat ground when tilted due to acceleration)
* animation getting in/out of vehicles

# rendering
* basic drawing stuff without light, shadow
* shadow mapping
* deferred lighting (TODO what scheme? various options with deferred)
* radiosity grid bake
* spherical reflection, planar reflections. 

# level render/editing? 
* csg
* voxels
* destructible
* LOD for 

# fx
* synced walk sounds - footsteps, trouser friction sounds?

