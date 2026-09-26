# make a physics engine

## idea

want to make a basic physics engine to supprot something like Grand Theft Auto

## raycasting and sphere collision

enough to shoot gun and throw balls/grenades - generally want spherecasting. show collision point for laser pointer on gun, highlight closest point on terrain to player, point when cast straight down.

most important is collision with terrain, but eventually also want collision with vehicles, characters

## ground vehicles

### initial version

make some basic choices to get something like GTA3 level of simulation.

vehicle wheels ray cast downward to detect ground. or treat wheels as spheres - just detect closest surface to point (wheel centre). apply simple spring damper force to body of vehicle

for simplicity initially, treat car angular momentum like a ball/cube - torque simply proportional to angular velocity

check that behaves like a parked car on ice

### further work 

* principal axes
 
* rolling, steerable wheels

* driven wheels, slip angle...

* super simple approximate wall collisions -could put some bumper wheels/balls on outside of vehicle, but probably skip this. 

* proper polygon collision of car body with ground (so can drive into a wall etc)

* different vehicles with different number of wheels, driven wheels (eg 8 wheeled trucks)

* tracked vehicles, mechanum wheeled vehicles with slip angle etc.

* bikes

## characters

### initial version

just detect closest point on terrain model to player model, or raycast down (similar to car)

just model player as a non-rolling sphere with suspension

### further work

* capsule collsion

* make running uphill slower

* automatic standing on sloped surface without slipping down. how to do? like tyre brush model?

* matching up animations to locomotion

## other vehicles

* jetpack

* helicopters

* planes

* boats

* rockets

* giant robots!


## general stuff

* moving parts of level like drawbridge, large boat, etc.

* coefficient off friction, noises for different surfaces

* ragdolls

* collision between objects - eg car-car

* locomotion on other physics objects. eg player character running on car. for simplicity, cars could be uneffected by player objects.


