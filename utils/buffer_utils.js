function bufferArrayData(buffer, arr, size){
    bufferArrayDataGeneral(buffer, new Float32Array(arr), size);
}

function bufferArrayDataGeneral(buffer, arr, size){
   //console.log("size:" + size);
   gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
   gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
   buffer.itemSize = size;
   buffer.numItems = arr.length / size;
}

function loadBufferData(bufferObj, sourceData){

    bufferObj.vertexPositionBuffer = gl.createBuffer();
    bufferArrayData(bufferObj.vertexPositionBuffer, sourceData.vertices, sourceData.vertices_len || 3);
    if (sourceData.uvcoords){
        bufferObj.vertexTextureCoordBuffer= gl.createBuffer();
        bufferArrayData(bufferObj.vertexTextureCoordBuffer, sourceData.uvcoords, 2);
    }
    if (sourceData.velocities){	//for exploding objects
        bufferObj.vertexVelocityBuffer= gl.createBuffer();
        bufferArrayData(bufferObj.vertexVelocityBuffer, sourceData.velocities, 3);
    }
    if (sourceData.normals){
        bufferObj.vertexNormalBuffer= gl.createBuffer();
        bufferArrayData(bufferObj.vertexNormalBuffer, sourceData.normals, 3);
    }
    if (sourceData.tangents){
        bufferObj.vertexTangentBuffer= gl.createBuffer();
        bufferArrayData(bufferObj.vertexTangentBuffer, sourceData.tangents, 3);
    }
    if (sourceData.binormals){
        bufferObj.vertexBinormalBuffer= gl.createBuffer();
        bufferArrayData(bufferObj.vertexBinormalBuffer, sourceData.binormals, 3);
    }
    bufferObj.vertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferObj.vertexIndexBuffer);
    
    bufferObj.use32BitIndices = sourceData.vertices.length > sourceData.vertices_len * 65536;

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bufferObj.use32BitIndices? new Uint32Array(sourceData.indices): new Uint16Array(sourceData.indices), gl.STATIC_DRAW);
    bufferObj.vertexIndexBuffer.itemSize = 3;
    bufferObj.vertexIndexBuffer.numItems = sourceData.indices.length;
}


