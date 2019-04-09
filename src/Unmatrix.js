// import { Matrix, Vector } from 'Sylvester'

class Unmatrix {
  // Convert radians to degrees
  radToDeg (rad) {
    return rad * (180 / Math.PI);
  }

  // Determinant of a matrix
  matrixDeterminant (matrix) {
    return Matrix(matrix).determinant();
  }

  // Inverse of a matrix
  matrixInverse (matrix) {
    return Matrix(matrix).inverse().elements;
  }

  // Transpose of a matrix
  matrixTranspose (matrix) {
    return Matrix(matrix).transpose().elements;
  }

  // Multiply a vector by a matrix and returns the transformed vector
  transformVectorByMatrix (vector, matrix) {
    return Matrix(matrix).multiply(vector).elements;
  }

  // Get the length of a vector
  vectorLength (vector) {
    return Vector(vector).modulus();
  }

  // Normalize the length of a vector to 1
  normalizeVector (vector) {
    return Vector(vector).toUnitVector().elements;
  }

  // Dot product of two vectors
  vectorDot (vector1, vector2) {
    return Vector(vector1).dot(vector2);
  }

  // Cross product of two vectors
  vectorCross (vector1, vector2) {
    return Vector(vector1).cross(vector2).elements;
  }

  // TODO: Explain this function
  combine (a, b, ascl, bscl) {
    let result = [];
    result[0] = (ascl * a[0]) + (bscl * b[0]);
    result[1] = (ascl * a[1]) + (bscl * b[1]);
    // Both vectors are 3d. Return a 3d vector
    if (a.length === 3 && b.length === 3) {
      result[2] = (ascl * a[2]) + (bscl * b[2]);
    }
    return result;
  }

  // Return a transform object if matrix can be decomposed, null if it can't
  decomposeMatrix (matrix) {
    let transform = {};

    // Normalize the matrix
    if (matrix[3][3] === 0) {
      return null;
    }

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        matrix[i][j] /= matrix[3][3];
      }
    }

    // perspectiveMatrix is used to solve for perspective, but it also provides
    // an easy way to test for singularity of the upper 3x3 component
    let perspectiveMatrix = matrix;

    for (let i = 0; i < 3; i++) {
      perspectiveMatrix[i][3] = 0;
    }

    perspectiveMatrix[3][3] = 1;

    if (matrixDeterminant(perspectiveMatrix) === 0) {
      return null;
    }

    // First, isolate perspective
    let perspective;
    if (matrix[0][3] !== 0 || matrix[1][3] !== 0 || matrix[2][3] !== 0) {
      // rightHandSide is the right hand side of the equation
      let rightHandSide = [];
      rightHandSide[0] = matrix[0][3];
      rightHandSide[1] = matrix[1][3];
      rightHandSide[2] = matrix[2][3];
      rightHandSide[3] = matrix[3][3];

      // Solve the equation by inverting perspectiveMatrix and multiplying
      // rightHandSide by the inverse
      let perspectiveMatrixInverse = matrixInverse(perspectiveMatrix);
      let perspectiveMatrixInverseTranspose = matrixTranspose(inversePerspectiveMatrix);
      perspective = transformVectorByMatrix(rightHandSide, perspectiveMatrixInverseTranspose);

      // Clear the perspective partition
      matrix[0][3] = matrix[1][3] = matrix[2][3] = 0;
      matrix[3][3] = 1;
    }
    else {
      // No perspective
      perspective = [];
      perspective[0] = perspective[1] = perspective[2] = 0;
      perspective[3] = 1;
    }

    // Next take care of translation
    transform.translateX = matrix[3][0];
    transform.translateY = matrix[3][1];
    transform.translateZ = matrix[3][2];

    // Now get scale and shear
    // row is a 3 element array of 3 component vectors
    let row = [[], [], []];

    for (let i = 0; i < 3; i++) {
      row[i][0] = matrix[i][0];
      row[i][1] = matrix[i][1];
      row[i][2] = matrix[i][2];
    }

    // Compute X scale factor and normalize first row
    let scaleX = vectorLength(row[0]);
    row[0] = normalizeVector(row[0]);

    // Compute XY shear factor and make 2nd row orthogonal to 1st
    let skew = vectorDot(row[0], row[1]);
    row[1] = combine(row[1], row[0], 1.0, -skew);

    // Now, compute Y scale and normalize 2nd row
    let scaleY = vectorLength(row[1]);
    row[1] = normalizeVector(row[1]);
    skew /= scaleY;

    // Compute XZ and YZ shears, orthogonalize 3rd row
    let skewX = vectorDot(row[0], row[2]);
    row[2] = combine(row[2], row[0], 1.0, -skewX);
    let skewY = vectorDot(row[1], row[2]);
    row[2] = combine(row[2], row[1], 1.0, -skewY);

    // Next, get Z scale and normalize 3rd row
    let scaleZ = vectorLength(row[2]);
    row[2] = normalizeVector(row[2]);
    skewX /= scaleZ;
    skewY /= scaleZ;

    transform.skewX = radToDeg(skewX);
    transform.skewY = radToDeg(skewY);

    // At this point, the matrix (in rows) is orthonormal. Check for a
    // coordinate system flip. If the determinant is -1, then negate the
    // matrix and the scaling factors
    let pdum3 = vectorCross(row[1], row[2]);

    if (vectorDot(row[0], pdum3) < 0) {
      for (let i = 0; i < 3; i++) {
        scaleX *= -1;
        row[i][0] *= -1;
        row[i][1] *= -1;
        row[i][2] *= -1;
      }
    }

    transform.scaleX = scaleX;
    transform.scaleY = scaleY;
    transform.scaleZ = scaleZ;

    // Get the rotations
    transform.rotateY = Math.asin(-row[0][2]);
    if (Math.cos(transform.rotateY) !== 0) {
      transform.rotateX = Math.atan2(row[1][2], row[2][2]);
      transform.rotateZ = Math.atan2(row[0][1], row[0][0]);
    }
    else {
      transform.rotateX = Math.atan2(-row[2][0], row[1][1]);
      transform.rotateZ = 0;
    }

    return transform;
  }

  // Returns an object with transform properties
  static getTransform (element) {
    // Check if element is an HTML element
    if (!(element instanceof HTMLElement)) {
      return null;
    }

    // Check if element has transforms
    let computedStyle = getComputedStyle(element);
    if (!('transform' in computedStyle) || computedStyle.transform === 'none') {
      return null;
    }

    let transform = computedStyle.transform;

    // Check if transform is 3d
    let is3d = transform.includes('matrix3d');

    // Convert matrix values to an array of floats
    transform = transform.match(/\((.+)\)/)[1];
    transform = transform.split(',');
    t = transform.map(value => parseFloat(value))

    // Convert transform to a matrix. Matrix columns become arrays
    let matrix = is3d
      ? [ // Create 4x4 3d matrix
          [ t[0],  t[1],  t[2],  t[3]  ],
          [ t[4],  t[5],  t[6],  t[7]  ],
          [ t[8],  t[9],  t[10], t[11] ],
          [ t[12], t[13], t[14], t[15] ]
        ]
      : [ // Create 4x4 2d matrix
          [ t[0],  t[1],  0,     0 ],
          [ t[2],  t[3],  0,     0 ],
          [ 0,     0,     1,     0 ],
          [ t[4],  t[5],  0,     1 ]
        ];
    console.log(t);
    // return decomposeMatrix(matrix);
  }
}

export default Unmatrix;
