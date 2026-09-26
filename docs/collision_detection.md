raycasting vs triangle mesh.

simple raycasting limited and may have issues if don't expand triangles and mesh not watertight (rays might pass though cracks)

spherecasting guess more robust, and also more general/useful.

## purpose

player distance above ground

wheels of car distance above ground

gun laser pointer

bullets

balls/grenades

third person camera collision.

## how to do

collision of sphere with triangle equivalent to collision of ray with triangle convolved with sphere / inflated.

inflated triangle is csg union of thickened triangle, cylinders around the edges, and spheres at the vertices.

try colliding ray vs each edge, vertex and face in a mesh (or for simplicity consider each tri separately, generally means will do most edges twice, vertices 6 times )

a more efficient system might only consider convex edges and vertices between convex edges, but more complicated.

pick the closest collision point if ahead of ray.

## pseudocode/logic

### collsion of ray vs spheres

to understand whether ray collides with sphere, take cross product of ray direction (normalised) with a vector from line to point (vertex/sphere centre). if this is less than sphere radius, collides.

if collides, move ray forward by dot product of ray direction and vector to sphere, and back a bit. 

ray goes from A to B, sphere is at P.

if ( |norm(AB) x AP| < r ){   //NOTE should probably square both sides here.
    //collides
    moveToPlaneDist = ( norm(AB) . AP )
    moveBackDist = sqrt( r^2 - (norm(AB) x AP)^2 )
    moveForwardVec = ( moveToPlaneDist - moveBackDist ) * norm(AB)

    // guess equivalent to
    //     = ( ( AB.AP / len(AB) ) - sqrt( r^2 - ( (AB x AP) /len(AB) )^2 ) ) * AB/len(AB)
    //     = ( AB.AP - sqrt( r^2 len(AB)^2 - (AB x AP)^2 ) ) * AB / (len(AB))^2
    // write len(AB)^2 as AB.AB =>
    //     = ( AB.AP - sqrt( r^2 AB.AB - (AB x AP)^2 ) ) * AB / AB.AB

    //NOTE could express by using offset from sphere instead, maybe simpler
    // also guess want distance, or fraction along line to collision in order to find first collision point (unless only testing collision with one vert/sphere)

}


NOTE this can be tested on its own - collision of gun laser pointer vs sphere.


### collision of ray vs cylinders

this can also be tested separately. test a capsule/line

find first collision pointwith extended cylinder surface, find whether this is on cylinder. (between 2 verts). Don't care about collision with end caps because this covered by collision with verts/spheres



### collision of ray vs thickened triangle
