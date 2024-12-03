/**
 * @Instructions
 * 		@task1 : Complete the setTexture function to handle non power of 2 sized textures
 * 		@task2 : Implement the lighting by modifying the fragment shader, constructor,
 *      @task3: BMERVE 29117
 *      @task4: 
 * 		setMesh, draw, setAmbientLight, setSpecularLight and enableLighting functions 
 */


function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	
	var trans1 = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	var rotatXCos = Math.cos(rotationX);
	var rotatXSin = Math.sin(rotationX);

	var rotatYCos = Math.cos(rotationY);
	var rotatYSin = Math.sin(rotationY);

	var rotatx = [
		1, 0, 0, 0,
		0, rotatXCos, -rotatXSin, 0,
		0, rotatXSin, rotatXCos, 0,
		0, 0, 0, 1
	]

	var rotaty = [
		rotatYCos, 0, -rotatYSin, 0,
		0, 1, 0, 0,
		rotatYSin, 0, rotatYCos, 0,
		0, 0, 0, 1
	]

	var test1 = MatrixMult(rotaty, rotatx);
	var test2 = MatrixMult(trans1, test1);
	var mvp = MatrixMult(projectionMatrix, test2);

	return mvp;
}


class MeshDrawer {
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {
		this.prog = InitShaderProgram(meshVS, meshFS); // Initialize shaders
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
		this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');
	
		this.colorLoc = gl.getUniformLocation(this.prog, 'color');
	
		this.vertPosLoc = gl.getAttribLocation(this.prog, 'pos');
		this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');
	
		this.vertbuffer = gl.createBuffer();
		this.texbuffer = gl.createBuffer();
		this.numTriangles = 0;
	
		// Task 2: Initialize lighting variables
		this.lightPosLoc = gl.getUniformLocation(this.prog, 'lightPos');
		this.ambientLoc = gl.getUniformLocation(this.prog, 'ambient');
		this.enableLightingLoc = gl.getUniformLocation(this.prog, 'enableLighting');
		this.specularIntensityLoc = gl.getUniformLocation(this.prog, 'specularIntensity'); // Task 3
		this.shininessLoc = gl.getUniformLocation(this.prog, 'shininess'); // Task 3
		this.enableSpecularLoc = gl.getUniformLocation(this.prog, 'enableSpecular'); // Task 4
		
	}
	
	setSpecularIntensity(intensity) {
		gl.useProgram(this.prog);
		gl.uniform1f(this.specularIntensityLoc, intensity);
	}
	
	setShininess(shininess) {
		gl.useProgram(this.prog);
		gl.uniform1f(this.shininessLoc, shininess);
	}
	
	enableSpecular(enable) { // Task 4
		gl.useProgram(this.prog);
		gl.uniform1i(this.enableSpecularLoc, enable ? 1 : 0);
	}
    // Add setSpecularLight after above methods
    setSpecularLight(enable, intensity, shininess) {
        this.enableSpecular(enable);
        this.setSpecularIntensity(intensity);
        this.setShininess(shininess);
    }
	
	setMesh(vertPos, texCoords, normalCoords) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
	
		// Update texture coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
	
