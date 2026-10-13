//this is a subset of methods from file of same name taken from 3sphere project.

//bounding volume heirarcy stuff.
//generation of BVH from triangle mesh
//and collision with it.

//Axis-aligned bounding box tree.
//collision tests for 
//vs input AABB, distance query for point (for sphere test) - perhaps with sign (which side of triangle). Test for a line with many points, point to point test...
// for line, collision, equally spaced points on great circle are not evenly spaced on the 3d projected space,
// for sphere test not really correct in projected space. 
// for small objects this might not matter much, but for world level BVH this should be accounted for.

function createBvhFrom3dObjectData(sourceData, bvhToPopulate, vertAttrs=3){

    //take in triangle mesh data.
    //produce bounding volume heirarchy

    var tris = arrayToGroups(sourceData.indices, 3);

    var verts = arrayToGroups(sourceData.vertices, vertAttrs);
    if (vertAttrs!=3){
        verts = verts.map(vert => vert.slice(0,3)); //redundant if vertAttrs=3
    }

    //calculate the whole object's bounds so fit within cube for morton/hilbert
    //AABB would be tighter, but easy to just find furthest point for origin for bounding sphere, wrap this sphere in a cube.
    var boundingSphereDiam = 2* Math.sqrt(verts.reduce((greatest, current) => { 
        return Math.max(greatest, current.reduce((cumul, val) => {return cumul + val*val}, 0));
    }, 0));
    console.log("boundingSphereDiam:" + boundingSphereDiam);

    bvhToPopulate.boundingSphereRadius = boundingSphereDiam/2;
        //NOTE if this is tried to be used to create AABB4d data before is loaded, won't work!

    var temp3Vec = [...new Array(3)];

    //for each triangle, create an AABB.
    //initial version just have an AABB per tri, don't make a tree. can test collision 
    //using this works OK. Then look to make faster by making a tree.
    var trisWithAABB = tris.map( tri => {
        var triVerts = tri.map( idx => verts[idx]);
        
        var components = temp3Vec.map( (_,component) => triVerts.map(vv => vv[component])); //component[0] is array of values of x for each vert
        var minAABB = components.map( minAABBPointsForComponent => minAll(minAABBPointsForComponent));
        var maxAABB = components.map( maxAABBPointsForComponent => maxAll(maxAABBPointsForComponent));

        var normalisedBoxCentre = minAABB.map( (minval, ii) => {return (minval + maxAABB[ii])/boundingSphereDiam;} );  //between -1, 1
        var centreMorton = morton3(normalisedBoxCentre);
        //var centreHilbert = hilbert3(normalisedBoxCentre);

        //calculate triangle normal.
        var edgeVecs = [
            vectorDifference(triVerts[1], triVerts[0]),
            vectorDifference(triVerts[2], triVerts[1]),
            vectorDifference(triVerts[0], triVerts[2])
        ];
        var crossp = crossProduct(edgeVecs[0], edgeVecs[1]);
        var normal = normalise3(crossp);
        
        // if (isNaN(normal[0])){
        //     //seems frigate has some degenerate tris! will do post filter. ideally should clean up 3d model data
        //     console.log({problem:"cross prod is nan!", edgeVecs, crossp, normal} );
        // }

        var distFromOrigin = dotProduct(triVerts[0], normal);

        //edge normals
        var edgeData = edgeVecs.map((edgeVec, ii) => {
            var crossp = crossProduct(edgeVec, normal);
            var edgeNormal = normalise3(crossp);
            var edgeDistFromOrigin = dotProduct(triVerts[ii], edgeNormal);
            return {
                normal: edgeNormal,
                distFromOrigin: edgeDistFromOrigin
            };
        });


        return {
            triangleIndices: tri,
            normal,
            distFromOrigin,
            edgeData,
            AABB: [minAABB, maxAABB],
            centreMorton,    //note only used for ordering. TODO remove once used?
            //centreHilbert
        }
    }).filter(xx => !isNaN(xx.normal[0]));

    trisWithAABB.sort((a,b) => a.centreMorton - b.centreMorton);  //sort by morton code.
    //trisWithAABB.sort((a,b) => a.centreHilbert - b.centreHilbert);  //sort by hilbert code.

    bvhToPopulate.verts = verts;    //suspect only require vertex data.

    trisWithAABB.forEach((tri,ii) => tri.triIdx = ii);   //will use index to look up scale dependent 4d collision data.
    bvhToPopulate.trisWithAABB = trisWithAABB;  //will use this when populating scale dependent 4d collision data.
    //bvhToPopulate.triCollisionData4d = {};  //flat triangle data. is used for sphere collision currently, TODO remove?
    //bvhToPopulate.triCollisionData4dBvh = {};   //per scale bvh. NOTE bvh structure may as well be same for all scales, but for simplicity, 
                                                //just create a bvh for level in question. (in practice so far only 1 scale anyway)

    bvhToPopulate.tris = generateBvh(trisWithAABB, temp3vec, 16);
    bvhToPopulate.isLoaded = true;
    return;
}


