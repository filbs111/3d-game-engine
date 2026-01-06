# FPS Game

To be developed in parallel with 3-sphere game, so can prototype features faster, break procrastination, and would like to have another game! Opus might be GTA in space combining projects!

# Features

## Engine

* general 3d game engine
* Can use as editor. God mode for editing, inspection. take inspiration from "game engine" IDEs.
* separation from content - models, level data, scripts that determine enemy behaviour, etc can live somewhere else. with view to not bloating version control with binary data, separating public engine from propietary game data, mod support.
* initial use case - use for both standard FPS (walk around) and static/on-rails gameplay
* also would like to use for testing 3d physics engine

## FPS things

* good fisheye solution - similar to "bodycam" games. Apply fisheye techniques explored in 3-sphere game for >180deg FOV - quad view, ellipse preserving mapping, which suspect most other game's fisheye solutions don't do well.
* see character limbs without bodging - no arms+gun in a fake reference frame with different FOV! Prove can do this with a good vibe - trespasser did this before but looks odd. Other games have limbs shown - mirrors edge, left 4 dead. TODO retry these. Want FPS screen layout people are used to. Maybe fisheye makes this work well!
* physically sensible tilt when running - treat player something like a  metre stick balanced on a hand - no bent over running when up to speed! Determine whether sensible to tilt camera and/or aim point in this situation - perhaps should just tilt character body but keep view level.
* melee? (also good test of a no-bodge FPS graphics). like HROT, shift to kick!
* on-rails/static sections - turret? helicopter door gunner?

## Graphics

Might skip a lot of this for a retro vibe, but convenient to prototype in a smaller, eucledian project.

* shadows (directional, point light, PCSS, radiosity? cascades?)
* screenspace fx (that looks decent - avoid shit basic SSAA!)
* deferred rendering/lighting
* order independent transparency?

## Animation

* how to do proper arm/body rotation? just accept that it follows mouse? 
* look down for jiggle physics! (trespasser homage)
* picking up items?
* how to animate legs?
* rag dolls

## Audio

* use web audio API more fully.
* reverb
* voices? AI? clip from elsewhere? 
* music. royalty free?

## Enemies

* bugs (like Earth Defense Force EDF )
* giant spiders (EDF, resident evil)
* aliens
* zombies
* humans
* vampires, werewolves?

### Models

* characters
* buildings
* guns
* ability in import standard models for modding? eg XPS

## Things to skip (for now!)

* multiple height levels? (at least initially. avoids some animation complexity)
* player controlled vehicles
* multiple reference frames (like getting onto a train from a platform)

# Inspiration/vibe ideas

* virtua cop, wing war, gunblade ny, time crisis, crisis zone, silent scope
* alien breed - make like Alien Breed 97 first level? (starting at spaceship in dock - maybe good fit for combination with 3sphere game/universe - see duocylinder view out of the window? (can create skybox in 3sphere game)
* underworld, blade, return to castle wolfenstein, matrix
* another world/flashback (good for low fi aesthetic) - could make another world scenes and experience in 1st person - driving ferrari, picking up the gun etc!
* played semi straight like Time Crisis - be my guest, and let me entertain you!
