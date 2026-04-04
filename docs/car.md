# idea about slip angle etc

take forces to be due to displacement of contact patch of tyre. this might cover both static braking (so can park on a hill), and fast motion slip angle, slip ratio behaviour.

rolling forward reduces this displacement (proportional to its current value). possibly absolute wheel motion (pythag of forwards and sideways) would work about the same, unclear what makes more sense.

lateral motion increases displacement. displacement in steady state when rolling forward is then proportional to tan(slip angle), and within grip limit (max tyre displacement), is proportional to tyre force.

wheel angular change in excess of rolling increases displacement. Similarly, forces proportional to slip ratio up to grip limit.

Maybe include some damping force, otherwise stopped car pushed sideways might keep wobbling.

Can model this by 2 circles of grip - front and back (could do 4 but expect can get results with just front and back)

Can later model weight transfer, but for now just have circles of grip with constant radius.

# plan

2 grip circles with displacement of patch relative to car.

Initially just have a rocket motor drive - don't apply any longditudinal tyre forces. 

Calculate wheel ground speeds front and back.

Skip differential equations for now. 

Decay displacements given longitudinal wheel speeds (car speed should do for now.)


# directly using slip angle etc? 

TODO consider whether this simplifies, allows fewer iterations etc. (this might just come out from doing combined decaying displacements system)

might actually be simpler - calculate slip angle, weight it against displacement of contact patch by exp(-speed) ?


# debug/visual things

2 grip circles with coloured annotations, long, side speeds, slip angle etc. rotate fwd, side for turning wheel.

add arrows for car velocity in frame of wheel. slightly different front and back due to yaw.

controls to apply test forces eg bump car sideways at back or front

visible car wheels so can see rotation, turn etc. chequered like crash test.
