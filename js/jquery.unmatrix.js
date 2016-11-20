;(function ($, S, window, document) {
    // Converts radians to degrees
    var deg = function (rad) {
        return rad * (180 / Math.PI);
    };

    // Returns the determinant of matrix
    var determinant = function (matrix) {
        return S.Matrix(matrix).determinant();
    };

    // Returns the inverse of matrix
    var inverse = function (matrix) {
        return S.Matrix(matrix).inverse().elements;
    };

    // Returns the transpose of matrix
    var transpose = function (matrix) {
        return S.Matrix(matrix).transpose().elements;
    };

    // Multiplies vector by matrix and returns the transformed vector
    var multiplyVectorMatrix = function (vector, matrix) {
        return S.Matrix(matrix).multiply(vector).elements;
    };

    // Returns the length of vector
    var length = function (vector) {
        return S.Vector(vector).modulus();
    };

    // Normalizes the length of vector to 1
    var normalize = function (vector) {
        return S.Vector(vector).toUnitVector().elements;
    };

    // Returns the dot product of two points
    var dot = function (vector1, vector2) {
        return S.Vector(vector1).dot(vector2);
    };

    // Returns the cross product of two vectors
    var cross = function (vector1, vector2) {
        return S.Vector(vector1).cross(vector2).elements;
    };

    var combine = function (a, b, ascl, bscl) {
        var result = [];
        result[0] = (ascl * a[0]) + (bscl * b[0]);
        result[1] = (ascl * a[1]) + (bscl * b[1]);
        // Both vectors are 3d. Return a 3d vector
        if (a.length === 3 && b.length === 3) {
            result[2] = (ascl * a[2]) + (bscl * b[2]);
        }
        return result;
    };

    // Returns null if the matrix cannot be decomposed, an object if it can
    var unmatrix = function (matrix) {
        var rotateX;
        var rotateY;
        var rotateZ;
        var scaleX;
        var scaleY;
        var scaleZ;
        var skew;
        var skewX;
        var skewY;
        var translateX;
        var translateY;
        var translateZ;

        // Normalize the matrix
        if (matrix[3][3] === 0) {
            return null;
        }

        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 4; j++) {
                matrix[i][j] /= matrix[3][3];
            }
        }

        // perspectiveMatrix is used to solve for perspective, but it also
        // provides an easy way to test for singularity of the upper 3x3
        // component
        var perspectiveMatrix = matrix;

        for (var i = 0; i < 3; i++) {
            perspectiveMatrix[i][3] = 0;
        }

        perspectiveMatrix[3][3] = 1;

        if (determinant(perspectiveMatrix) === 0) {
           return null;
        }

        // First, isolate perspective
        var perspective;
        if (matrix[0][3] !== 0 || matrix[1][3] !== 0 || matrix[2][3] !== 0) {
            // rightHandSide is the right hand side of the equation
            var rightHandSide = [];
            rightHandSide[0] = matrix[0][3];
            rightHandSide[1] = matrix[1][3];
            rightHandSide[2] = matrix[2][3];
            rightHandSide[3] = matrix[3][3];

            // Solve the equation by inverting perspectiveMatrix and multiplying
            // rightHandSide by the inverse
            var inversePerspectiveMatrix = inverse(perspectiveMatrix);
            var transposedInversePerspectiveMatrix = transpose(inversePerspectiveMatrix);
            perspective = multiplyVectorMatrix(rightHandSide, transposedInversePerspectiveMatrix);

            // Clear the perspective partition
            matrix[0][3] = matrix[1][3] = matrix[2][3] = 0;
            matrix[3][3] = 1;
        } else {
            // No perspective
            perspective = [];
            perspective[0] = perspective[1] = perspective[2] = 0;
            perspective[3] = 1;
        }

        // Next take care of translation
        translateX = matrix[3][0];
        //matrix[3][0] = 0;
        translateY = matrix[3][1];
        //matrix[3][1] = 0;
        translateZ = matrix[3][2];
        //matrix[3][2] = 0;

        // Now get scale and shear. "row" is a 3 element array of 3 component
        // vectors
        var row = [[], [], []];

        for (var i = 0; i < 3; i++) {
            row[i][0] = matrix[i][0];
            row[i][1] = matrix[i][1];
            row[i][2] = matrix[i][2];
        }

        // Compute X scale factor and normalize first row
        scaleX = length(row[0]);
        row[0] = normalize(row[0]);

        // Compute XY shear factor and make 2nd row orthogonal to 1st
        skew = dot(row[0], row[1]);
        row[1] = combine(row[1], row[0], 1.0, -skew);

        // Now, compute Y scale and normalize 2nd row
        scaleY = length(row[1]);
        row[1] = normalize(row[1]);
        skew /= scaleY;

        // Compute XZ and YZ shears, orthogonalize 3rd row
        skewX = dot(row[0], row[2]);
        row[2] = combine(row[2], row[0], 1.0, -skewX);
        skewY = dot(row[1], row[2]);
        row[2] = combine(row[2], row[1], 1.0, -skewY);

        // Next, get Z scale and normalize 3rd row
        scaleZ = length(row[2]);
        row[2] = normalize(row[2]);
        skewX /= scaleZ;
        skewY /= scaleZ;

        // At this point, the matrix (in rows) is orthonormal. Check for a
        // coordinate system flip. If the determinant is -1, then negate the
        // matrix and the scaling factors
        var pdum3 = cross(row[1], row[2]);

        if (dot(row[0], pdum3) < 0) {
            for (var i = 0; i < 3; i++) {
                scaleX *= -1;
                row[i][0] *= -1;
                row[i][1] *= -1;
                row[i][2] *= -1;
            }
        }

        // Get the rotations
        rotateY = Math.asin(-row[0][2]);
        if (Math.cos(rotateY) !== 0) {
            rotateX = Math.atan2(row[1][2], row[2][2]);
            rotateZ = Math.atan2(row[0][1], row[0][0]);
        } else {
            rotateX = Math.atan2(-row[2][0], row[1][1]);
            rotateZ = 0;
        }

        return {
            rotate:     deg(rotateZ),
            rotateX:    deg(rotateX),
            rotateY:    deg(rotateY),
            rotateZ:    deg(rotateZ),
            scaleX:     scaleX,
            scaleY:     scaleY,
            scaleZ:     scaleZ,
            skew:       deg(skew),
            skewX:      deg(skewX),
            skewY:      deg(skewY),
            translateX: translateX,
            translateY: translateY,
            translateZ: translateZ
        };
    };

    // Returns an object with transform properties
    var getTransforms = function (cssTransforms) {
        // Check if the transform is 3d
        var is3d = cssTransforms.indexOf("matrix3d") > -1;

        // Convert matrix values to an array
        var transforms = cssTransforms.match(/[\d\s\.\,\-]+(?!d)/)[0];
        var values = transforms.split(",");

        // Convert values to floats
        for (var i = 0, l = values.length; i < l; i++) {
            values[i] = parseFloat(values[i]);
        }

        // Matrix columns become arrays
        var matrix = is3d ? [ // Create 4x4 3d matrix
                                [values[0],   values[1],  values[2],  values[3]],
                                [values[4],   values[5],  values[6],  values[7]],
                                [values[8],   values[9],  values[10], values[11]],
                                [values[12],  values[13], values[14], values[15]]
                            ] :
                            [ // Create 4x4 2d matrix
                                [values[0],   values[1],  0,          0],
                                [values[2],   values[3],  0,          0],
                                [0,           0,          1,          0],
                                [values[4],   values[5],  0,          1]
                            ];

        return unmatrix(matrix);
    };

    $.fn.unmatrix = function () {
        var properties = ["transform", "MozTransform", "msTransform", "OTransform", "webkitTransform"];
        var transformProperty = "";

        // Check if browser supports transforms
        $.each(properties, function (index, property) {
            if (property in document.body.style) {
                transformProperty = property;
                return;
            }
        });

        if (!transformProperty) {
            // Browser does not support transforms
            return false;
        } else {
            // Browser supports transforms
            var allTransforms = [];

            this.each(function () {
                var cssTransforms = $(this).css(transformProperty);
                var transforms = cssTransforms !== "none" ?
                                getTransforms(cssTransforms) :
                                {};
                allTransforms.push(transforms);
            });

            return allTransforms;
        }
    };
})(jQuery, Sylvester, window, document);