		// Task 2: Bind and buffer normal coordinates
		this.normalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoords), gl.STATIC_DRAW);
	
		this.numTriangles = vertPos.length / 3;
	}
	

	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw(trans) {
		gl.useProgram(this.prog);
	
		gl.uniformMatrix4fv(this.mvpLoc, false, trans);
	
		// Pass dynamically updated light position
		gl.uniform3f(this.lightPosLoc, lightX, lightY, 1.0);
	
		// Pass specular parameters (Task 3)
		gl.uniform1f(this.specularIntensityLoc, 0.5); // Example
		gl.uniform1f(this.shininessLoc, 32); // Example
		gl.uniform1i(this.enableSpecularLoc, 1); // Enable specular lighting (Task 4)
	
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.enableVertexAttribArray(this.vertPosLoc);
		gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);
	
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.enableVertexAttribArray(this.texCoordLoc);
		gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);
	
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.enableVertexAttribArray(this.normalLoc);
		gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);
	
		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}
	
	
	

	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img) {
		const texture = gl.createTexture(); // Create a texture object
		gl.bindTexture(gl.TEXTURE_2D, texture); // Bind it as a 2D texture
	
		// Set the texture image data using the provided HTML image element
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,                // Mipmap level
			gl.RGB,           // Internal format
			gl.RGB,           // Format of the source image
			gl.UNSIGNED_BYTE, // Data type
			img               // The image source
		);
	
		// Task 1: Handle non-power-of-2 sized textures
		if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
			gl.generateMipmap(gl.TEXTURE_2D); // Generate mipmaps for power-of-2 textures
		} else {
			// Implement non-power-of-2 texture handling here
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			console.log("Non-power-of-2 texture handled successfully."); // Log confirmation
		}
	
		// Bind the texture to texture unit 0 and link it to the shader
		gl.useProgram(this.prog);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		const sampler = gl.getUniformLocation(this.prog, 'tex');
		gl.uniform1i(sampler, 0);
	}
	

	showTexture(show) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.showTexLoc, show);
	}

enableLighting(enable) {
    gl.useProgram(this.prog);
    gl.uniform1i(this.enableLightingLoc, enable ? 1 : 0);
}

setAmbientLight(ambient) {
    gl.useProgram(this.prog);
    gl.uniform1f(this.ambientLoc, ambient);
}

}


function isPowerOf2(value) {
	return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
	dst = dst || new Float32Array(3);
	var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	// make sure we don't divide by 0.
	if (length > 0.00001) {
		dst[0] = v[0] / length;
		dst[1] = v[1] / length;
		dst[2] = v[2] / length;
	}
	return dst;
}

// Vertex shader source code
const meshVS = `
			attribute vec3 pos; 
			attribute vec2 texCoord; 
			attribute vec3 normal;

			uniform mat4 mvp; 

			varying vec2 v_texCoord; 
			varying vec3 v_normal; 

			void main()
			{
				v_texCoord = texCoord;
				v_normal = normal;

				gl_Position = mvp * vec4(pos,1);
			}`;

// Fragment shader source code
/**
 * @Task2 : You should update the fragment shader to handle the lighting
 */
const meshFS = `
precision mediump float;

uniform bool showTex;
uniform bool enableLighting;
uniform bool enableSpecular; // Task 4
uniform sampler2D tex;
uniform vec3 lightPos;
uniform float ambient;
uniform float specularIntensity; // Task 3
uniform float shininess; // Task 3

varying vec2 v_texCoord;
varying vec3 v_normal;

void main() {
    vec3 normal = normalize(v_normal);
    vec3 lightDir = normalize(lightPos);
    float diffuse = max(dot(normal, lightDir), 0.0);

    // Specular lighting (Task 3)
    float specular = 0.0;
    if (enableSpecular) {
        vec3 viewDir = vec3(0.0, 0.0, 1.0);
        vec3 reflectDir = reflect(-lightDir, normal);
        specular = pow(max(dot(viewDir, reflectDir), 0.0), shininess) * specularIntensity;
    }

    // Combine lighting components
    float lighting = ambient + diffuse + specular;

    if (showTex && enableLighting) {
        vec4 texColor = texture2D(tex, v_texCoord);
        gl_FragColor = vec4(texColor.rgb * lighting, texColor.a);
    } else if (showTex) {
        gl_FragColor = texture2D(tex, v_texCoord);
    } else {
        gl_FragColor = vec4(vec3(1.0) * lighting, 1.0);
    }
}
`;



// Light direction parameters for Task 2
var lightX = 1;
var lightY = 1;

const keys = {};
function updateLightPos() {
	const translationSpeed = 0.1; // Adjust speed for finer control
	if (keys['ArrowUp']) lightY += translationSpeed;    // Move light up
	if (keys['ArrowDown']) lightY -= translationSpeed;  // Move light down
	if (keys['ArrowRight']) lightX += translationSpeed; // Move light right
	if (keys['ArrowLeft']) lightX -= translationSpeed;  // Move light left
}

///////////////////////////////////////////////////////////////////////////////////