function generateBvh(items, tempVec, groupSize){
    //console.log({items});

    if (items.length < 2){  //TODO why is length ever 0?
        //console.log("returning because items of length: " + items.length);
        //console.log(items);
        return items[0];
    }

    var groups = arrayToGroups(items, groupSize);
    //console.log("NUM GROUPS:" + groups.length);
    //console.log({groups});

    var nextLayerUp = groups.map(group => {
        
        var minAABBPoints = tempVec.map( (_,component) => group.map(item => item.AABB[0][component]));
        var minAABB = minAABBPoints.map( minAABBPointsForComponent => minAll(minAABBPointsForComponent));

        var maxAABBPoints = tempVec.map( (_,component) => group.map(item => item.AABB[1][component]));
        var maxAABB = maxAABBPoints.map( maxAABBPointsForComponent => maxAll(maxAABBPointsForComponent));

        // var morton = [
        //     Math.min.apply(null, group.map(item => item.morton[0])),
        //     Math.max.apply(null, group.map(item => item.morton[1]))
        // ];
        // morton for AABB corners. maybe useful for fast coarse AABB check (only compare single value, but false positives)

        var toReturn = {
            group,
            AABB: [minAABB, maxAABB],
            // morton
        };
        return toReturn;
    });

    return generateBvh(nextLayerUp, tempVec, groupSize);
}


function minAll(inputArr){
    return inputArr.reduce((accum, current)=>Math.min(accum, current), Infinity);
}

function maxAll(inputArr){
    return inputArr.reduce((accum, current)=>Math.max(accum, current), -Infinity);
}


function arrayToGroups(initialArray, groupSize){
    https://stackoverflow.com/a/44996257
    //altered to take arbitrary group size instead of hard coded to 2.
    return initialArray.reduce(function(result, value, index, array) {
        if (index % groupSize === 0)
          result.push(array.slice(index, index + groupSize));
        return result;
      }, []);
}

//TODO check input range for 3d use - 4d 3-sphere project might assume between -1, 1...
function morton3(threevec){
    //might be slow and crap! 
    //TODO round up or down the response to this?
    var bitarrays = threevec.map(xx => {

        var intnum = (xx+1)*512;
        intnum = Math.min(intnum, 1023);  //because could be 1024 before this? 
        intnum = Math.max(intnum, 0);

        var bits = [...Array(10)].map((x,i)=>intnum>>i&1);
            //least to most significant 10 bits

        return bits
    } ); //map 0 to 2 to 0 to 2^32

    //console.log(bitarrays);

    var morton 
        = (bitarrays[0][9] << 29)
        + (bitarrays[1][9] << 28)
        + (bitarrays[2][9] << 27)
        + (bitarrays[0][8] << 26)
        + (bitarrays[1][8] << 25)
        + (bitarrays[2][8] << 24)
        + (bitarrays[0][7] << 23)
        + (bitarrays[1][7] << 22)
        + (bitarrays[2][7] << 21)
        + (bitarrays[0][6] << 20)
        + (bitarrays[1][6] << 19)
        + (bitarrays[2][6] << 18)
        + (bitarrays[0][5] << 17)
        + (bitarrays[1][5] << 16)
        + (bitarrays[2][5] << 15)
        + (bitarrays[0][4] << 14)
        + (bitarrays[1][4] << 13)
        + (bitarrays[2][4] << 12)
        + (bitarrays[0][3] << 11)
        + (bitarrays[1][3] << 10)
        + (bitarrays[2][3] << 9)
        + (bitarrays[0][2] << 8)
        + (bitarrays[1][2] << 7)
        + (bitarrays[2][2] << 6)
        + (bitarrays[0][1] << 5)
        + (bitarrays[1][1] << 4)
        + (bitarrays[2][1] << 3)
        + (bitarrays[0][0] << 2)
        + (bitarrays[1][0] << 1)
        + (bitarrays[2][0]);

    return morton;
}

var temp3vec = [...new Array(3)];
